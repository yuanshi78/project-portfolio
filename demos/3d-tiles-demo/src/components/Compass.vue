<template>
  <!-- 纯 SVG 自绘罗盘：外圈刻度 + N/E/S/W 随相机朝向旋转，顶部固定指针读数。
       不再复用 data/img/WindDirection.png（那是绿色双向箭头，会被误认成风向标）。 -->
  <div
    class="compass"
    :title="`当前朝向 ${Math.round(bearing)}°，点击回正北`"
    @click="resetNorth"
  >
    <svg class="dial" viewBox="0 0 100 100" :style="{ transform: `rotate(${-deg}deg)` }">
      <circle class="ring" cx="50" cy="50" r="45" />
      <circle class="ring inner" cx="50" cy="50" r="34" />
      <line
        v-for="t in ticks"
        :key="t.a"
        :class="t.major ? 'tick major' : 'tick'"
        x1="50" y1="7" x2="50" y2="14"
        :transform="`rotate(${t.a} 50 50)`"
      />
      <text class="label north" x="50" y="27">N</text>
      <text class="label" x="50" y="80">S</text>
      <text class="label" x="81" y="53.5">E</text>
      <text class="label" x="19" y="53.5">W</text>
    </svg>
    <!-- 固定指针（不随盘面转），指向屏幕上方＝当前朝向 -->
    <i class="marker"></i>
    <i class="hub"></i>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as Cesium from 'cesium'
import { app } from '../cesium/cesiumApp.js'

const deg = ref(0)
let removePostRender = null
let timer = null

// 每 15° 一根刻度，45° 倍数加长
const ticks = []
for (let a = 0; a < 360; a += 15) ticks.push({ a, major: a % 45 === 0 })

const bearing = computed(() => ((deg.value % 360) + 360) % 360)

onMounted(() => {
  // viewer 由 app.init() 异步创建，轮询等待就绪后再绑定相机朝向
  timer = setInterval(() => {
    const v = app.viewer
    if (v) {
      clearInterval(timer)
      timer = null
      removePostRender = v.scene.postRender.addEventListener(() => {
        deg.value = Cesium.Math.toDegrees(v.camera.heading)
      })
    }
  }, 300)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (removePostRender) removePostRender()
})

// 点击回正北：保持当前位置与俯仰，仅把 heading 归零
function resetNorth() {
  const v = app.viewer
  if (!v) return
  const cam = v.camera
  const dest = Cesium.Cartesian3.clone(cam.positionWC, new Cesium.Cartesian3())
  cam.flyTo({
    destination: dest,
    orientation: { heading: 0, pitch: cam.pitch, roll: 0 },
    duration: 0.6,
  })
}
</script>

<style scoped>
.compass {
  position: absolute; top: 14px; right: 14px; z-index: 20;
  width: 92px; height: 92px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 45%, rgba(6, 30, 50, 0.86), rgba(2, 12, 22, 0.72));
  border: 1px solid rgba(1, 148, 218, 0.55);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.55), inset 0 0 12px rgba(1, 148, 218, 0.18);
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
}
.compass:hover { border-color: #0ad1f7; }

.dial { position: absolute; inset: 0; width: 100%; height: 100%; }
.ring { fill: none; stroke: rgba(1, 148, 218, 0.45); stroke-width: 1; }
.ring.inner { stroke: rgba(1, 148, 218, 0.22); }
.tick { stroke: rgba(207, 227, 245, 0.45); stroke-width: 0.8; }
.tick.major { stroke: #0ad1f7; stroke-width: 1.6; }

.label {
  fill: #cfe3f5; font-size: 13px; font-weight: 700;
  text-anchor: middle; dominant-baseline: middle;
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
}
.label.north { fill: #ff5252; font-size: 15px; }

/* 顶部固定指针：倒三角指向盘面，读当前朝向 */
.marker {
  position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 11px solid #0ad1f7;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.7));
}
.hub {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 6px; height: 6px; border-radius: 50%;
  background: #0ad1f7; box-shadow: 0 0 6px rgba(10, 209, 247, 0.8);
}

@media (max-width: 768px) {
  .compass { width: 64px; height: 64px; top: 10px; right: 10px; }
  .label { font-size: 12px; }
  .label.north { font-size: 14px; }
}
</style>
