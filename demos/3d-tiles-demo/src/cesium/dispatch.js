// 消防车自动布点：移植自 ordos FindNearestPosition.js 的三重约束，
// 但改为在本地 ENU 平面上做纯 2D 计算（ordos 是 3D Cartesian + ENU 往返转换，等价但更绕）。
//   1) 风向禁区：把传入风向 +180° 后 ±windRange 构成扇区，落在扇区内的路段剔除
//      （即车只会被布到「传入风向的反向侧」，与 ordos setWindDirection 的 (angle+180)%360 一致）
//   2) 事故点安全距离：距 center < safeDistance 的路段剔除（ordos 默认 80m）
//   3) 车间最小间距：已布车辆周围 minVehicleDistance 内的路段剔除（ordos 默认 30~100m）
// 方位角约定：0=正北、90=正东（罗盘方位，顺时针）。

const TAU = Math.PI * 2
const norm = (a) => {
  const t = a % TAU
  return t < 0 ? t + TAU : t
}
// 由位移 (dx=东, dy=北) 求罗盘方位角（弧度，[0,2π)）
const bearing = (dx, dy) => norm(Math.atan2(dx, dy))

// 线段 a->b 上与 c 最近的点（投影并夹取到线段内）
function closestPoint(c, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  let t = 0
  if (len2 > 1e-12) {
    t = ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / len2
    t = Math.max(0, Math.min(1, t))
  }
  const e = a[0] + dx * t
  const n = a[1] + dy * t
  return { t, e, n, distance: Math.hypot(e - c[0], n - c[1]) }
}

// 保留线段在圆 (c, r) 之外的部分（即剔除距 c < r 的区段），返回 0~2 段
function clipOutsideCircle(a, b, c, r) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const fx = a[0] - c[0]
  const fy = a[1] - c[1]
  const A = dx * dx + dy * dy
  if (A < 1e-12) return Math.hypot(fx, fy) < r ? [] : [[a, b]]
  const B = 2 * (fx * dx + fy * dy)
  const C = fx * fx + fy * fy - r * r
  const disc = B * B - 4 * A * C
  if (disc <= 0) return [[a, b]] // 与圆无实交点 → 整段都在圆外
  const sq = Math.sqrt(disc)
  const t0 = (-B - sq) / (2 * A)
  const t1 = (-B + sq) / (2 * A)
  const i0 = Math.max(t0, 0)
  const i1 = Math.min(t1, 1)
  if (i1 <= i0) return [[a, b]] // 圆在线段延伸外 → 整段保留
  const pt = (t) => [a[0] + dx * t, a[1] + dy * t]
  const out = []
  if (i0 > 1e-9) out.push([pt(0), pt(i0)])
  if (i1 < 1 - 1e-9) out.push([pt(i1), pt(1)])
  return out
}

// 保留线段在扇区 (apex, startAngle, width) 之外的部分，返回 0~n 段
function clipOutsideSector(a, b, apex, startAngle, width) {
  const inSector = (p) => norm(bearing(p[0] - apex[0], p[1] - apex[1]) - startAngle) <= width
  // 求线段与扇区两条边界射线的交点参数 t
  const ts = []
  const addCross = (ang) => {
    const ux = Math.sin(ang) // 东分量
    const uy = Math.cos(ang) // 北分量
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const ax = a[0] - apex[0]
    const ay = a[1] - apex[1]
    // a + t*d = apex + s*u  →  [dx -ux; dy -uy][t; s] = [ax; ay]
    const det = dx * -uy - -ux * dy
    if (Math.abs(det) < 1e-12) return
    const t = (ax * -uy - -ux * ay) / det
    const s = (dx * ay - dy * ax) / det
    if (t > 1e-9 && t < 1 - 1e-9 && s > 0) ts.push(t)
  }
  addCross(startAngle)
  addCross(norm(startAngle + width))
  if (ts.length === 0) return inSector([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) ? [] : [[a, b]]
  ts.sort((x, y) => x - y)
  const splits = [0, ...ts, 1]
  const pt = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const out = []
  for (let i = 0; i < splits.length - 1; i++) {
    const t0 = splits[i]
    const t1 = splits[i + 1]
    if (t1 - t0 < 1e-9) continue
    const m = pt((t0 + t1) / 2)
    if (!inSector(m)) out.push([pt(t0), pt(t1)])
  }
  return out
}

/**
 * 在路网上为事故点挑选消防车停靠位。
 * @param {Object} opts
 *   center            [e, n] 事故点（本地米）
 *   roads             [[a, b], ...] 路段数组（本地米）
 *   windDirection     风向（度，0=北）
 *   windRange         风向禁区半角（度），ordos 用 60/90
 *   count             车辆数（ordos 默认 3）
 *   safeDistance      距事故点安全距离（米），ordos 默认 80
 *   minVehicleDistance 车间最小间距（米），ordos 默认 30~100
 * @returns [{ e, n, direction, distance }] direction=车头朝向(罗盘方位·度)
 */
export function findFireVehiclePositions({
  center,
  roads = [],
  windDirection = 0,
  windRange = 60,
  count = 3,
  safeDistance = 80,
  minVehicleDistance = 100,
}) {
  // ordos: angle = (angle + 180) % 360 再 ±range
  const secCenter = norm(((windDirection + 180) * Math.PI) / 180)
  const half = (windRange * Math.PI) / 180
  const secStart = norm(secCenter - half)
  const secWidth = half * 2

  // 1) 风向禁区剔除
  let segs = []
  for (const [a, b] of roads) segs.push(...clipOutsideSector(a, b, center, secStart, secWidth))

  // 2) 事故点安全距离剔除
  const clipped = []
  for (const [a, b] of segs) clipped.push(...clipOutsideCircle(a, b, center, safeDistance))
  segs = clipped

  const placed = []
  for (let k = 0; k < count; k++) {
    // 3) 车间最小间距剔除（对每辆已布车辆各做一次圆剔除）
    if (placed.length) {
      let cur = segs
      for (const p of placed) {
        const out = []
        for (const [a, b] of cur) out.push(...clipOutsideCircle(a, b, [p.e, p.n], minVehicleDistance))
        cur = out
      }
      segs = cur
    }
    if (!segs.length) break

    // 取距事故点最近的候选点
    let best = null
    for (const [a, b] of segs) {
      const cp = closestPoint(center, a, b)
      if (!best || cp.distance < best.distance) best = { ...cp, a, b }
    }
    if (!best) break

    // 车头朝向 = 所在路段的罗盘方位
    const direction = norm(Math.atan2(best.b[0] - best.a[0], best.b[1] - best.a[1])) * 180 / Math.PI
    placed.push({ e: best.e, n: best.n, direction, distance: best.distance })
  }

  // 兜底：若路网剔除后无候选（事故点远离路网，火警本就不需要在路线上），
  // 直接在事故点周边按环形布点，保证每起火警都能放出 count 辆车。
  if (placed.length < count) {
    const ringR = safeDistance > 0 ? safeDistance + 15 : 90
    for (let k = placed.length; k < count; k++) {
      const ang = secCenter + (k * TAU) / count
      const e = center[0] + ringR * Math.sin(ang)
      const n = center[1] + ringR * Math.cos(ang)
      placed.push({ e, n, direction: (ang * 180) / Math.PI, distance: ringR })
    }
  }
  return placed
}
