// 路网寻路：给消防车的「行驶动画」用。
// 做法：把路段在「与其它路段的交点」「出发点的投影点」「目标点」处切分，
//       用所有切分点建图（交点即十字路口），再 Dijkstra 求最短路。
// 坐标均为本地 ENU 米（东=e、北=n）。

// 点 p 到线段 a->b 的最近点
export function nearestPointOnSegment(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  let t = len2 > 1e-12 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2 : 0
  t = Math.max(0, Math.min(1, t))
  return { t, point: [a[0] + dx * t, a[1] + dy * t] }
}

// 两线段求交：p1+t·d1 = p3+u·d2，返回各自参数与交点；平行/不相交返回 null
export function segIntersect(p1, p2, p3, p4) {
  const d1x = p2[0] - p1[0]
  const d1y = p2[1] - p1[1]
  const d2x = p4[0] - p3[0]
  const d2y = p4[1] - p3[1]
  const den = d1x * d2y - d1y * d2x
  if (Math.abs(den) < 1e-12) return null // 平行（含共线）
  const rx = p3[0] - p1[0]
  const ry = p3[1] - p1[1]
  const t = (rx * d2y - ry * d2x) / den
  const u = (rx * d1y - ry * d1x) / den
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { t, u, point: [p1[0] + d1x * t, p1[1] + d1y * t] }
}

// 线段 p-q 是否进入以 c 为圆心、r 为半径的圆内（用于让消防车绕开火灾危险区）
function segNearCircle(p, q, c, r) {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const fx = p[0] - c[0]
  const fy = p[1] - c[1]
  const len2 = dx * dx + dy * dy
  let t = len2 > 1e-12 ? -((fx * dx + fy * dy) / len2) : 0
  t = Math.max(0, Math.min(1, t))
  const cx = p[0] + dx * t
  const cy = p[1] + dy * t
  return Math.hypot(cx - c[0], cy - c[1]) < r
}

const keyOf = (p) => p[0].toFixed(3) + ',' + p[1].toFixed(3)

// 去重（去掉相邻重复点），避免动画出现 0 长度段
function dedupe(pts) {
  const out = []
  for (const p of pts) {
    const last = out[out.length - 1]
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 1e-6) out.push(p)
  }
  return out
}

/**
 * 求 from 沿路网行驶到 to 的折线路径。
 * @param avoid 可选 { center:[e,n], radius:r }：建图时剔除穿过该圆的路段（火灾危险区），
 *              让消防车行驶途中也不进入危险范围；绕开导致不连通时退化为不绕开。
 * @returns [[e,n], ...]（含 from 与 to），不连通时退化为 [from, to] 直线
 */
export function routeAlongRoads(segments, from, to, avoid = null) {
  if (!segments || !segments.length) return [from, to]

  // 1) from / to 在路网上的「最近且直连不穿危险圈」的投影点。
  //    只把 from/to 接到最近的、安全的路网接入点（短引道），避免 Dijkstra 用路网节点「抄近道」越野直驶。
  const safeConnect = (p, q) => !(avoid && segNearCircle(p, q, avoid.center, avoid.radius))
  let bestF = null
  let bestT = null
  segments.forEach(([a, b], i) => {
    const f = nearestPointOnSegment(from, a, b)
    const t = nearestPointOnSegment(to, a, b)
    const df = Math.hypot(f.point[0] - from[0], f.point[1] - from[1])
    const dt = Math.hypot(t.point[0] - to[0], t.point[1] - to[1])
    if (safeConnect(from, f.point) && (!bestF || df < bestF.d)) bestF = { ...f, i, d: df }
    if (safeConnect(to, t.point) && (!bestT || dt < bestT.d)) bestT = { ...t, i, d: dt }
  })
  // 无安全直连（极端情形）→ 退化为不绕开（仍走最短路，但不保证不进圈）
  if (!bestF || !bestT) return routeAlongRoads(segments, from, to)

  // 2) 收集每条路段上的切分点：端点 + 与其它路段的交点 + 起终点投影
  const cutsBySeg = segments.map(([a, b]) => [{ t: 0, p: a }, { t: 1, p: b }])
  cutsBySeg[bestF.i].push({ t: bestF.t, p: bestF.point })
  cutsBySeg[bestT.i].push({ t: bestT.t, p: bestT.point })
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const hit = segIntersect(segments[i][0], segments[i][1], segments[j][0], segments[j][1])
      if (!hit) continue
      cutsBySeg[i].push({ t: hit.t, p: hit.point })
      cutsBySeg[j].push({ t: hit.u, p: hit.point })
    }
  }

  // 3) 建图：路网相邻切分点连边（绕开危险区）
  const adj = new Map()
  const coords = new Map()
  const addNode = (p) => {
    const k = keyOf(p)
    if (!adj.has(k)) {
      adj.set(k, [])
      coords.set(k, p)
    }
    return k
  }
  const addEdge = (p, q) => {
    if (avoid && segNearCircle(p, q, avoid.center, avoid.radius)) return
    const kp = addNode(p)
    const kq = addNode(q)
    const w = Math.hypot(p[0] - q[0], p[1] - q[1])
    adj.get(kp).push([kq, w])
    adj.get(kq).push([kp, w])
  }
  cutsBySeg.forEach((cuts) => {
    cuts.sort((x, y) => x.t - y.t)
    for (let k = 0; k < cuts.length - 1; k++) addEdge(cuts[k].p, cuts[k + 1].p)
  })

  // 4) Dijkstra（路网规模很小，用 O(n²) 实现即可）
  const startKey = keyOf(bestF.point)
  const endKey = keyOf(bestT.point)
  const dist = new Map([[startKey, 0]])
  const prev = new Map()
  const visited = new Set()
  for (;;) {
    let cur = null
    let curD = Infinity
    for (const [k, d] of dist) {
      if (!visited.has(k) && d < curD) {
        cur = k
        curD = d
      }
    }
    if (cur == null || cur === endKey) break
    visited.add(cur)
    for (const [nk, w] of adj.get(cur) || []) {
      const nd = curD + w
      if (nd < (dist.has(nk) ? dist.get(nk) : Infinity)) {
        dist.set(nk, nd)
        prev.set(nk, cur)
      }
    }
  }
  // 绕开危险区导致不连通 → 退化为不绕开的路线（绝不直线穿火）
  if (!dist.has(endKey)) {
    console.warn('[ROUTE] avoid graph disconnected, falling back to non-avoid route')
    return routeAlongRoads(segments, from, to)
  }

  // 5) 回溯路径，并拼上「站点→上路点」与「下路点→目标」两段
  const path = []
  for (let c = endKey; c != null; c = prev.has(c) ? prev.get(c) : null) {
    path.unshift(coords.get(c))
    if (c === startKey) break
  }
  const route = [from, ...path]
  const last = path[path.length - 1]
  if (last && Math.hypot(last[0] - to[0], last[1] - to[1]) > 1e-6) route.push(to)
  return dedupe(route)
}
