<template>
  <div class="app-root">
    <div id="cesiumContainer" class="map"></div>

    <LayerPanel />
    <Compass />
    <InfoWindow v-if="store.infoWindow.open" />
    <ToastHost />

    <div v-if="!ready" class="loading">
      <div class="brand">智慧化工园区 · 态势分析</div>
      <div class="spinner"></div>
      <div>正在加载 Cesium 与 3D Tiles 模型…</div>
      <div class="sub">SMART CHEMICAL PARK · SITUATION ANALYSIS</div>
    </div>

    <BottomBar @measure="onMeasure" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { app } from './cesium/cesiumApp.js'
import { store } from './store.js'
import Compass from './components/Compass.vue'
import LayerPanel from './components/LayerPanel.vue'
import InfoWindow from './components/InfoWindow.vue'
import ToastHost from './components/ToastHost.vue'
import BottomBar from './components/BottomBar.vue'

const ready = ref(false)

onMounted(async () => {
  await app.init('cesiumContainer')
  ready.value = true
  // 数据变化（增删改）后同步地图实体
  watch(() => store.features, () => app.syncFeatures(), { deep: true })
  // 图层显隐（一级分组 / 二级类型）变化后刷新地图实体可见性
  watch(() => [store.groupVisible, store.typeVisible], () => app.applyVisibility(), { deep: true })
})

function onMeasure(mode) {
  if (mode === null) app.clearMeasure()
  else app.startMeasure(mode)
}
</script>

<style scoped>
.app-root { position: absolute; inset: 0; }
.map { position: absolute; inset: 0; }

.loading {
  position: absolute; inset: 0; z-index: 50; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 18px;
  background:
    radial-gradient(800px 500px at 50% 40%, rgba(34, 211, 238, 0.12), transparent 60%),
    linear-gradient(180deg, #04101e, #03070f);
  color: var(--txt-1); font-size: 15px; letter-spacing: 1px;
}
.loading .brand {
  font-size: 22px; font-weight: 800; letter-spacing: 3px; color: #eaf6ff;
  text-shadow: 0 0 18px rgba(34, 211, 238, 0.6);
}
.loading .sub { font-size: 12px; color: var(--txt-2); letter-spacing: 2px; }
.spinner {
  width: 46px; height: 46px; border-radius: 50%;
  border: 3px solid rgba(34, 211, 238, 0.18); border-top-color: var(--accent);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.4);
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
