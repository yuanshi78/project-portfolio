<script setup>
// 首屏 3D 粒子聚合动画（零依赖，原生 canvas + 自写轻量 3D 投影）。
// 流程：漂浮的「云」→ 粒子汇聚、绕 Y 轴旋转 → 凝结成发光 3D 文字「元实」→ 定格 → 淡出 → 触发 done 露出首页。
// 目标形状由离屏 canvas 绘制「元实」并采样像素得到（无需 CJK 3D 字体文件）。
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['done'])
const canvasRef = ref(null)
const rootRef = ref(null)

let raf = 0
let ctx = null
let W = 0
let H = 0
let dpr = 1
let particles = []
let sprite = null
const mouse = { x: 0, y: 0 }
let startTs = 0
let faded = false

const reduce = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 各阶段时长（ms）
const T_CLOUD = 700
const T_CONVERGE = 3000
const T_HOLD = 1100
const T_FADE = 900

const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// 离屏绘制「元实」并采样像素，得到文字点云目标坐标（带轻微 z 厚度）
const buildTargets = () => {
  const ow = 760
  const oh = 380
  const off = document.createElement('canvas')
  off.width = ow
  off.height = oh
  const o = off.getContext('2d')
  o.fillStyle = '#fff'
  o.textAlign = 'center'
  o.textBaseline = 'middle'
  o.font = `900 ${Math.floor(oh * 0.74)}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`
  o.fillText('元实', ow / 2, oh / 2 + 4)

  const data = o.getImageData(0, 0, ow, oh).data
  const pts = []
  const step = 4
  for (let y = 0; y < oh; y += step) {
    for (let x = 0; x < ow; x += step) {
      if (data[(y * ow + x) * 4 + 3] > 128) {
        pts.push({
          tx: (x - ow / 2) * 0.0042,
          // 👉 与 canvas 的 y 轴方向保持一致（y 向下为正），否则整段文字会上下颠倒
          ty: (y - oh / 2) * 0.0042,
          tz: (Math.random() - 0.5) * 0.12,
        })
      }
    }
  }
  // 控制总量，避免低端机过载
  const CAP = 9000
  if (pts.length > CAP) {
    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = pts[i]
      pts[i] = pts[j]
      pts[j] = tmp
    }
    pts.length = CAP
  }
  return pts
}

