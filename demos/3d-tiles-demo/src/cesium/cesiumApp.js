import { watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { FEATURE_SPREAD, MODEL_LIFT, MODEL_SCALE, PLANT, TYPE_DEFS } from '../data/seed.js';
import { addFeature, closeInfo, getFeature, groupVisibleFor, selectFeature, store } from '../store.js';
import {
  createCriticalZone, createFence, createFire, createRadarCoverage, createWindDirection,
  cylinderMatrix, toColor, windDirectionMatrix,
} from './entities/index.js';

let viewer = null
let tileset = null
let enuMatrix = null
let handler = null
let addModeType = null
let measureMode = null // 'distance' | 'area' | null
const measurePoints = [] // 本地 [e,n,h]
let measureEntities = []
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

// 火焰贴图已随 createFire 迁移到 entities/Fire.js
const fireParticles = new Map() // featureId -> { fire, smoke }
const hazardZones = new Map()   // featureId -> 危险区(呼吸光柱) entity
const ordosFx = new Map()       // featureId -> { obj } 移植自 ordos 的 Primitive / Model

// 由 ordos 移植实体驱动的要素类型
const ORDOS_FX_TYPES = new Set(['radar', 'danger', 'fence', 'wind'])

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
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b1a2b')
    viewer.scene.globe.depthTestAgainstTerrain = true
    // 关键：ParticleSystem 用「帧间时钟差 dt」计算发射量（numToEmit = dt * emissionRate）。
    // 默认 Viewer 的 clock.shouldAnimate 为 false（动画/时间轴控件被关掉时更明显），
    // 时钟不走 → dt 恒为 0 → 一个粒子都不发射，火焰/烟雾完全看不见。
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

    // 加载由 public/gltf/1bca1a8949e08e2284a4d953f42acebd.glb 转换的本地 3D Tiles
    try {
      tileset = await Cesium.Cesium3DTileset.fromUrl(import.meta.env.BASE_URL + 'data/imported-model/tileset.json', {
        maximumScreenSpaceError: 16,
      })
      // 该 glb 以极小尺度建模（包围球半径≈0.61 单位），直接放进「米」级 ENU 会小到看不见，
      // 故按包围球归一化到厂区尺度。
      // 朝向修正（依据侧视截图实测校准）：节点四元数与 tileset transform 各 +90°绕X，
      // 叠加 Cesium 内部 Y→Z 后净旋转为 +90°绕X——模型「竖立」。这里绕 local X 转
      // -90° 使模型正立平放（结构朝上、占地 ~0.72×0.96、高 ~0.10）。
      const radius = tileset.boundingSphere ? tileset.boundingSphere.radius : 0
      // 归一化到厂区尺度后，再乘 MODEL_SCALE（只调大小，位置/朝向不变）
      const scale = (radius > 0 ? 240 / (2 * radius) : 196) * MODEL_SCALE
      const rotXLayFlat = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(-90)),
        Cesium.Cartesian3.ZERO,
      )
      // 贴地微调：MODEL_LIFT 是「米」，这里除 scale 还原成 tile-local 单位
      // （lift 在缩放之前施加，写 0.1 之类的常数会被 scale 成倍放大，改一次就得重算）
      const lift = Cesium.Matrix4.fromTranslation(new Cesium.Cartesian3(0, 0, MODEL_LIFT / scale))
      const local = Cesium.Matrix4.multiply(lift, rotXLayFlat, new Cesium.Matrix4())
      const scaledLocal = Cesium.Matrix4.multiply(
        Cesium.Matrix4.fromUniformScale(scale),
        local,
        new Cesium.Matrix4(),
      )
      tileset.modelMatrix = Cesium.Matrix4.multiply(enuMatrix, scaledLocal, new Cesium.Matrix4())
      // 提亮模型：① 增强场景直射光强度（对受光照的 PBR 材质有效）；
      // ② 若材质为 unlit（不受光照影响），则靠轻微「向白色混合」整体抬亮（保留纹理）。
      // 两者互补，调亮可加大下面两个值（intensity 到 4~5、colorBlendAmount 到 0.3~0.4）。
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
      this.syncFeatures()
      this.bindEvents()
      this.resetView()
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
          image: IMG_BASE + (def.icon || 'icon_default.png'),
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
    // 报警状态高亮
    if (feature.type === 'alarm' && ent.billboard) {
      ent.billboard.width = feature.status === 'active' ? 44 : 36
      ent.billboard.height = feature.status === 'active' ? 44 : 36
      ent.billboard.color = feature.status === 'active'
        ? Cesium.Color.fromCssColorString('#ff3b3b')
        : Cesium.Color.fromCssColorString('#7f8a99')
    }
    // 火焰粒子特效：只有「激活中的报警点」才是真正的火情点
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
      if (fx && fx.obj) fx.obj.show = vis
    }
  },

  syncFire(feature) {
    // type 'fire' 是消防设备（灭火器站），不是着火点，不该一直烧；
    // 只有 alarm 且 status==='active' 才是真实火情，才点火。
    const wantFire = feature.type === 'alarm' && feature.status === 'active'
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
        // glTF 异步加载：先占位，加载完成后回填（若期间被移除则丢弃）
        const holder = { obj: null }
        ordosFx.set(feature.id, holder)
        createWindDirection(viewer.scene, {
          center,
          direction: feature.direction || 0,
          level: feature.level || 0.15,
          color: toColor(TYPE_DEFS.wind.color, 1.0),
        }).then((model) => {
          if (ordosFx.get(feature.id) === holder) holder.obj = model
          else viewer.scene.primitives.remove(model)
        }).catch(() => {})
      }
      return
    }

    // 已存在：仅更新变换矩阵（圆柱类 / 风向模型）
    if (!fx.obj) return
    if (feature.type === 'radar' || feature.type === 'danger') {
      fx.obj.modelMatrix = cylinderMatrix(center, radius, height)
    } else if (feature.type === 'wind') {
      fx.obj.modelMatrix = windDirectionMatrix(center, feature.direction || 0, feature.level || 0.15)
    }
  },

  removeOrdosFx(id) {
    const fx = ordosFx.get(id)
    if (fx) {
      if (fx.obj) viewer.scene.primitives.remove(fx.obj)
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


