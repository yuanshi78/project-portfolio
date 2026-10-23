import { watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { FEATURE_SPREAD, MODEL_LIFT, MODEL_SCALE, PLANT, TYPE_DEFS } from '../data/seed.js';
import { addFeature, closeInfo, getFeature, groupVisibleFor, pushToast, selectFeature, store } from '../store.js';
import {
  createCriticalZone, createFence, createFire, createFireVehicle, createRadarCoverage, createSmokeLocal,
  cylinderMatrix, toColor,
} from './entities/index.js';
import { findFireVehiclePositions } from './dispatch.js';
import { routeAlongRoads } from './routing.js';
import roadsConfig from '../data/roads-config.json';

let viewer = null
let tileset = null
let enuMatrix = null
let handler = null
let addModeType = null
let measureMode = null // 'distance' | 'area' | null
const measurePoints = [] // 本地 [e,n,h]
let measureEntities = []
let routeMode = false // 画路线开关
const routePoints = [] // 路线点（logPickedCoords 输出的 info 对象）
let routeEntities = [] // 进行中的路线实体（被 clearRoute 清除）
let committedRouteEntities = [] // 已画完的路线实体，跨多次绘制保留，不被 clearRoute 清掉
let trailEntities = []
let baseImageryLayer = null
const entitiesById = new Map()

const toRad = Cesium.Math.toRadians

// --------------------- WGS-84 ↔ GCJ-02(高德) -------------------------------
// 底图与模型都在高德 GCJ-02 系下（见 seed.js 的 PLANT 说明），点选输出的场景坐标即 GCJ-02；
// 这里同时给出换算后的真实 WGS-84，便于和 GPS / 其他系统对齐。
const GCJ_A = 6378245.0
const GCJ_EE = 0.00669342162296594323
const gcjLatOffset = (x, y) => {
  let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3
  r += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3
  r += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3
  return r
}
const gcjLonOffset = (x, y) => {
  let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3
  r += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3
  r += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3
  return r
}
function wgs84ToGcj02(lon, lat) {
  let dLat = gcjLatOffset(lon - 105, lat - 35)
  let dLon = gcjLonOffset(lon - 105, lat - 35)
  const radLat = (lat / 180) * Math.PI
  let magic = Math.sin(radLat)
  magic = 1 - GCJ_EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180) / ((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic) * Math.PI)
  dLon = (dLon * 180) / (GCJ_A / sqrtMagic * Math.cos(radLat) * Math.PI)
  return [lon + dLon, lat + dLat]
}
function gcj02ToWgs84(lon, lat) {
  let wLon = lon
  let wLat = lat
  for (let i = 0; i < 5; i++) {
    const [gLon, gLat] = wgs84ToGcj02(wLon, wLat)
    wLon += lon - gLon
    wLat += lat - gLat
  }
  return [wLon, wLat]
}

// 复用 ordos 的要素图标（public/data/img，保持与 ordos 相同的相对目录，CSS 里 url(../data/img) 亦以此解析）。
const IMG_BASE = import.meta.env.BASE_URL + 'data/img/'

// 要素图标预加载 + 回退：单个图标 404 时，Cesium 默认会每帧刷
// “Error loading image for billboard”。这里用 Promise 预加载，失败时回退到默认图标，
// 既保证一定有图，也杜绝错误刷屏（返回 null 时 Cesium 仅不画该 billboard，不再报错）。
function billboardImage(icon) {
  const url = IMG_BASE + (icon || 'icon_default.png')
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      if (icon && icon !== 'icon_default.png') {
        const fb = new Image()
        fb.onload = () => resolve(fb)
        fb.onerror = () => resolve(null)
        fb.src = IMG_BASE + 'icon_default.png'
      } else {
        resolve(null)
      }
    }
    img.src = url
  })
}

// 火焰贴图已随 createFire 迁移到 entities/Fire.js
const fireParticles = new Map() // featureId -> { fire, smoke }
const fireVehicles = new Map() // alarmId -> [消防车 handle]（自动布点，见 dispatch.js）
const extinguishedAlarms = new Set() // 已到现场的报警点：车到了就熄火（火警不展示），但不撤车
// 顺序火警演练状态：一组位置火警依次触发（车到→火展示→熄火→车回→撤警），走完一轮自动重新排队→无限循环
const scenario = { running: false, currentId: null, advanced: false, queue: [], specs: [] }
const hazardZones = new Map()   // featureId -> 危险区(呼吸光柱) entity
const ordosFx = new Map()       // featureId -> { obj } 移植自 ordos 的 Primitive / Model

// 由 ordos 移植实体驱动的要素类型
const ORDOS_FX_TYPES = new Set(['radar', 'danger', 'fence', 'wind', 'smoke'])

// 火情未消：active(活动中) 与 responding(处置中) 都仍在燃烧，只有 cleared(已消警) 才熄火。
// 之前只认 'active'，点了「应急响应」后火和消防车会一起消失，与「有火警就一直展示」不符。
const isFireAlarmOn = (f) => f.type === 'alarm' && f.status !== 'cleared'

// 消防管线「流光」材质：沿管线方向移动的亮带（参照 ordos Fence 的 time uniform 流光）。
// Cesium 材质着色器内置 czm_frameNumber，无需每帧手动更新 uniform。
function flowLineMaterial(colorHex) {
  const c = Cesium.Color.fromCssColorString(colorHex)
  const rgb = `vec3(${c.red.toFixed(3)}, ${c.green.toFixed(3)}, ${c.blue.toFixed(3)})`
  return new Cesium.Material({
    fabric: {
      type: 'FlowPolyline',
      source: `
        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);
          vec2 st = materialInput.st;
          float t = fract(st.s * 6.0 - czm_frameNumber * 0.012);
          float band = smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.15, 0.35, t));
          vec3 col = ${rgb};
          material.diffuse = col;
          material.emission = col * (0.35 + 0.65 * band);
          material.alpha = clamp(0.45 + 0.55 * band, 0.0, 1.0);
          return material;
        }`,
    },
  })
}

