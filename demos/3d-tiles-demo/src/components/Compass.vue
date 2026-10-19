<template>
  <!-- 复用 ordos data/img/WindDirection.png 指南针，随 Cesium 相机朝向旋转（右上角） -->
  <div class="compass" :style="{ transform: `rotate(${-deg}deg)` }">
    <img :src="IMG" alt="指南针" draggable="false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as Cesium from 'cesium'
import { app } from '../cesium/cesiumApp.js'

const IMG = import.meta.env.BASE_URL + 'data/img/WindDirection.png'
const deg = ref(0)
let removePostRender = null
let timer = null

onMounted(() => {
  // viewer 由 app.init() 异步创建，此处轮询等待就绪后再绑定相机朝向
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
</script>

<style scoped>
.compass {
  position: absolute; top: 14px; right: 14px; z-index: 20;
  width: 100px; height: 100px; pointer-events: none;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.6));
}
.compass img { width: 100%; height: 100%; display: block; }
@media (max-width: 768px) {
  .compass { width: 64px; height: 64px; top: 10px; right: 10px; }
}
</style>