// 预渲染发光精灵（紫色径向渐变），用 drawImage 高频绘制以保证性能
const buildSprite = () => {
  const s = document.createElement('canvas')
  s.width = s.height = 32
  const g = s.getContext('2d')
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(190,150,255,0.85)')
  grad.addColorStop(1, 'rgba(140,87,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 32, 32)
  return s
}

const resize = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = rect.width
  H = rect.height
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

// 👉 「元实」做成双面可读的 3D 厚板：正面 + 镜像背面。
// 背面把 x、z 同时镜像，使整块绕 Y 轴转 180° 后背面正好正向可读（不会再反字）。
const SLAB = 0.22 // 厚度半值（世界单位）

const makeParticle = t => {
  const r = 2.4 + Math.random() * 1.4
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  return {
    tx: t.tx,
    ty: t.ty,
    tz: t.tz,
    x0: r * Math.sin(phi) * Math.cos(theta),
    y0: r * Math.sin(phi) * Math.sin(theta),
    z0: r * Math.cos(phi),
    tw: Math.random() * Math.PI * 2, // 闪烁相位
    sp: 0.6 + Math.random() * 0.8, // 闪烁速度
  }
}

const init = () => {
  const targets = buildTargets()
  particles = []
  for (const f of targets) {
    // 正面（z 偏前）
    particles.push(makeParticle({ tx: f.tx, ty: f.ty, tz: f.tz + SLAB }))
    // 背面（x、z 镜像 → 旋转 180° 后正面可读）
    particles.push(makeParticle({ tx: -f.tx, ty: f.ty, tz: -(f.tz + SLAB) }))
  }
}

// 双轴旋转：yaw 绕 Y（偏航）、pitch 绕 X（俯仰）。配合双面可读厚板，任意角度都不反字。
const project = (x, y, z, yaw, pitch, base) => {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const y1 = y * cp - z1 * sp
  const z2 = y * sp + z1 * cp
  const camZ = z2 + 4.2
  const scale = 4.2 / camZ
  return {
    sx: W / 2 + x1 * scale * base,
    sy: H / 2 + y1 * scale * base,
    depth: scale,
    zr: z2, // 旋转后（俯仰前）的深度，用于判断正/背面朝向
  }
}

const smoothstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const draw = (ease, yaw, time, pitch = 0) => {
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)

  const base = Math.min(W * 0.26, H * 0.6)
  ctx.globalCompositeOperation = 'lighter'

  for (const p of particles) {
    // 世界空间插值（起点云 → 文字目标），旋转由 project 单次完成，避免双重旋转
    const x = p.x0 + (p.tx - p.x0) * ease
    const y = p.y0 + (p.ty - p.y0) * ease
    const z = p.z0 + (p.tz - p.z0) * ease

    const pr = project(x, y, z, yaw, pitch, base)
    if (pr.depth <= 0) continue

    // 👉 朝向亮度：朝向相机的面亮、背面几乎隐藏（更窄过渡带，消除镜像残影）
    const face = 0.05 + 0.95 * smoothstep(-SLAB * 0.6, SLAB * 0.6, pr.zr)

    // 闪烁 + 近大远小
    const tw = 0.65 + 0.35 * Math.sin(time * 0.003 * p.sp + p.tw)
    const size = (1.6 + pr.depth * 2.4) * tw
    ctx.globalAlpha = Math.min(1, 0.3 + pr.depth * 0.6) * face * tw
    ctx.drawImage(sprite, pr.sx - size, pr.sy - size, size * 2, size * 2)
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

const loop = now => {
  if (!startTs) startTs = now
  const elapsed = now - startTs

  let ease
  let yaw
  if (elapsed < T_CLOUD) {
    ease = 0
    yaw = 0
  } else if (elapsed < T_CLOUD + T_CONVERGE) {
    // 👉 边汇聚边翻面：yaw 随收敛进度 0 → π（转 180°）
    const k = easeInOutCubic((elapsed - T_CLOUD) / T_CONVERGE)
    ease = k
    yaw = Math.PI * k
  } else {
    // 定格在 180°：此时背面朝向相机且正向可读；鼠标视差做小幅偏移
    ease = 1
    yaw = Math.PI + mouse.x * 0.15
  }
  const pitch = 0.06 + mouse.y * 0.2

  draw(ease, yaw, now, pitch)
  raf = requestAnimationFrame(loop)

  if (!faded && elapsed >= T_CLOUD + T_CONVERGE + T_HOLD) {
    faded = true
    if (rootRef.value) rootRef.value.style.opacity = '0'
    setTimeout(() => emit('done'), T_FADE)
  }
}

const onMove = e => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  sprite = buildSprite()
  resize()
  init()

  // 👉 动画期间锁定页面滚动，隐藏底层首页的滚动条
  document.documentElement.classList.add('intro-scroll-lock')

  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('mousemove', onMove, { passive: true })

  if (reduce) {
    // 减弱动效：直接渲染正面凝结态，短暂停留后淡出
    draw(1, 0, 0, 0)
    setTimeout(() => {
      if (rootRef.value) rootRef.value.style.opacity = '0'
      setTimeout(() => emit('done'), T_FADE)
    }, 900)
    return
  }

  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', onMove)
  // 👉 动画结束，恢复页面滚动与滚动条
  document.documentElement.classList.remove('intro-scroll-lock')
})
</script>

<template>
  <div
    ref="rootRef"
    class="intro-overlay"
  >
    <canvas
      ref="canvasRef"
      class="intro-canvas"
      aria-hidden="true"
    />
  </div>
</template>

<style lang="scss" scoped>
.intro-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background:
    radial-gradient(120% 120% at 50% 40%, #1b1442 0%, #0b0a1c 55%, #05040d 100%);
  opacity: 1;
  transition: opacity 0.9s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.intro-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
