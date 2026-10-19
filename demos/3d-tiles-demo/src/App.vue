<template>
  <div class="app-root">
    <div id="cesiumContainer" class="map"></div>

    <SearchPanel />
    <LayerPanel @add="onAddType" />
    <RightPanel class="right-panel" />
    <Compass />
    <InfoWindow v-if="store.infoWindow.open" />
    <ToastHost />

    <div v-if="!ready" class="loading">
      <div class="spinner"></div>
      <div>正在加载 Cesium 与 3D Tiles 模型…</div>
    </div>

    <BottomBar @measure="onMeasure" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { app } from './cesium/cesiumApp.js'
import { store } from './store.js'
import SearchPanel from './components/SearchPanel.vue'
import Compass from './components/Compass.vue'
import LayerPanel from './components/LayerPanel.vue'
import RightPanel from './components/RightPanel.vue'
import InfoWindow from './components/InfoWindow.vue'
import ToastHost from './components/ToastHost.vue'
import BottomBar from './components/BottomBar.vue'

const ready = ref(false)

onMounted(async () => {
  await app.init('cesiumContainer')
  ready.value = true
  // 数据变化（增删改）后同步地图实体
  watch(() => store.features, () => app.syncFeatures(), { deep: true })
  watch(() => store.groupVisible, () => app.applyVisibility(), { deep: true })
})

function onAddType(type) {
  app.setAddMode(type)
}

function onMeasure(mode) {
  if (mode === null) app.clearMeasure()
  else app.startMeasure(mode)
}
</script>

<style scoped>
.app-root { position: absolute; inset: 0; }
.map { position: absolute; inset: 0; }

/* 右侧面板：顶部让出 50px 头部、底部让出 145px ordos 底部菜单 */
.right-panel {
  position: absolute; top: 10px; right: 10px; bottom: 155px;
  width: 344px; z-index: 12; display: flex; flex-direction: column;
}

.loading {
  position: absolute; inset: 0; z-index: 50; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px;
  background: #000; color: #a9bcd2; font-size: 15px;
}
.spinner {
  width: 34px; height: 34px; border-radius: 50%;
  border: 3px solid #1f3a5c; border-top-color: #ffbb01;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .right-panel { top: 8px; right: 8px; left: 8px; width: auto; height: min(190px, 30vh); bottom: auto; }
}
</style>