export const app = {
  get viewer() { return viewer },

  async init(container) {
    // 调试用：控制台里可直接访问 window.__cesiumApp.viewer
    if (typeof window !== 'undefined') { window.__cesiumApp = this; window.__Cesium = Cesium }
    Cesium.Ion.defaultAccessToken = ''
    viewer = new Cesium.Viewer(container, {
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      timeline: false,
      animation: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      homeButton: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
      scene3DOnly: true,
      requestRenderMode: false,
    })
    if (typeof window !== 'undefined') window.__viewer = viewer
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b1a2b')
    viewer.scene.globe.depthTestAgainstTerrain = true
    // 允许相机自由穿行：关掉碰撞检测，避免贴近/进入 3D Tiles 模型时相机被推出、感觉“卡住/动不了”
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false
    // 保留 Cesium 默认左键拖拽（绕光标点公转 = 拖动场景）；不要设 enableRotate=false。
    // 关键①：ParticleSystem 用「帧间时钟差 dt」计算发射量（numToEmit = dt * emissionRate）。
    // 默认 Viewer 的 clock.shouldAnimate 为 false（动画/时间轴控件被关掉时更明显），
    // 时钟不走 → dt 恒为 0 → 一个粒子都不发射，火焰/烟雾完全看不见。
    // 关键②（真正的元凶）：Viewer 默认 allowDataSourcesToSuspendAnimation = true，
    // 每个 tick 都会跑 dataSourceDisplay.update()，只要它返回 false（认为数据源未就绪），
    // 就把 clock.canAnimate 置为 false —— tick 里 canAnimate && shouldAnimate 不通过，
    // 时钟被彻底冻结（shouldAnimate=true 也没用）。已实测：canAnimate=false、currentTime 恒定不动。
    // 关掉这个开关后时钟正常走，粒子才会持续发射。
    viewer.allowDataSourcesToSuspendAnimation = false
    viewer.clock.shouldAnimate = true
    viewer.clock.multiplier = 1
    viewer.scene.skyAtmosphere.show = true
    viewer.scene.fog.enabled = true
    viewer.scene.globe.showGroundAtmosphere = true

    // 底图：在线卫星影像 / 离线 Natural Earth II
    watch(() => store.baseMap, (kind) => { this.applyBaseMap(kind) })
    await this.applyBaseMap(store.baseMap)

    // 厂区 ENU 坐标系（与 3D Tiles 共用同一本地帧）
    const center = Cesium.Cartesian3.fromDegrees(PLANT.lon, PLANT.lat, PLANT.height)
    enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center)

    // 加载由 public/gltf/32427937f0226080ccddb35e7e26303a.glb 转换的本地 3D Tiles
    // （glbToB3dm → data/imported-model/0.b3dm + tileset.json，transform 为单位阵，
    //  朝向/缩放完全交给下面的 modelMatrix 归一化；该 glb 自带节点 +90° 绕 X）。
    try {
      tileset = await Cesium.Cesium3DTileset.fromUrl(import.meta.env.BASE_URL + 'data/imported-model/tileset.json', {
        maximumScreenSpaceError: 16,
      })
      // 该 glb 以极小尺度建模（包围球半径≈0.6 单位），直接放进「米」级 ENU 会小到看不见，
      // 故按包围球归一化到厂区尺度。
      const radius = tileset.boundingSphere ? tileset.boundingSphere.radius : 0
      // 归一化到厂区尺度后，再乘 MODEL_SCALE（只调大小，位置/朝向不变）
      const scale = (radius > 0 ? 240 / (2 * radius) : 196) * MODEL_SCALE
      // 旋转旋钮：模型朝向主要由 b3dm 内烘焙的节点 +90°X 决定。
      // 之前并存的两处 X 旋转 Rx(-90) 与 Rx(+90) 互相抵消（净=恒等），纯属冗余，
      // 且会把「竖直抬升」误转到水平方向；现移除冗余，只保留这一个可控旋转（当前不额外旋转）。
      const modelRot = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(0)),
        Cesium.Cartesian3.ZERO,
      )
      // 贴地微调：MODEL_LIFT 是「米」，这里除 scale 还原成 tile-local 单位
      // （lift 在缩放之前施加，写 0.1 之类的常数会被 scale 成倍放大，改一次就得重算）
      const lift = Cesium.Matrix4.fromTranslation(new Cesium.Cartesian3(0, 0, MODEL_LIFT / scale))
      const local = Cesium.Matrix4.multiply(lift, modelRot, new Cesium.Matrix4())
      const scaledLocal = Cesium.Matrix4.multiply(
        Cesium.Matrix4.fromUniformScale(scale),
        local,
        new Cesium.Matrix4(),
      )
      tileset.modelMatrix = Cesium.Matrix4.multiply(enuMatrix, scaledLocal, new Cesium.Matrix4())
      // 提亮模型：① 增强场景直射光强度（对受光照的 PBR 材质有效）；
      // ② 若材质为 unlit（不受光照影响），则靠轻微「向白色混合」整体抬亮（保留纹理）。
      if (viewer.scene.light && 'intensity' in viewer.scene.light) {
        viewer.scene.light.intensity = 3.5
      }
      if (tileset.model) {
        tileset.model.color = Cesium.Color.WHITE
        tileset.model.colorBlendMode = Cesium.ColorBlendMode.MIX
        tileset.model.colorBlendAmount = 0.2
      }
      viewer.scene.primitives.add(tileset)
    } catch (e) {
      console.error('3D Tiles 加载失败', e)
    }

    try {
      this.drawRoadNetwork()
      this.drawRoutes()
      this.syncFeatures()
      this.bindEvents()
      this.resetView()
      // 顺序火警演练：按 entities-config.json 里的火警（type==='alarm'）依次触发
      this.startFireScenario()
    } catch (e) {
      console.error('初始化步骤失败', e)
    }
  },

  // 底图切换：satellite=在线卫星影像（高德 style=6，需联网），offline=离线 Natural Earth II
  async applyBaseMap(kind) {
    if (!viewer) return
    let provider = null
    try {
      if (kind === 'satellite') {
        provider = new Cesium.UrlTemplateImageryProvider({
          // {s} 由 subdomains 轮换；style=6 为高德卫星影像，无需 key
          url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
          subdomains: ['1', '2', '3', '4'],
          maximumLevel: 18,
          credit: '卫星影像 © 高德地图',
        })
      } else {
        provider = await Cesium.TileMapServiceImageryProvider.fromUrl(
          Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        )
      }
    } catch (e) {
      console.error('底图创建失败', e)
      provider = null
    }
    if (!provider) {
      // 兜底：仅深色地球
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b1a2b')
      return
    }
    if (baseImageryLayer) {
      viewer.imageryLayers.remove(baseImageryLayer)
      baseImageryLayer = null
    }
    baseImageryLayer = viewer.imageryLayers.addImageryProvider(provider, 0)
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b1a2b')
  },

  // 要素本地坐标 → 场景本地坐标：水平 e/n 按 FEATURE_SPREAD 铺开（高度保持原值）
  spread(v) {
    return (v || 0) * FEATURE_SPREAD
  },

  // 本地 ENU(米) → 经纬度(度)+高度(米)
  localToDeg(e, n, h = 0) {
    const local = new Cesium.Cartesian3(e, n, h)
    const world = Cesium.Matrix4.multiplyByPoint(enuMatrix, local, new Cesium.Cartesian3())
    const cart = Cesium.Cartographic.fromCartesian(world)
    return {
      lon: Cesium.Math.toDegrees(cart.longitude),
      lat: Cesium.Math.toDegrees(cart.latitude),
      height: cart.height,
    }
  },

  // 世界坐标 → 本地 ENU(米)
  worldToLocal(world) {
    const inv = Cesium.Matrix4.inverse(enuMatrix, new Cesium.Matrix4())
    return Cesium.Matrix4.multiplyByPoint(inv, world, new Cesium.Cartesian3())
  },

  resetView() {
    if (tileset) {
      const range = Math.max(tileset.boundingSphere.radius * 2.5, 2)
      viewer.flyTo(tileset, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(toRad(-30), toRad(-28), range),
      })
    } else {
      const dest = Cesium.Cartesian3.fromDegrees(PLANT.lon + 0.0015, PLANT.lat - 0.0008, 520)
      viewer.camera.flyTo({ destination: dest, orientation: { heading: toRad(-30), pitch: toRad(-30), roll: 0 } })
    }
  },

  // ----------------------- 要素实体同步 ------------------------------------
  syncFeatures() {
    if (!viewer) return
    const seen = new Set()
    for (const feature of store.features) {
      // 不展示风向图标：跳过 wind 类型（不建实体，已有实体走下方 cleanup 移除）
      if (feature.type === 'wind') continue
      seen.add(feature.id)
      this.ensureEntity(feature)
    }
    for (const [id, ent] of entitiesById) {
      if (!seen.has(id)) {
        viewer.entities.remove(ent)
        entitiesById.delete(id)
        this.removeFire(id)
        this.removeHazard(id)
        this.removeOrdosFx(id)
      }
    }
    this.applyVisibility()
    this.syncFireVehicles()
  },

  // ------------------ 消防车自动布点（移植自 ordos FindNearestPosition） --------
  // 触发条件与 ordos 一致：报警(alarm)激活且有风向 direction 时出车
  syncFireVehicles() {
    const active = store.features.filter((f) => isFireAlarmOn(f) && f.direction != null)
    const ids = new Set(active.map((a) => a.id))
    // 报警解除 → 撤车
    for (const [id, arr] of fireVehicles) {
      if (!ids.has(id)) {
        arr.forEach((h) => h.remove())
        fireVehicles.delete(id)
        extinguishedAlarms.delete(id) // 重置，便于下次报警重新点火
      }
    }
    // 新报警 → 布点出车。默认播放行驶动画（车从消防站沿路网开到布点位）。
    // 消防站已移到厂区内（roads-config.json 的 stations），所以车一上路就在视野里，
    // 不会出现「在厂区外开 30s、到点了才看得见」的情况。
    // 若想让车直接停在布点位不动，给该 alarm 配 "animate": false
    for (const alarm of active) {
      if (fireVehicles.has(alarm.id)) continue
      const handles = this.dispatchFireVehicles(alarm, alarm.animate !== false)
      if (handles.length) fireVehicles.set(alarm.id, handles)
    }
    this.applyVehicleVisibility()
  },

  // animate=false 时不做路径规划，车直接落在布点位（用于地图刚加载的首次同步）
  dispatchFireVehicles(feature, animate = true) {
    // 路网坐标与 features 同一单位（pre-spread），统一乘 FEATURE_SPREAD 后参与计算
    const roads = (roadsConfig.roads || []).map(([a, b]) => [
      [this.spread(a[0]), this.spread(a[1])],
      [this.spread(b[0]), this.spread(b[1])],
    ])
    const center = [this.spread(feature.e), this.spread(feature.n)]
    const spots = findFireVehiclePositions({
      center,
      roads,
      windDirection: feature.direction ?? 0,
      windRange: feature.windRange ?? 60,
      count: feature.vehicles ?? 3,
      safeDistance: feature.safeDistance ?? 80,
      minVehicleDistance: feature.minVehicleDistance ?? 100,
    })
    // 行驶路线：从消防站沿路网开到各自的布点（roads-config.json 的 stations）
    const stations = (roadsConfig.stations || []).map(([e, n]) => [this.spread(e), this.spread(n)])
    // 消防车是地面车辆：位置统一落到地面（高度 0），不要再叠加报警点的高海拔 feature.h。
    // （报警点的 h 属于高处的火情/装置，火焰已在 syncFire 里单独抬高；车应在地面行驶、停在装置脚下）
    const toWorld = (e, n) => {
      const d = this.localToDeg(e, n, 0)
      return Cesium.Cartesian3.fromDegrees(d.lon, d.lat, d.height)
    }
    // 段朝向（罗盘方位·度）：0=北、90=东
    const segHeading = (a, b) => {
      const deg = (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI
      return (deg % 360 + 360) % 360
    }
    const buildRoute = (pts) => {
      if (!pts || pts.length < 2) return null
      const route = []
      for (let i = 0; i < pts.length - 1; i++) {
        route.push({ position: toWorld(pts[i][0], pts[i][1]), heading: segHeading(pts[i], pts[i + 1]) })
      }
      const tail = { position: toWorld(pts[pts.length - 1][0], pts[pts.length - 1][1]) }
      tail.heading = route[route.length - 1].heading
      route.push(tail)
      return route
    }

    const vis = groupVisibleFor('alarm')
    const speed = feature.vehicleSpeed ?? 300
    // 多车协同对象：本报警的 count 辆车共享，用于「三辆车都到了才放行」
    const coord = { total: spots.length, arrived: 0, releaseAt: 0, released: false, returned: 0 }
    return spots.map((p, k) => {
      const d = this.localToDeg(p.e, p.n, 0)
      // 出发点：消防站（多站时轮流分配）；不动画 / 无站点配置则直接停在布点位
      const station = animate && stations.length ? stations[k % stations.length] : null
      const pts = station ? routeAlongRoads(roads, station, [p.e, p.n]) : null
      const route = buildRoute(pts)
      const start = route ? route[0].position : Cesium.Cartesian3.fromDegrees(d.lon, d.lat, d.height)
      // glTF 异步加载：先占位，加载完成后回填（若期间已被撤车则丢弃），与 wind/smoke 同一套机制
      const holder = {
        obj: null,
        visible: vis,
        removed: false,
        setVisible(v) {
          holder.visible = v
          if (holder.obj) holder.obj.setVisible(v)
        },
        remove() {
          holder.removed = true
          if (holder.obj) holder.obj.remove()
        },
      }
      createFireVehicle(viewer, {
        center: start,
        height: d.height,
        direction: route ? route[0].heading : p.direction,
        range: feature.effectRange || 0,
        scale: feature.vehicleScale ?? 1.5,
        headingOffset: feature.headingOffset ?? 90, // 整车绕上轴 +90°（顺时针=往东转 90°）
        tiltX: feature.tiltX ?? 0, // 绕 X 的俯仰校正：默认 0（转了车会侧翻，别开）
        tiltZ: feature.tiltZ ?? -90, // 模型自身车头朝 +X（不是 +Y），绕上轴 Z 转 -90° 让车头对准行进方向
        // 车头若反了（车尾在前）配 headingOffset: 180；若整车偏 90° 再动 tiltZ
        route,
        speed,
        delay: k * 1.2, // 车队依次出发，避免叠在一起
        loopDrive: feature.loopDrive ?? false, // 默认回到消防站即停（不循环）；演练里每起报警处置完就撤车切下一个
        rest: feature.vehicleRest ?? 5, // 回到站后待命秒数（循环用）
        // 三辆车都到场、再等 sceneHold(默认 5) 秒后统一熄火放行：
        // onRelease 触发熄火（只关火、不撤车），coord 让三辆车一起转返程。
        coord,
        sceneHold: feature.vehicleRest ?? 5, // 全部到场后现场等待秒数（=「等五秒」）
        onRelease: () => {
          if (extinguishedAlarms.has(feature.id)) return
          extinguishedAlarms.add(feature.id)
          this.syncFire(feature)
        },
        // 三辆车都回到消防站：本报警处置完（火已熄、车已回）→ 切下一个火警
        onReturn: () => {
          coord.returned++
          if (coord.returned >= coord.total) this.onAlarmResolved(feature.id)
        },
      }).then((h) => {
        if (holder.removed) {
          h.remove()
          return
        }
        holder.obj = h
        h.setVisible(holder.visible)
      }).catch((err) => {
        console.warn('[消防车] 模型加载失败：', err)
      })
      return holder
    })
  },

  // --------------------- 顺序火警演练（固定火警，按 config 顺序依次处置） ---------------------
  // 火警位置来自 entities-config.json（type==='alarm'），按配置顺序逐个演练：
  // 同一时刻仅一个告警在场，三辆车从各自消防站出发 → 到齐后等 5 秒（火继续展示）→ 火熄灭、三车一起回站 → 下一个告警。
  // 静默移除要素（不走 store.removeFeature 的 toast，避免演练时刷屏）
  _removeFeatureQuiet(id) {
    const i = store.features.findIndex((x) => x.id === id)
    if (i >= 0) store.features.splice(i, 1)
  },

  // 由火警派生一个「风向」要素：箭头落在火警点、朝向与该火警的 wind direction 一致
  _windFeatureFor(spec) {
    return {
      id: 'wind-' + spec.id,
      type: 'wind',
      name: '风向',
      e: spec.e, n: spec.n, h: spec.h || 0,
      direction: spec.direction ?? 0,
      status: 'active',
    }
  },

  startFireScenario() {
    // 收集 config 里所有火警（深拷贝，避免演练中改动原始配置）
    const specs = store.features.filter((f) => f.type === 'alarm').map((f) => ({ ...f }))
    // 先清空 store 中现存的告警与演练临时风向并同步（避免一开始全部告警同时出车 / 残留箭头）
    for (const f of [...store.features]) {
      if (f.type === 'alarm' || (f.type === 'wind' && f.id.startsWith('wind-'))) this._removeFeatureQuiet(f.id)
    }
    this.syncFeatures()
    scenario.specs = specs
    scenario.queue = specs.map((s) => ({ ...s }))
    scenario.running = specs.length > 0
    scenario.currentId = null
    scenario.advanced = false
    if (scenario.running) this.activateNextAlarm()
  },

  stopFireScenario() {
    scenario.running = false
    scenario.currentId = null
    for (const f of [...store.features]) {
      if (f.type === 'alarm' || (f.type === 'wind' && f.id.startsWith('wind-'))) this._removeFeatureQuiet(f.id)
    }
    this.syncFeatures()
  },

  activateNextAlarm() {
    // 不依赖 App.vue 的 store watch（init 阶段 watch 尚未注册，会漏掉初始化时的变更），
    // 这里直接调用 syncFeatures 完成「撤旧车 / 出新车 + 点火」的对账。
    if (!scenario.running) { this.syncFeatures(); return }
    let spec = scenario.queue.shift()
    // 整套演练走完一轮 → 重新排队，无限循环（适合演示常亮、持续有动态）
    if (!spec) {
      scenario.queue = scenario.specs.map((s) => ({ ...s }))
      spec = scenario.queue.shift()
    }
    if (!spec) { scenario.running = false; scenario.currentId = null; this.syncFeatures(); return }
    scenario.currentId = spec.id
    scenario.advanced = false
    extinguishedAlarms.delete(spec.id) // 重置熄火标记，循环时火能重新点燃
    store.features.push(spec)
    store.features.push(this._windFeatureFor(spec)) // 同步显示该火警的风向
    this.syncFeatures()
  },

  // 三辆车都已回到消防站：本报警处置完（火已熄、车已回），撤警并切下一个火警
  onAlarmResolved(id) {
    if (!scenario.running || id !== scenario.currentId || scenario.advanced) return
    scenario.advanced = true
    setTimeout(() => {
      this._removeFeatureQuiet(id) // 撤车 + 移除报警点图标
      this._removeFeatureQuiet('wind-' + id) // 撤掉该火警的风向箭头
      if (scenario.running) this.activateNextAlarm()
    }, 1500)
  },

  applyVehicleVisibility() {
    const vis = groupVisibleFor('alarm')
    for (const arr of fireVehicles.values()) arr.forEach((h) => h.setVisible(vis))
  },

  // 路网参考线（半透明，只画一次；roads-config.json 的 visible 可关）
  drawRoadNetwork() {
    if (!roadsConfig.visible || this._roadsDrawn) return
    this._roadsDrawn = true
    for (const [a, b] of roadsConfig.roads || []) {
      const p0 = this.localToDeg(this.spread(a[0]), this.spread(a[1]), 0)
      const p1 = this.localToDeg(this.spread(b[0]), this.spread(b[1]), 0)
      viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([p0.lon, p0.lat, p1.lon, p1.lat]),
          clampToGround: true,
          width: 3,
          material: Cesium.Color.fromCssColorString('#e02d2d').withAlpha(0.85),
        },
      })
    }
  },

  // 预定义路线（roads-config.json 的 routes）：彩色折线 + 起点名称标签
  drawRoutes() {
    if (!roadsConfig.routes || !roadsConfig.routes.length) return
    if (roadsConfig.routesVisible === false) return
    for (const r of roadsConfig.routes) {
      const pts = (r.points || []).map(([e, n]) => {
        const d = this.localToDeg(this.spread(e), this.spread(n), 0)
        return Cesium.Cartesian3.fromDegrees(d.lon, d.lat, d.height)
      })
      if (pts.length < 2) continue
      const color = Cesium.Color.fromCssColorString(r.color || '#22d3ee')
      viewer.entities.add({
        polyline: {
          positions: pts,
          clampToGround: true,
          width: 4,
          material: color.withAlpha(0.95),
          depthFailMaterial: color.withAlpha(0.95),
        },
      })
      viewer.entities.add({
        position: pts[0],
        label: {
          text: r.name || r.id,
          font: '13px "Microsoft YaHei", sans-serif',
          fillColor: color,
          showBackground: true,
          backgroundColor: new Cesium.Color(0.04, 0.1, 0.18, 0.85),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(3000, 1, 12000, 0.3),
        },
      })
    }
  },

  ensureEntity(feature) {
    const def = TYPE_DEFS[feature.type] || { color: '#ffffff', icon: 'icon_default.png' }
    let ent = entitiesById.get(feature.id)
    if (!ent) {
      const pos = this.featureAnchorDeg(feature)
      const options = {
        id: feature.id,
        properties: { featureId: feature.id },
      }
      if (feature.type === 'pipe' && Array.isArray(feature.path)) {
        const positions = feature.path.map(([e, n, h]) => {
          const p = this.localToDeg(this.spread(e), this.spread(n), h)
          return Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.height)
        })
        options.polyline = {
          positions: new Cesium.CallbackProperty(() => positions, false),
          width: 5,
          material: flowLineMaterial(def.color),
          clampToGround: false,
        }
      } else {
        options.position = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.height)
        options.billboard = {
          image: billboardImage(def.icon),
          // 显示尺寸限制远程收缩下限：厂区放大后相机在 km 级，原 30→0.7 会缩到 ~21px 发虚
          width: 36,
          height: 36,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scaleByDistance: new Cesium.NearFarScalar(300, 1.5, 8000, 1.0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }
        options.label = {
          text: feature.name,
          font: '14px "Segoe UI", "Microsoft YaHei", sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#e6edf3'),
          showBackground: true,
          backgroundColor: new Cesium.Color(0.04, 0.1, 0.18, 0.82),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          pixelOffset: new Cesium.Cartesian2(0, 32),
          scaleByDistance: new Cesium.NearFarScalar(300, 1.2, 8000, 0.9),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(2000, 1, 5000, 0.15),
        }
      }
      ent = viewer.entities.add(options)
      entitiesById.set(feature.id, ent)
    } else {
      // 更新位置（坐标可能被编辑）
      const pos = this.featureAnchorDeg(feature)
      if (feature.type !== 'pipe') {
        ent.position = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.height)
        if (ent.label) ent.label.text = feature.name
      } else if (Array.isArray(feature.path)) {
        ent.polyline.positions = feature.path.map(([e, n, h]) => {
          const p = this.localToDeg(this.spread(e), this.spread(n), h)
          return Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.height)
        })
      }
    }
    // 报警状态高亮：未消警（active / responding）都保持高亮，消警后才转灰
    if (feature.type === 'alarm' && ent.billboard) {
      const on = isFireAlarmOn(feature)
      ent.billboard.width = on ? 44 : 36
      ent.billboard.height = on ? 44 : 36
      ent.billboard.color = on
        ? Cesium.Color.fromCssColorString(feature.status === 'responding' ? '#ff9500' : '#ff3b3b')
        : Cesium.Color.fromCssColorString('#7f8a99')
    }
    // 火焰粒子特效：只有「激活中的报警点」才是真正的火情点
    // 车到现场后熄火（extinguishedAlarms），火警不再展示，但报警/消防车仍在
    if (feature.type !== 'pipe') this.syncFire(feature)
    // ordos 移植实体（雷达 / 危险区 / 围栏 / 风向）
    this.syncOrdosFx(feature)
  },

  // 围栏等沿路径的要素，锚点取路径首点（避免图标落在原点）
  featureAnchorDeg(feature) {
    if (feature.type === 'fence' && Array.isArray(feature.path) && feature.path.length) {
      const [e, n, h] = feature.path[0]
      return this.localToDeg(this.spread(e), this.spread(n), h)
    }
    return this.localToDeg(this.spread(feature.e), this.spread(feature.n), feature.h)
  },

  applyVisibility() {
    for (const feature of store.features) {
      const vis = groupVisibleFor(feature.type)
      const ent = entitiesById.get(feature.id)
      if (ent) ent.show = vis
      const ps = fireParticles.get(feature.id)
      if (ps) { ps.fire.show = vis; ps.smoke.show = vis }
      const hz = hazardZones.get(feature.id)
      if (hz) hz.show = vis
      const fx = ordosFx.get(feature.id)
      if (fx) {
        if (fx.setVisible) fx.setVisible(vis)
        else if (fx.obj) fx.obj.show = vis
      }
    }
    this.applyVehicleVisibility()
  },

  syncFire(feature) {
    // type 'fire' 是消防设备（灭火器站），不是着火点，不该一直烧；
    // 只有 alarm 且未消警（active / responding）才是真实火情，才点火——且一直烧到消警为止。
    // 车到现场后（extinguishedAlarms）熄火：火警不展示，但报警点/消防车仍在。
    const wantFire = isFireAlarmOn(feature) && !extinguishedAlarms.has(feature.id)
    let ps = fireParticles.get(feature.id)
    if (!wantFire) {
      if (ps) this.removeFire(feature.id)
      this.removeHazard(feature.id)
      return
    }
    // 火焰抬高到 h+4m，避免被罐体/装置等低矮模型遮挡而看不见
    // 火点抬高：随铺开倍率一起放大（厂区建筑很高，贴地的火会被挡住）
    const d = this.localToDeg(this.spread(feature.e), this.spread(feature.n), (feature.h || 0) + 4.0 * FEATURE_SPREAD)
    const mm = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(d.lon, d.lat, d.height),
    )
    if (!ps) {
      ps = createFire(viewer.scene, mm, FEATURE_SPREAD)
      fireParticles.set(feature.id, ps)
    } else {
      ps.fire.modelMatrix = mm
      ps.smoke.modelMatrix = mm
    }
    const vis = groupVisibleFor(feature.type)
    ps.fire.show = vis
    ps.smoke.show = vis
    // 危险区：贴地的脉动红色光圈（明确是“危险区”标记，而非火）。
    // 之前用 20m 高红柱会立在火焰位置、把粒子火包住，看起来像“火是圆柱体”。
    let hz = hazardZones.get(feature.id)
    if (!hz) {
      const base = this.localToDeg(this.spread(feature.e), this.spread(feature.n), 0)
      // 颜色只解析一次：回调里不再 fromCssColorString（字符串解析很贵），只按脉冲算 alpha
      const fillRGB = Cesium.Color.fromCssColorString('#ff3b3b')
      const lineRGB = Cesium.Color.fromCssColorString('#ff6b6b')
      const pulse = () => 0.5 + 0.5 * Math.sin(performance.now() / 350)
      hz = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(base.lon, base.lat, 0),
        ellipse: {
          semiMajorAxis: 22 * FEATURE_SPREAD,
          semiMinorAxis: 22 * FEATURE_SPREAD,
          height: 0.6,
          material: new Cesium.ColorMaterialProperty(new Cesium.CallbackProperty(() => {
            return new Cesium.Color(fillRGB.red, fillRGB.green, fillRGB.blue, 0.12 + 0.12 * pulse())
          }, false)),
          outline: true,
          outlineColor: new Cesium.CallbackProperty(() => {
            return new Cesium.Color(lineRGB.red, lineRGB.green, lineRGB.blue, 0.35 + 0.4 * pulse())
          }, false),
          outlineWidth: 2,
        },
      })
      hazardZones.set(feature.id, hz)
    }
    hz.show = vis
  },

  removeFire(id) {
    const ps = fireParticles.get(id)
    if (ps) {
      viewer.scene.primitives.remove(ps.fire)
      viewer.scene.primitives.remove(ps.smoke)
      fireParticles.delete(id)
    }
  },

  removeHazard(id) {
    const hz = hazardZones.get(id)
    if (hz) {
      viewer.entities.remove(hz)
      hazardZones.delete(id)
    }
  },

  // ------------------ ordos 移植实体同步 --------------------------------------
  syncOrdosFx(feature) {
    if (!ORDOS_FX_TYPES.has(feature.type)) {
      this.removeOrdosFx(feature.id)
      return
    }
    const base = this.localToDeg(this.spread(feature.e), this.spread(feature.n), 0)
    const center = Cesium.Cartesian3.fromDegrees(base.lon, base.lat, base.height)
    const radius = (feature.radius || (feature.type === 'radar' ? 32 : 24)) * FEATURE_SPREAD
    const height = (feature.height || (feature.type === 'radar' ? 12 : 10)) * FEATURE_SPREAD
    const fx = ordosFx.get(feature.id)

    if (!fx) {
      if (feature.type === 'radar') {
        ordosFx.set(feature.id, {
          obj: createRadarCoverage(viewer.scene, {
            center, radius, height, color: toColor(TYPE_DEFS.radar.color, 0.9),
          }),
        })
      } else if (feature.type === 'danger') {
        ordosFx.set(feature.id, {
          obj: createCriticalZone(viewer.scene, {
            center, radius, height, color: toColor(TYPE_DEFS.danger.color, 1.0),
          }),
        })
      } else if (feature.type === 'fence') {
        const pts = Array.isArray(feature.path)
          ? feature.path.map(([e, n, h]) => {
            const p = this.localToDeg(this.spread(e), this.spread(n), h)
            return Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.height)
          })
          : []
        const obj = createFence(viewer.scene, {
          worldPoints: pts,
          height: (feature.height || 4) * FEATURE_SPREAD,
          color: toColor(TYPE_DEFS.fence.color, 0.6),
        })
        if (obj) ordosFx.set(feature.id, { obj })
      } else if (feature.type === 'wind') {
        // 按需求不展示风向图标：跳过风向箭头模型的创建
        return
      } else if (feature.type === 'smoke') {
        // 烟雾扩散：异步（内含 glTF 风向箭头）；先占位，加载完成后回填
        const holder = {
          obj: null,
          setVisible: (v) => { if (holder.obj) holder.obj.setVisible(v) },
          remove: () => { if (holder.obj) holder.obj.remove() },
        }
        ordosFx.set(feature.id, holder)
        const cx = this.spread(feature.e)
        const cy = this.spread(feature.n)
        const localToWorld = (e, n, hh) => {
          const p = this.localToDeg(e, n, hh)
          return Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.height)
        }
        createSmokeLocal({
          viewer, scene: viewer.scene, localToWorld, worldToLocal: (w) => this.worldToLocal(w),
          cx, cy, h: feature.h || 0,
          direction: feature.direction ?? 35,
          maxRadius: feature.radius || 90,
          steps: feature.steps || 8,
          color: toColor(TYPE_DEFS.smoke.color, 1.0),
        }).then((handle) => {
          if (ordosFx.get(feature.id) === holder) holder.obj = handle
          else handle.remove()
        }).catch(() => {})
      }
      return
    }

    // 已存在：仅更新变换矩阵（圆柱类）
    if (!fx.obj) return
    if (feature.type === 'radar' || feature.type === 'danger') {
      fx.obj.modelMatrix = cylinderMatrix(center, radius, height)
    }
  },

  removeOrdosFx(id) {
    const fx = ordosFx.get(id)
    if (fx) {
      if (fx.remove) fx.remove()
      else if (fx.obj) viewer.scene.primitives.remove(fx.obj)
      ordosFx.delete(id)
    }
  },

  // 点击地图 → 控制台输出坐标：优先取模型/地形表面（含 3D Tiles），否则退回椭球面
  logPickedCoords(screenPos) {
    if (!viewer) return null
    let world = null
    if (viewer.scene.pickPositionSupported) {
      try { world = viewer.scene.pickPosition(screenPos) } catch (e) { world = null }
    }
    // pickPosition 在部分环境（无深度纹理/软渲染）会返回离谱的值，做一次合理性校验后退回椭球面
    const sane = (w) => {
      if (!w) return false
      const c = Cesium.Cartographic.fromCartesian(w)
      return Number.isFinite(c.height) && c.height > -1000 && c.height < 9000
    }
    if (!sane(world)) world = viewer.camera.pickEllipsoid(screenPos, viewer.scene.globe.ellipsoid)
    if (!sane(world)) {
      console.log('[点击坐标] 未拾取到地球/模型表面')
      return null
    }
    const cart = Cesium.Cartographic.fromCartesian(world)
    const lon = Cesium.Math.toDegrees(cart.longitude)
    const lat = Cesium.Math.toDegrees(cart.latitude)
    const wgs = gcj02ToWgs84(lon, lat)
    const local = this.worldToLocal(world)
    const info = {
      gcj02: { lon: +lon.toFixed(6), lat: +lat.toFixed(6) }, // 场景坐标 == 高德系（底图/模型同系）
      wgs84: { lon: +wgs[0].toFixed(6), lat: +wgs[1].toFixed(6) },
      height: +cart.height.toFixed(2),
      local: { e: +local.x.toFixed(2), n: +local.y.toFixed(2), h: +local.z.toFixed(2) },
    }
    console.log(
      `[点击坐标] 高德GCJ-02 ${info.gcj02.lon}, ${info.gcj02.lat} | 真实WGS-84 ${info.wgs84.lon}, ${info.wgs84.lat} | 高度 ${info.height}m | 厂区本地 e=${info.local.e} n=${info.local.n} h=${info.local.h}`,
      info,
    )
    return info
  },

  // ----------------------- 拾取 / 选择 --------------------------------------
  bindEvents() {
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((movement) => {
      this.logPickedCoords(movement.position)
      const picked = viewer.scene.pick(movement.position)
      if (addModeType) {
        this.handleAddAt(movement.position)
        return
      }
      if (measureMode) {
        this.handleMeasureAt(movement.position)
        return
      }
      if (routeMode) {
        this.handleRouteAt(movement.position)
        return
      }
      if (picked && picked.id && picked.id.properties && picked.id.properties.featureId) {
        const id = picked.id.properties.featureId.getValue(viewer.clock.currentTime)
        const f = getFeature(id)
        if (f) selectFeature(f, movement.position.x, movement.position.y)
      } else {
        closeInfo()
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 信息窗跟随实体
    viewer.scene.postRender.addEventListener(() => {
      if (store.infoWindow.open && store.infoWindow.feature) {
        const f = store.infoWindow.feature
        const ent = entitiesById.get(f.id)
        if (ent && ent.position) {
          const cart = ent.position.getValue(viewer.clock.currentTime)
          const canvasPos = viewer.scene.cartesianToCanvasCoordinates(cart)
          if (canvasPos) {
            // 位置没明显变化就不写 store，避免每帧触发 Vue 响应式更新（降低 rAF 开销）
            const dx = Math.abs(canvasPos.x - store.infoWindow.screenX)
            const dy = Math.abs(canvasPos.y - store.infoWindow.screenY)
            if (dx > 0.5 || dy > 0.5) {
              store.infoWindow.screenX = canvasPos.x
              store.infoWindow.screenY = canvasPos.y
            }
          }
        }
      }
    })
  },

  flyToFeature(feature) {
    const pos = this.localToDeg(this.spread(feature.e), this.spread(feature.n), feature.h)
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat - 0.0006, Math.max(pos.height, 60) + 120),
      orientation: { heading: toRad(-20), pitch: toRad(-35), roll: 0 },
      duration: 1,
    })
  },

  // ----------------------- 新增（点选放置） ---------------------------------
  setAddMode(type) {
    addModeType = type
    measureMode = null
    routeMode = false
    if (store) store.ui.drawRoute = false
    this.clearRoute()
    this.clearMeasure()
    viewer.canvas.style.cursor = type ? 'crosshair' : 'default'
  },

  handleAddAt(screenPos) {
    const world = viewer.camera.pickEllipsoid(screenPos, viewer.scene.globe.ellipsoid)
    if (!world) return
    const local = this.worldToLocal(world)
    const type = addModeType
    this.setAddMode(null)
    const def = TYPE_DEFS[type] || { label: '要素' }
    const feature = {
      id: `${type}-new-${Date.now()}`,
      type,
      name: `${def.label}（新）`,
      // 存的是「要素本地坐标」：反向除掉 FEATURE_SPREAD，和 seed 里的量级保持一致
      e: local.x / FEATURE_SPREAD,
      n: local.y / FEATURE_SPREAD,
      h: Math.max(0, local.z),
      status: '正常',
    }
    addFeature(feature)
    selectFeature(feature, screenPos.x, screenPos.y, true)
  },

  // ----------------------- 测量 ---------------------------------------------
  startMeasure(mode) {
    measureMode = mode
    addModeType = null
    routeMode = false
    if (store) store.ui.drawRoute = false
    this.clearRoute()
    viewer.canvas.style.cursor = 'crosshair'
    this.clearMeasure()
  },

  clearMeasure() {
    measurePoints.length = 0
    measureEntities.forEach((e) => viewer.entities.remove(e))
    measureEntities = []
    viewer.canvas.style.cursor = 'default'
  },

  handleMeasureAt(screenPos) {
    const world = viewer.camera.pickEllipsoid(screenPos, viewer.scene.globe.ellipsoid)
    if (!world) return
    const local = this.worldToLocal(world)
    measurePoints.push(local)
    this.renderMeasure()
  },

  renderMeasure() {
    measureEntities.forEach((e) => viewer.entities.remove(e))
    measureEntities = []
    if (measurePoints.length === 0) return
    const positions = measurePoints.map((p) => {
      const d = this.localToDeg(p.x, p.y, p.z)
      return Cesium.Cartesian3.fromDegrees(d.lon, d.lat, d.height)
    })
    if (measureMode === 'distance') {
      let total = 0
      for (let i = 1; i < measurePoints.length; i++) {
        const a = measurePoints[i - 1]
        const b = measurePoints[i]
        total += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
      }
      const e = viewer.entities.add({
        polyline: { positions, width: 3, material: Cesium.Color.fromCssColorString('#fbbf24') },
      })
      measureEntities.push(e)
      const labelPos = positions[positions.length - 1]
      const label = viewer.entities.add({
        position: labelPos,
        label: {
          text: total >= 1000 ? `${(total / 1000).toFixed(2)} km` : `${total.toFixed(1)} m`,
          font: '14px sans-serif', fillColor: Cesium.Color.fromCssColorString('#fbbf24'),
          showBackground: true, backgroundColor: new Cesium.Color(0.05, 0.12, 0.2, 0.85),
          pixelOffset: new Cesium.Cartesian2(0, -16),
        },
      })
      measureEntities.push(label)
    } else if (measureMode === 'area' && measurePoints.length >= 3) {
      let area = 0
      for (let i = 0; i < measurePoints.length; i++) {
        const a = measurePoints[i]
        const b = measurePoints[(i + 1) % measurePoints.length]
        area += a.x * b.y - b.x * a.y
      }
      area = Math.abs(area) / 2
      const e = viewer.entities.add({
        polygon: {
          hierarchy: positions, material: Cesium.Color.fromCssColorString('#fbbf24').withAlpha(0.25),
        },
      })
      measureEntities.push(e)
      const label = viewer.entities.add({
        position: positions[0],
        label: {
          text: area >= 1e6 ? `${(area / 1e6).toFixed(2)} km²` : `${area.toFixed(0)} m²`,
          font: '14px sans-serif', fillColor: Cesium.Color.fromCssColorString('#fbbf24'),
          showBackground: true, backgroundColor: new Cesium.Color(0.05, 0.12, 0.2, 0.85),
          pixelOffset: new Cesium.Cartesian2(0, -16),
        },
      })
      measureEntities.push(label)
    }
  },

  // ----------------------- 画路线（点选放点 + 连线 + 同地双击结束） -----------------------
  // 开关：开启后每次单击在地图放一个点并与上一个点连成折线；
  // 画路线：点击放置点并连线；结束时点「完成」按钮（stopRoute）提交并打印坐标。
  startRoute() {
    routeMode = true
    measureMode = null
    addModeType = null
    this.clearMeasure()
    this.clearRoute()
    viewer.canvas.style.cursor = 'crosshair'
    if (store) store.ui.drawRoute = true
    if (pushToast) pushToast('画路线：点击放置点并连线；点「完成」结束并打印坐标', 'info')
  },

  stopRoute() {
    routeMode = false
    if (viewer) viewer.canvas.style.cursor = 'default'
    if (store) store.ui.drawRoute = false
    this.printRoute() // 先打印（读取 routePoints）
    // 把本次已画完的路线移交为“已完成”，保留在屏幕上；之后 startRoute/clearRoute 不会再清掉它
    committedRouteEntities.push(...routeEntities)
    routeEntities = []
    routePoints.length = 0
  },

  // 取消画路线：清空进行中的点并退出，不打印坐标
  cancelRoute() {
    routeMode = false
    if (viewer) viewer.canvas.style.cursor = 'default'
    if (store) store.ui.drawRoute = false
    this.clearRoute()
    if (pushToast) pushToast('画路线已取消', 'warn')
  },

  clearRoute() {
    routePoints.length = 0
    routeEntities.forEach((e) => viewer.entities.remove(e))
    routeEntities = []
  },

  // 吸附：把本地坐标(铺开后米)吸附到 roads/_routes 的最近线段上。
  // 返回 {e,n,snapped}（铺开后米）或 null。容差用「预铺开」单位：TOL≈10m、端点≈4m（乘 FEATURE_SPREAD）。
  snapRoutePoint(localE, localN) {
    const S = FEATURE_SPREAD
    const TOL = 1.25
    const VTOL = 0.5
    const pe = localE / S
    const pn = localN / S
    const segs = []
    for (const [a, b] of roadsConfig.roads || []) segs.push([a, b])
    for (const r of roadsConfig.routes || []) {
      const pts = r.points || []
      for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]])
    }
    let best = null
    for (const [a, b] of segs) {
      const ax = a[0], ay = a[1], bx = b[0], by = b[1]
      const dx = bx - ax, dy = by - ay
      const len2 = dx * dx + dy * dy
      let t = len2 ? ((pe - ax) * dx + (pn - ay) * dy) / len2 : 0
      t = Math.max(0, Math.min(1, t))
      const cx = ax + t * dx, cy = ay + t * dy
      const d = Math.hypot(pe - cx, pn - cy)
      if (!best || d < best.d) {
        const nearA = Math.hypot(pe - ax, pn - ay) < VTOL
        const nearB = Math.hypot(pe - bx, pn - by) < VTOL
        best = { d, p: nearA ? [ax, ay] : nearB ? [bx, by] : [cx, cy] }
      }
    }
    if (best && best.d <= TOL) return { e: best.p[0] * S, n: best.p[1] * S, snapped: true }
    return null
  },

  // 屏幕空间吸附：把点击吸附到路网/路线的屏幕投影（≤12px，近端点≤6px 吸到端点）。
  // 返回吸附点本地坐标{e,n}（铺开后米）或 null。比世界空间吸附稳：不依赖 pickPosition 是否打中地面/模型。
  snapRouteScreen(screenPos) {
    if (!viewer) return null
    const segs = []
    for (const [a, b] of roadsConfig.roads || []) segs.push([a, b])
    for (const r of roadsConfig.routes || []) {
      const pts = r.points || []
      for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]])
    }
    const PX = 12
    let best = null
    for (const [a, b] of segs) {
      const da = this.localToDeg(this.spread(a[0]), this.spread(a[1]), 0)
      const db = this.localToDeg(this.spread(b[0]), this.spread(b[1]), 0)
      const wa = Cesium.Cartesian3.fromDegrees(da.lon, da.lat, da.height || 0)
      const wb = Cesium.Cartesian3.fromDegrees(db.lon, db.lat, db.height || 0)
      const sa = viewer.scene.cartesianToCanvasCoordinates(wa)
      const sb = viewer.scene.cartesianToCanvasCoordinates(wb)
      if (!sa || !sb) continue
      const dx = sb.x - sa.x, dy = sb.y - sa.y
      const len2 = dx * dx + dy * dy
      if (len2 < 4) continue // 屏幕上过短（接近视线方向）的段跳过
      let t = ((screenPos.x - sa.x) * dx + (screenPos.y - sa.y) * dy) / len2
      t = Math.max(0, Math.min(1, t))
      const cx = sa.x + t * dx, cy = sa.y + t * dy
      const d = Math.hypot(screenPos.x - cx, screenPos.y - cy)
      if (!best || d < best.d) {
        const nearA = Math.hypot(screenPos.x - sa.x, screenPos.y - sa.y) < 6
        const nearB = Math.hypot(screenPos.x - sb.x, screenPos.y - sb.y) < 6
        best = { d, a, b, t, sa, sb, vertex: nearA ? a : nearB ? b : null }
      }
    }
    if (!best || best.d > PX) return null
    if (best.vertex) return { e: this.spread(best.vertex[0]), n: this.spread(best.vertex[1]) }
    // 中段：射线取点击投影处的地面交点（必在该线的 3D 线段上，透视下也更准），失败再线性插值兜底
    const cx = best.sa.x + best.t * (best.sb.x - best.sa.x)
    const cy = best.sa.y + best.t * (best.sb.y - best.sa.y)
    const world = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(cx, cy), viewer.scene.globe.ellipsoid)
    if (world) {
      const loc = this.worldToLocal(world)
      if (Number.isFinite(loc.x) && Number.isFinite(loc.y)) return { e: loc.x, n: loc.y }
    }
    return {
      e: this.spread(best.a[0] + (best.b[0] - best.a[0]) * best.t),
      n: this.spread(best.a[1] + (best.b[1] - best.a[1]) * best.t),
    }
  },

  handleRouteAt(screenPos) {
    // 注意：不再用“同位置双击”自动结束路线；结束请用「画路线/完成」按钮（stopRoute）。
    // 优先屏幕空间吸附（≤12px 即精确落在线上/端点上）；未命中再走点击拾取+世界空间吸附
    const sSnap = this.snapRouteScreen(screenPos)
    let info = null
    if (sSnap) {
      const d = this.localToDeg(sSnap.e, sSnap.n, 0)
      const wgs = gcj02ToWgs84(d.lon, d.lat)
      info = {
        gcj02: { lon: +d.lon.toFixed(6), lat: +d.lat.toFixed(6) },
        wgs84: { lon: +wgs[0].toFixed(6), lat: +wgs[1].toFixed(6) },
        height: +(d.height || 0).toFixed(2),
        local: { e: +sSnap.e.toFixed(2), n: +sSnap.n.toFixed(2), h: +(d.height || 0).toFixed(2) },
      }
      if (pushToast) pushToast('画路线：已吸附到路网/路线', 'info')
    } else {
      // 复用点击坐标拾取：每次点击都会输出 GCJ-02 / WGS-84 / 本地坐标（即“记得坐标”）
      info = this.logPickedCoords(screenPos)
      if (!info) return
      // 世界空间兜底吸附：靠近(≤约10m)路网/路线时自动落在线上
      const snap = this.snapRoutePoint(info.local.e, info.local.n)
      if (snap) {
        const d = this.localToDeg(snap.e, snap.n, info.height)
        const wgs = gcj02ToWgs84(d.lon, d.lat)
        info.gcj02 = { lon: +d.lon.toFixed(6), lat: +d.lat.toFixed(6) }
        info.wgs84 = { lon: +wgs[0].toFixed(6), lat: +wgs[1].toFixed(6) }
        info.local = { e: +snap.e.toFixed(2), n: +snap.n.toFixed(2), h: info.local.h }
        if (pushToast) pushToast('画路线：已吸附到路网/路线', 'info')
      }
    }
    routePoints.push(info)
    this.renderRoute()
    if (pushToast)
      pushToast(`画路线：已放置 ${routePoints.length} 个点，同一位置双击结束`, 'info')
  },

  renderRoute() {
    routeEntities.forEach((e) => viewer.entities.remove(e))
    routeEntities = []
    if (routePoints.length === 0) return
    const positions = routePoints.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.gcj02.lon, p.gcj02.lat, p.height),
    )
    // 点标记 + 编号标签
    routePoints.forEach((p, i) => {
      const e = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(p.gcj02.lon, p.gcj02.lat, p.height),
        point: {
          pixelSize: 11,
          color: Cesium.Color.fromCssColorString('#22d3ee'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `#${i + 1}  ${p.gcj02.lon.toFixed(5)}, ${p.gcj02.lat.toFixed(5)}`,
          font: '12px "Microsoft YaHei", sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#22d3ee'),
          showBackground: true,
          backgroundColor: new Cesium.Color(0.04, 0.1, 0.18, 0.85),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          pixelOffset: new Cesium.Cartesian2(0, -16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(2000, 1, 9000, 0.4),
        },
      })
      routeEntities.push(e)
    })
    // 连线
    if (routePoints.length >= 2) {
      const lineColor = Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.9)
      const line = viewer.entities.add({
        polyline: {
          positions,
          width: 3,
          material: lineColor,
          // 贴地渲染：避免俯视(90°)时与地表/模型共面被深度测试吃掉（PolylineGraphics 不支持 disableDepthTestDistance）
          clampToGround: true,
          // 被建筑等遮挡时仍绘制，俯视规划时也能看到整条线
          depthFailMaterial: lineColor,
        },
      })
      routeEntities.push(line)
    }
  },

  printRoute() {
    if (routePoints.length < 2) {
      console.log('[画路线] 已取消，当前点数：', routePoints.length)
      if (pushToast) pushToast(`画路线已取消（${routePoints.length} 个点）`, 'warn')
      this.clearRoute()
      return
    }
    const arr = routePoints.map((p, i) => ({
      index: i + 1,
      gcj02: [p.gcj02.lon, p.gcj02.lat],
      wgs84: [p.wgs84.lon, p.wgs84.lat],
      height: p.height,
      local: { e: p.local.e, n: p.local.n, h: p.local.h },
      preSpread: [+(p.local.e / FEATURE_SPREAD).toFixed(4), +(p.local.n / FEATURE_SPREAD).toFixed(4)],
    }))
    console.log(`[画路线] 路线坐标数组（共 ${routePoints.length} 点；preSpread 即 roads-config.json 用的 [e,n]，可直接粘贴）：`, arr)
    console.log('[画路线] JSON: ' + JSON.stringify(arr))
    if (pushToast) pushToast(`画路线完成：${routePoints.length} 个点，坐标已打印到控制台`, 'success')
  },

  // ----------------------- 人员轨迹回放 ------------------------------------
  showTrail(feature) {
    this.clearTrail()
    if (!feature || !Array.isArray(feature.trail) || feature.trail.length === 0) return null
    const positions = feature.trail.map((p) => {
      const d = this.localToDeg(this.spread(p.e), this.spread(p.n), p.h)
      return Cesium.Cartesian3.fromDegrees(d.lon, d.lat, d.height)
    })
    const line = viewer.entities.add({
      polyline: {
        positions,
        width: 3,
        material: Cesium.Color.fromCssColorString(TYPE_DEFS.person.color).withAlpha(0.6),
      },
    })
    trailEntities.push(line)
    this._trailMarker = viewer.entities.add({
      position: positions[0],
      point: { pixelSize: 11, color: Cesium.Color.fromCssColorString('#38bdf8'), outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
    })
    trailEntities.push(this._trailMarker)
    if (feature.trail[0]) {
      const p = feature.trail[0]
      const d = this.localToDeg(p.e, p.n, p.h)
      viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(d.lon, d.lat + 0.0004, 200), orientation: { heading: 0, pitch: toRad(-35), roll: 0 }, duration: 1 })
    }
    return feature.trail.length
  },

  setTrailIndex(i) {
    if (this._trailMarker && this._trailFeature && this._trailFeature.trail[i]) {
      const p = this._trailFeature.trail[i]
      const d = this.localToDeg(this.spread(p.e), this.spread(p.n), p.h)
      this._trailMarker.position = Cesium.Cartesian3.fromDegrees(d.lon, d.lat, d.height)
    }
  },

  clearTrail() {
    trailEntities.forEach((e) => viewer.entities.remove(e))
    trailEntities = []
    this._trailMarker = null
    this._trailFeature = null
  },

  startTrail(feature) {
    const n = this.showTrail(feature)
    this._trailFeature = feature
    return n
  },
}


