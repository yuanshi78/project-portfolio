import * as Cesium from 'cesium';
import { MODEL_BASE } from './shared.js';

// ------------------------------- 消防车 FireVehicle -------------------------
// 移植自 ordos：FireVehicle.glb 模型（按车头方位旋转）+ FireVehicleEffectRange 作业范围。
// 模型为 Microsoft GLTF Exporter 导出的 Z-up（车身长轴=Y 20.4m、车宽=X 7.3m、车高=Z 5.6m），
// 故必须传 upAxis: Z；之后绕 Z(上) 旋转 -direction 即可把车头（默认朝北）转到罗盘方位。
// headingOffset：若模型自身朝向与「长轴朝北」不一致，用它做 ±90/±180 校准。
// 附加 ordos 没有的能力：沿路网行驶动画（route + speed）。

// 车体自身轴向校正（度）：组合顺序 = Rz(方位) · Rx(tiltX) · Rz(tiltZ) · scale
//   tiltZ 绕「上」轴（Z）转：只在水平面内改车头朝向，车不会侧翻 → 默认 0（模型长轴 Y 已朝北，
//     Rz(-direction) 正好把车头转到行进方位；之前误设 90 会让车整体偏 90° 变成「横着走」）
//   tiltX 绕「东」轴（X）俯仰：会把车掀起来/按倒 → 除非车是躺着的，否则不要用（默认 0）
// 两者都在方位旋转之前生效，所以不会破坏「车头沿路」的朝向。
// 车头若仍是反的（车尾在前），用 headingOffset: 180 校准，而不是动 tiltZ。
// 模型局部最低点（车底/车轮）的 Z 坐标：实测包围盒 Z ∈ [-3.0, 6.3]（车高 9.3，含举升的云梯）。
// 放置点的高度为 0（地面），而模型原点(0,0,0)落在车体顶部，故车底会陷进地下 3.0×scale 米。
// 这里把车底抬到放置点高度：竖直抬升量 = -MODEL_MIN_Z × scale。
const MODEL_MIN_Z = -3.0
export function fireVehicleMatrix(center, direction = 0, scale = 1, headingOffset = 0, tiltX = 0, tiltZ = 0) {
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center)
  let m = Cesium.Matrix4.fromRotationTranslation(
    Cesium.Matrix3.fromRotationZ(-Cesium.Math.toRadians(direction + headingOffset)),
    new Cesium.Cartesian3(0, 0, 0),
  )
  const rot = (axis, deg) => Cesium.Matrix4.fromRotationTranslation(
    Cesium.Matrix3['fromRotation' + axis](Cesium.Math.toRadians(deg)),
    new Cesium.Cartesian3(0, 0, 0),
  )
  if (tiltZ) m = Cesium.Matrix4.multiply(m, rot('Z', tiltZ), new Cesium.Matrix4())
  if (tiltX) m = Cesium.Matrix4.multiply(m, rot('X', tiltX), new Cesium.Matrix4())
  const s = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(scale, scale, scale))
  const ms = Cesium.Matrix4.multiply(m, s, new Cesium.Matrix4())
  // 车底贴地：在缩放之后、enu 之前做一次纯竖直抬升（绕上轴旋转不受影响，车不会侧翻也不会偏移）。
  const lift = -MODEL_MIN_Z * scale
  const msLifted = Cesium.Matrix4.multiply(
    Cesium.Matrix4.fromTranslation(new Cesium.Cartesian3(0, 0, lift)),
    ms,
    new Cesium.Matrix4(),
  )
  return Cesium.Matrix4.multiply(enu, msLifted, new Cesium.Matrix4())
}

