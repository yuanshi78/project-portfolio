import * as Cesium from 'cesium'
import { createWindDirection } from './WindDirection.js'
import { toColor } from './shared.js'

// ----------------------------- 烟雾扩散 SmokeLocal --------------------------
// 移植自 ordos SmokeLocal.EntityType.GisUtils.js：数据驱动的烟雾/有害气体扩散动画。
// 每个时间步用三层同心影响区（红=外/重、黄=中、绿=内/轻），沿风向拉伸，
// 配风向箭头 + 半透明蓝色影响范围包围盒，并按时间步循环播放扩散过程。
//
// 与 ordos 的差异：ordos 从 dataUrl 拉取 ResultForAllTimeSteps（每步 ImpactRegions
// 为本地 X/Y 顶点）；本 demo 无后端，故按 direction/maxRadius/steps 在本地 ENU 空间
// 合成「逐时间步向外扩张、并沿风向拉长的椭圆环」作为演示数据。
//
// opts:
//   viewer         Cesium.Viewer
//   scene          Cesium.Scene（primitives，用于风向模型）
//   localToWorld(e,n,h) -> Cesium.Cartesian3   本地 ENU(米) → 世界
//   worldToLocal(world) -> Cesium.Cartesian3   世界 → 本地 ENU(米)（用于命中检测）
//   cx, cy         源点本地 ENU(米，已含铺开)
//   h              多边形高度（米）
//   direction      风向（度，0=北，顺时针）
//   maxRadius      最大扩散半径（米，沿风向）
//   steps          时间步数
//   color          风向箭头颜色
export async function createSmokeLocal(opts = {}) {
  const {
    viewer, scene, localToWorld, worldToLocal,
    cx = 0, cy = 0, h = 0,
    direction = 35, maxRadius = 90, steps = 8,
    color = toColor('#ff3b3b', 1.0),
  } = opts

  const dir = Cesium.Math.toRadians(direction)
  const s = Math.sin(dir), c = Math.cos(dir) // 风向单位向量 (east, north)

  // 对齐帧(沿风 ax / 横风 ay) ↔ 本地 ENU(X,Y)：X = s*ax + c*ay , Y = c*ax - s*ay
  const toENU = (ax, ay) => [s * ax + c * ay, c * ax - s * ay]

  // —— 生成各时间步、各层的椭圆顶点（对齐帧），并统计包围盒 ——
  const N = 36
  const frames = []
  let minAx = Infinity, maxAx = -Infinity, minAy = Infinity, maxAy = -Infinity
  for (let i = 0; i < steps; i++) {
    const k = (i + 1) / steps
    const rings = {
      red: [maxRadius * k, maxRadius * k * 0.5],
      yellow: [maxRadius * k * 0.66, maxRadius * k * 0.33],
      green: [maxRadius * k * 0.33, maxRadius * k * 0.17],
    }
    const out = {}
    for (const key of ['red', 'yellow', 'green']) {
      const [a, b] = rings[key]
      const pts = []
      for (let p = 0; p < N; p++) {
        const t = (p / N) * Math.PI * 2
        const ax = a * Math.cos(t)
        const ay = b * Math.sin(t)
        pts.push({ ax, ay })
        if (ax < minAx) minAx = ax
        if (ax > maxAx) maxAx = ax
        if (ay < minAy) minAy = ay
        if (ay > maxAy) maxAy = ay
      }
      out[key] = pts
    }
    frames.push(out)
  }

  // 包围盒中心（对齐帧）→ 本地 ENU → 世界
  const midAx = 0.5 * (minAx + maxAx)
  const midAy = 0.5 * (minAy + maxAy)
  const [rotX, rotY] = toENU(midAx, midAy)
  const originX = cx + rotX
  const originY = cy + rotY
  const boxCenterWorld = localToWorld(originX, originY, h)

  const makePoly = (alignedPts, colorVal, zIndex) => {
    const cartesians = alignedPts.map(({ ax, ay }) => {
      const [X, Y] = toENU(ax, ay)
      return localToWorld(cx + X, cy + Y, h)
    })
    return viewer.entities.add({
      name: 'smokePolygon',
      polygon: { hierarchy: cartesians, material: colorVal, zIndex },
      show: false,
    })
  }

  const polygonFrames = []
  for (const f of frames) {
    // 顺序保持 [红, 黄, 绿]，与 ordos 一致（数组下标 2/1/0）
    const red = makePoly(f.red, Cesium.Color.RED.withAlpha(0.45), 2)
    const yellow = makePoly(f.yellow, Cesium.Color.YELLOW.withAlpha(0.4), 1)
    const green = makePoly(f.green, Cesium.Color.GREEN.withAlpha(0.35), 0)
    polygonFrames.push([red, yellow, green])
  }

  // 影响范围包围盒（半透明蓝）+ 描边，绕 Z 按风向定向
  const box = viewer.entities.add({
    position: boxCenterWorld,
    orientation: Cesium.Transforms.headingPitchRollQuaternion(
      boxCenterWorld,
      new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(direction), 0, 0),
    ),
    box: {
      dimensions: new Cesium.Cartesian3(maxAx - minAx, maxAy - minAy, 10.0),
      material: Cesium.Color.BLUE.withAlpha(0.12),
      outline: true,
      outlineColor: Cesium.Color.BLUE.withAlpha(0.5),
    },
    show: true,
  })

  // 风向箭头（下风向，异步 glTF）：仅在烟雾扩散处展示风向，独立 wind-* 图标仍按需求隐藏
  const windDist = (maxAx - minAx) * 0.5 + 30
  const windCenter = localToWorld(originX + s * windDist, originY + c * windDist, h)
  let wind = null
  try {
    wind = await createWindDirection(scene, { center: windCenter, direction, level: 0.5, color })
  } catch (e) { wind = null }

  let visible = true
  let index = 0
  const applyFrame = () => {
    polygonFrames.forEach((fr, i) => {
      const on = visible && i === index
      fr[0].show = on; fr[1].show = on; fr[2].show = on
    })
    box.show = visible
    if (wind) wind.show = visible
  }
  applyFrame()

  const timer = setInterval(() => {
    index = (index + 1) % polygonFrames.length
    applyFrame()
  }, 1000)

  return {
    setVisible(v) { visible = v; applyFrame() },
    remove() {
      clearInterval(timer)
      polygonFrames.forEach((fr) => fr.forEach((e) => viewer.entities.remove(e)))
      viewer.entities.remove(box)
      if (wind) scene.primitives.remove(wind)
    },
    // 命中检测：世界坐标是否落在影响范围内（对齐帧半长内）
    isPointInRegion(world) {
      if (!worldToLocal) return false
      const p = worldToLocal(world) // 本地 ENU(米)
      const dx = p.x - originX
      const dy = p.y - originY
      const ax = s * dx + c * dy
      const ay = c * dx - s * dy
      return Math.abs(ax) <= (maxAx - minAx) / 2 && Math.abs(ay) <= (maxAy - minAy) / 2
    },
  }
}
