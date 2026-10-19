import * as Cesium from 'cesium'

// ----------------------------- 火灾 Fire ---------------------------------------
// 组合：fireNew.png 贴图 + Cesium 官方 Sandcastle particle-system 示例结构 + 「滑动」
//   [Sandcastle] emitterModelMatrix 用 TranslationRotationScale(TRS) 构造
//   [Sandcastle] 力用 applyGravity，gravity 是可调旋钮（示例默认 0）
//   [Sandcastle] bursts 制造周期性"轰燃"
//   [滑动]       updateCallback 里按相机距离实时缩放粒子尺寸（ordos snowUpdate 的效果）：
//                推拉镜头时火焰整体变大/变小，即"随视角滑动"。
//                基准系数按本 demo 默认视角(相机约 520m 高)标定，并夹在 [8,26]
//                ——否则远看会小到看不见（这是之前火"看不见"的根因）。

const FIRE_TEXTURE = import.meta.env.BASE_URL + 'data/texture/fireNew.png'

// scale：火焰随要素一起铺开的倍率（传 FEATURE_SPREAD）。
// 厂区放大后默认视角相机在 3km 外，1.1m 的火只有几个像素、根本看不见，
// 故发射面/速度/像素尺寸都按 scale 同步放大。
export function createFire(scene, modelMatrix, scale = 1) {
  const s = Math.max(1, scale || 1)
  const viewModel = {
    emissionRate: 26.0,
    gravity: 0.0,
    minimumParticleLife: 1.2,
    maximumParticleLife: 2.6,
    minimumSpeed: 0.6 * s,
    maximumSpeed: 2.4 * s,
    startScale: 0.6,
    endScale: 2.4,
    particleSize: 14.0 * s,
    // 滑动基准：SLIDE_BASE * ratio ≈ 粒子像素尺寸（ratio = atan(25/距离)/(fov/2)）。
    // 默认视角 d≈3.5km 时 ratio≈0.013，取 150*s → 约 16px，再被 slideMin 兜底到 8*s。
    slideBase: 150.0 * s,
    slideMin: 8.0 * s,
    slideMax: 26.0 * s,
  }

  // [Sandcastle] applyGravity：先算粒子在地心空间的"上"方向，再按 gravity 施加
  const gravityScratch = new Cesium.Cartesian3()
  const applyGravity = (p, dt) => {
    Cesium.Cartesian3.normalize(p.position, gravityScratch)
    Cesium.Cartesian3.multiplyByScalar(gravityScratch, viewModel.gravity * dt, gravityScratch)
    p.velocity = Cesium.Cartesian3.add(p.velocity, gravityScratch, p.velocity)
  }

  // [滑动] 按相机距离缩放粒子尺寸（ordos snowUpdate）
  const slide = (particle) => {
    if (!scene || !scene.camera) return
    const cam = scene.camera
    const distance = Cesium.Cartesian3.distance(cam.positionWC, particle.position)
    const fov = (cam.frustum && cam.frustum.fov) ? cam.frustum.fov : 1.0
    const ratio = Math.atan(25.0 / distance) / (fov * 0.5)
    const size = Math.min(
      viewModel.slideMax,
      Math.max(viewModel.slideMin, viewModel.slideBase * ratio),
    )
    particle.imageSize.x = size
    particle.imageSize.y = size
  }

  const updateCallback = (p, dt) => {
    applyGravity(p, dt)
    slide(p)
  }

  // [Sandcastle] TRS 构造发射器矩阵：发射口朝上（hpr 全 0），抬高 1m
  const translation = new Cesium.Cartesian3()
  const rotation = new Cesium.Quaternion()
  const hpr = new Cesium.HeadingPitchRoll()
  const trs = new Cesium.TranslationRotationScale()
  const computeEmitterModelMatrix = (result, lift = 1.0) => {
    Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, hpr)
    Cesium.Cartesian3.fromElements(0.0, 0.0, lift, translation)
    Cesium.Quaternion.fromHeadingPitchRoll(hpr, rotation)
    trs.translation = translation
    trs.rotation = rotation
    trs.scale = new Cesium.Cartesian3(1.0, 1.0, 1.0)
    return Cesium.Matrix4.fromTranslationRotationScale(trs, result)
  }
  // 允许 imageSize 在 [slideMin, slideMax] 内自由滑动（不被 Cesium 夹住）
  const allowSlide = (ps) => {
    ps.minimumImageSize.x = viewModel.slideMin
    ps.minimumImageSize.y = viewModel.slideMin
    ps.maximumImageSize.x = viewModel.slideMax
    ps.maximumImageSize.y = viewModel.slideMax
  }

  const fire = scene.primitives.add(new Cesium.ParticleSystem({
    image: FIRE_TEXTURE,
    startColor: Cesium.Color.RED.withAlpha(0.7),
    endColor: Cesium.Color.YELLOW.withAlpha(0.0),
    startScale: viewModel.startScale,
    endScale: viewModel.endScale,
    minimumParticleLife: viewModel.minimumParticleLife,
    maximumParticleLife: viewModel.maximumParticleLife,
    minimumSpeed: viewModel.minimumSpeed,
    maximumSpeed: viewModel.maximumSpeed,
    imageSize: new Cesium.Cartesian2(viewModel.particleSize, viewModel.particleSize),
    emissionRate: viewModel.emissionRate,
    // [Sandcastle] 周期性轰燃
    bursts: [
      new Cesium.ParticleBurst({ time: 2.0, minimum: 6, maximum: 14 }),
      new Cesium.ParticleBurst({ time: 7.0, minimum: 6, maximum: 14 }),
      new Cesium.ParticleBurst({ time: 12.0, minimum: 6, maximum: 14 }),
    ],
    lifetime: 16.0,
    emitter: new Cesium.CircleEmitter(1.1 * s),
    emitterModelMatrix: computeEmitterModelMatrix(new Cesium.Matrix4()),
    updateCallback,
    modelMatrix,
  }))
  allowSlide(fire)

  // 烟：同贴图，更暗、更大、寿命更长
  const smoke = scene.primitives.add(new Cesium.ParticleSystem({
    image: FIRE_TEXTURE,
    startColor: Cesium.Color.BLACK.withAlpha(0.2),
    endColor: Cesium.Color.BLACK.withAlpha(0.45),
    startScale: 0.8,
    endScale: 3.0,
    minimumParticleLife: 2.2,
    maximumParticleLife: 5.0,
    minimumSpeed: viewModel.minimumSpeed,
    maximumSpeed: viewModel.maximumSpeed,
    imageSize: new Cesium.Cartesian2(24 * s, 24 * s),
    emissionRate: 7,
    lifetime: 25.0,
    emitter: new Cesium.CircleEmitter(1.1 * s),
    // 烟从火焰上方 4m*s 处开始生成，避免黑烟盖住下方火焰
    emitterModelMatrix: computeEmitterModelMatrix(new Cesium.Matrix4(), 4.0 * s),
    updateCallback,
    modelMatrix,
  }))
  allowSlide(smoke)

  return { fire, smoke }
}
