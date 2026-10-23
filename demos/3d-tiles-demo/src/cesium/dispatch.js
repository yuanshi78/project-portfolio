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
// 扇区是以 apex 为顶点、张角 width 的无限楔形（下风向禁区）。
// 用递归细分：长路段跨边界时也能正确裁掉（旧实现只查与两条边界射线的交点，
// 对「穿过整个楔形」或跨越边界但中点恰在外侧的路段会漏裁，导致下风向残留）。
function clipOutsideSector(a, b, apex, startAngle, width) {
  const inSector = (p) => norm(bearing(p[0] - apex[0], p[1] - apex[1]) - startAngle) <= width
  const rec = (a, b) => {
    const inA = inSector(a)
    const inB = inSector(b)
    if (!inA && !inB) return [[a, b]] // 整段在禁区外 → 保留
    if (inA && inB) return [] // 整段在禁区内 → 剔除
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 2) return [] // 跨边界且极短 → 丢弃，避免残留
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    return [...rec(a, m), ...rec(m, b)]
  }
  return rec(a, b)
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
  margin = 20,
}) {
  // ordos: angle = (angle + 180) % 360 再 ±range
  const secCenter = norm(((windDirection + 180) * Math.PI) / 180)
  const half = (windRange * Math.PI) / 180
  const secStart = norm(secCenter - half)
  const secWidth = half * 2

  // 1) 风向禁区剔除
  let segs = []
  for (const [a, b] of roads) segs.push(...clipOutsideSector(a, b, center, secStart, secWidth))

  // 2) 事故点安全距离剔除。
  //    注意：裁剪半径用 safeDistance + margin，让候选停车点严格落在圈外、并留出余量。
  //    否则停车点会贴着 safeDistance 边界（浮点下常算成 < safeDistance），
  //    导致路由时「直连引道」被判为穿圈而无法接入路网，最终兜底直线穿火。
  const clipR = safeDistance + margin
  const clipped = []
  for (const [a, b] of segs) clipped.push(...clipOutsideCircle(a, b, center, clipR))
  segs = clipped

  // 上风中心方位（消防车主攻方向）= 风向的反向（与下风 secCenter 相差 180°）
  const upwind = norm((windDirection * Math.PI) / 180)
  // 两翼偏角：在主攻方向左右各 flank，形成对火点的夹击。
  // 取 windRange 量级（上限 60°）保证两翼仍在安全上风弧内、不落入下风禁区。
  const flank = Math.min(windRange, 60) * Math.PI / 180

  // 为每辆车分配一个「目标方位」：0 号正上风主攻，其余沿上风弧向左/右两翼展开
  const targets = []
  if (count <= 1) {
    targets.push(upwind)
  } else {
    for (let k = 0; k < count; k++) {
      const frac = k / (count - 1) - 0.5 // -0.5 .. 0.5
      targets.push(norm(upwind + frac * 2 * flank))
    }
  }

  const angDiff = (a, b) => {
    let d = norm(a - b)
    if (d > Math.PI) d -= TAU
    return Math.abs(d)
  }

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

    // 取「方位最接近本车目标方向」且尽量靠近事故点的候选点，
    // 使多车沿上风弧分扇区展开（主攻 + 两翼），而非全挤在最近点。
    const target = targets[k]
    let best = null
    let bestScore = Infinity
    for (const [a, b] of segs) {
      const cp = closestPoint(center, a, b)
      const bpt = bearing(cp.e - center[0], cp.n - center[1])
      const da = angDiff(bpt, target)
      const score = da + cp.distance * 0.0008 // 优先对正目标方位，其次靠近火点
      if (score < bestScore) {
        bestScore = score
        best = { ...cp, a, b }
      }
    }
    if (!best) break

    // 车头朝向 = 所在路段的罗盘方位
    const direction = norm(Math.atan2(best.b[0] - best.a[0], best.b[1] - best.a[1])) * 180 / Math.PI
    placed.push({ e: best.e, n: best.n, direction, distance: best.distance })
  }

  // 兜底：若路网剔除后无候选（事故点远离路网），直接在上风安全弧内按环形布点，
  // 保证每起火警都能放出 count 辆车（且仍在圈外、上风侧）。
  if (placed.length < count) {
    const ringR = safeDistance > 0 ? safeDistance + margin + 15 : 90
    const arcStart = secCenter + half // 上风安全弧起点
    const arcEnd = secCenter + TAU - half // 上风安全弧终点
    for (let k = placed.length; k < count; k++) {
      const ang = arcStart + ((k - placed.length + 1) / (count - placed.length + 1)) * (arcEnd - arcStart)
      const e = center[0] + ringR * Math.sin(ang)
      const n = center[1] + ringR * Math.cos(ang)
      placed.push({ e, n, direction: (ang * 180) / Math.PI, distance: ringR })
    }
  }
  return placed
}