export async function createFireVehicle(viewer, opts = {}) {
  const {
    center, height = 0, direction = 0, range = 0,
    scale = 1.5, headingOffset = 0, tiltX = 0, tiltZ = -180, name = '消防车',
    // 行驶动画：route = [{ position: Cartesian3, heading: 度 }]，speed 米/秒，delay 秒
    route = null, speed = 40, delay = 0,
    // 持续动画：开到事故现场 → 待命 → 原路返回消防站 → 待命 → 再出发，循环往复
    loopDrive = true, rest = 5,
    // 多车协同：coord 为同一报警的多车共享对象，用于「三辆车都到了才放行」。
    //   coord = { total, arrived, releaseAt, released }，由调用方创建并传入每辆车。
    coord = null,
    // 相位切换回调：
    //   onArrive ：某辆车进入「现场」（每车一次）。
    //   onRelease：所有车到场、并现场等待 sceneHold 秒后统一放行（车开始返程）——「火展示 5 秒后熄火」。
    //   onReturn ：某辆车回到「消防站」——用于顺序火警演练里「本报警处置完、切下一个」。
    onArrive = null, onRelease = null, onReturn = null,
    // 全部到场后、发车返程前，在现场等待的秒数（对应「三辆车都到了才等五秒」）
    sceneHold = 5,
  } = opts

  const model = await Cesium.Model.fromGltfAsync({
    url: MODEL_BASE + 'windDirection/FireVehicle.glb',
    modelMatrix: fireVehicleMatrix(center, direction, scale, headingOffset, tiltX, tiltZ),
    // Cesium 1.146 的 upAxis 用的是 Axis 枚举（GltfUpAxis 已不存在，写了会直接抛错）
    // 模型的局部轴：车高=Z、车身长轴(车头朝向)=Y、车宽=X（实测包围盒 X≈7.9 / Y≈21.2 / Z≈9.3）
    upAxis: Cesium.Axis.Z,
    // upAxis=Z 时 Cesium 不做任何轴向校正（getAxisCorrectionMatrix 只对 Y/X 做校正），
    // 所以模型轴直接对应 ENU：X→东、Y→北、Z→上，车自然立着、车头默认朝北。
    forwardAxis: Cesium.Axis.Y, // 声明车头是 +Y（此处为声明性参数，不额外产生旋转）
  })
  viewer.scene.primitives.add(model)

  // 作业范围（对应 ordos 的 FireVehicleEffectRange，俯视投影成半透明圆）
  // 行驶途中隐藏，到位停稳后显示
  let ring = null
  if (range > 0) {
    ring = viewer.entities.add({
      name: name + '作业范围',
      position: center,
      ellipse: {
        semiMajorAxis: range,
        semiMinorAxis: range,
        height,
        material: Cesium.Color.CYAN.withAlpha(0.1),
        outline: true,
        outlineColor: Cesium.Color.CYAN.withAlpha(0.45),
      },
    })
  }

  let visible = true
  let driving = false

  // ---------------------------- 沿路行驶动画 ----------------------------
  let tickFn = null
  if (route && route.length > 1) {
    const cum = [0]
    for (let i = 1; i < route.length; i++) {
      cum.push(cum[i - 1] + Cesium.Cartesian3.distance(route[i - 1].position, route[i].position))
    }
    const total = cum[cum.length - 1]
    if (ring) ring.show = false
    driving = true
    const t0 = performance.now()
    const pos = new Cesium.Cartesian3()

    // 按「已行进距离 s」把车摆到折线上；back=true 表示正在返回，车头反向
    const place = (s, back) => {
      const d = Math.max(0, Math.min(total, s))
      let i = 0
      while (i < cum.length - 2 && d > cum[i + 1]) i++
      const segLen = cum[i + 1] - cum[i]
      const k = segLen > 1e-9 ? Math.max(0, Math.min(1, (d - cum[i]) / segLen)) : 1
      Cesium.Cartesian3.lerp(route[i].position, route[i + 1].position, k, pos)
      model.modelMatrix = fireVehicleMatrix(pos, route[i].heading + (back ? 180 : 0), scale, headingOffset, tiltX, tiltZ)
      if (ring) ring.position = pos
      return d
    }

    const outTime = total / Math.max(1e-6, speed)

    // 状态机驱动（支持多车协同）：out → scene(等全部到场 + sceneHold 秒) → back → station(等 rest 秒) → out…
    // 关键：只有 coord.arrived 达到 coord.total（三辆车都到了），才设定 releaseAt；
    //       到点后所有在现场的车一起转 back，实现「三辆车都到了才等五秒，然后一起走」。
    let phase = 'out'
    let phaseStart = null
    let prevPhase = 'out'
    let arrivedMark = false
    tickFn = () => {
      const nowMs = performance.now()
      const el = nowMs / 1000 - t0 / 1000 - delay
      if (el < 0) return // 还没到出发时间（车队依次出发用）
      if (phaseStart === null) phaseStart = el
      let s = 0
      let back = false

      if (phase === 'out') {
        const dt = el - phaseStart
        if (dt >= outTime) { phase = 'scene'; phaseStart = el }
        else s = dt * speed
      }
      if (phase === 'scene') {
        s = total // 停在现场待命
        if (!arrivedMark) {
          arrivedMark = true
          if (coord) {
            coord.arrived++
            // 最后一辆到场 → 设定「再等 sceneHold 秒」的统一放行时刻
            if (coord.arrived >= coord.total && coord.releaseAt === 0) coord.releaseAt = nowMs / 1000 + sceneHold
          }
          if (onArrive) onArrive()
        }
        // 全部到场并等待 sceneHold 秒后，统一放行（三辆车一起返程）
        // 注意：用「进入本相位后的时长」判断，不能用跨相位过期的 dt
        const sceneElapsed = el - phaseStart
        const canLeave = coord
          ? (coord.released || (coord.releaseAt > 0 && nowMs / 1000 >= coord.releaseAt))
          : (sceneElapsed >= sceneHold)
        if (canLeave) {
          // onRelease（熄火）只触发一次
          if (coord && !coord.released && onRelease) { coord.released = true; onRelease() }
          else if (coord) coord.released = true
          else if (onRelease) onRelease()
          phase = 'back'; phaseStart = el
        }
      }
      if (phase === 'back') {
        const dt = el - phaseStart
        if (dt >= outTime) { phase = 'station'; phaseStart = el }
        else { s = total - dt * speed; back = true }
      }
      if (phase === 'station') {
        const dt = el - phaseStart
        s = 0
        if (loopDrive && dt >= rest) { phase = 'out'; phaseStart = el }
      }

      // 回到消防站回调（用于顺序演练推进下一个火警）
      if (phase !== prevPhase) {
        if (prevPhase === 'back' && phase === 'station' && onReturn) onReturn()
        if (!loopDrive && phase === 'station') stopDriving() // 非循环：回到站即停
        prevPhase = phase
      }
      const d = place(s, back)
      // 作业范围只在「停在事故现场待命」时显示
      if (ring) ring.show = visible && Math.abs(d - total) < 1
    }
    viewer.scene.preRender.addEventListener(tickFn)
  }

  function stopDriving() {
    if (tickFn) {
      viewer.scene.preRender.removeEventListener(tickFn)
      tickFn = null
    }
    driving = false
  }

  return {
    get driving() {
      return driving
    },
    setVisible(v) {
      visible = v
      model.show = v
      // 循环行驶时作业范围由 tick 控制（只在现场待命时才显示），否则跟随显隐
      if (ring && !tickFn) ring.show = v && !driving
    },
    remove() {
      stopDriving()
      viewer.scene.primitives.remove(model)
      if (ring) viewer.entities.remove(ring)
    },
  }
}
