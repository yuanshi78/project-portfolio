<template>
  <!-- 结构/类名与 ordos index.html 的底部菜单一致（8 项），样式完全由 public/css/nav.css 提供 -->
  <footer id="page-footer">
    <nav id="menu">
      <div id="menu-bg"></div>
      <ul id="menu-ul">
        <li id="all-control">
          <a href="javascript:void(0)" @click.prevent="overview">
            <div class="menu-btn" :class="{ active: flash === 'overview' }"></div>
            <p class="footer_name whiteColor">全厂总览</p>
          </a>
        </li>
        <li id="refresh-btn">
          <a href="javascript:void(0)" @click.prevent="restore">
            <div class="menu-btn" :class="{ active: flash === 'refresh' }"></div>
            <p class="footer_name whiteColor">页面刷新</p>
          </a>
        </li>
        <li id="measure">
          <a href="javascript:void(0)" @click.prevent="measureOpen = !measureOpen">
            <div class="menu-btn" :class="{ active: measureOn }"></div>
            <p class="footer_name whiteColor">测量</p>
          </a>
          <div v-if="measureOpen" class="measure-pop">
            <button class="btn" :class="{ active: activeMeasure === 'distance' }" @click="setMeasure('distance')">测距</button>
            <button class="btn" :class="{ active: activeMeasure === 'area' }" @click="setMeasure('area')">测面</button>
            <button class="btn" @click="setMeasure(null)">清除</button>
          </div>
        </li>
        <li id="draw-route">
          <a href="javascript:void(0)" @click.prevent="toggleRoute">
            <div class="menu-btn" :class="{ active: store.ui.drawRoute }"></div>
            <p class="footer_name whiteColor">{{ store.ui.drawRoute ? '完成' : '画路线' }}</p>
          </a>
        </li>
        <li id="manual-alarm">
          <a href="javascript:void(0)" @click.prevent="alarm">
            <div class="menu-btn" :class="{ active: flash === 'alarm' }"></div>
            <p class="footer_name whiteColor">人工接警</p>
          </a>
        </li>
        <li id="accident1">
          <a href="javascript:void(0)" @click.prevent="duty">
            <div class="menu-btn" :class="{ active: store.ui.activeTab === 'person' }"></div>
            <p class="footer_name whiteColor">值班人员</p>
          </a>
        </li>
        <li id="fire-truck">
          <a href="javascript:void(0)" @click.prevent="toggleFire">
            <div class="menu-btn" :class="{ active: flash === 'fire' }"></div>
            <p class="footer_name whiteColor">消防管线/栓炮</p>
          </a>
        </li>
        <li id="cameras">
          <a href="javascript:void(0)" @click.prevent="switchTab('video')">
            <div class="menu-btn" :class="{ active: store.ui.activeTab === 'video' }"></div>
            <p class="footer_name whiteColor">视频监控</p>
          </a>
        </li>
        <li id="position">
          <a href="javascript:void(0)" @click.prevent="locatePerson">
            <div class="menu-btn" :class="{ active: flash === 'position' }"></div>
            <p class="footer_name whiteColor">人员定位</p>
          </a>
        </li>
      </ul>
    </nav>
  </footer>
</template>

<script setup>
import { computed, ref } from 'vue'
import { app } from '../cesium/cesiumApp.js'
import { store, resetData, simulateAlarm, toggleGroup, pushToast } from '../store.js'

const emit = defineEmits(['measure'])

const flash = ref('')
const measureOpen = ref(false)
const activeMeasure = ref('none')
const measureOn = computed(() => activeMeasure.value !== 'none')

function bump(k) {
  flash.value = k
  setTimeout(() => { if (flash.value === k) flash.value = '' }, 450)
}
function overview() { app.resetView(); bump('overview') }
function restore() {
  if (confirm('确定恢复初始演示数据？本地新增/修改/删除将清空。')) {
    resetData()
    app.clearMeasure()
    app.clearTrail && app.clearTrail()
    app.clearRoute && app.clearRoute()
    app.resetView()
  }
  bump('refresh')
}
function alarm() { simulateAlarm(); bump('alarm') }
function duty() { store.ui.activeTab = 'person' }
function toggleFire() {
  toggleGroup('消防')
  pushToast(store.groupVisible['消防'] ? '消防图层已显示' : '消防图层已隐藏')
  bump('fire')
}
function switchTab(k) { store.ui.activeTab = store.ui.activeTab === k ? 'search' : k }
function locatePerson() {
  const p = store.features.find(f => f.type === 'person')
  if (p) { app.flyToFeature(p); pushToast(`已定位：${p.name}`) }
  else pushToast('未找到人员要素')
  bump('position')
}
function setMeasure(mode) {
  activeMeasure.value = mode === null ? 'none' : mode
  emit('measure', mode)
  if (mode === null) measureOpen.value = false
}
function toggleRoute() {
  // 绘制中点按钮 = 完成当前路线（提交并打印，保留在屏幕上）；未绘制时 = 开始画路线
  if (store.ui.drawRoute) app.stopRoute()
  else app.startRoute()
}
</script>

<style scoped>
/* nav.css 已定义 #page-footer/#menu/#menu-ul/.menu-btn/.footer_name 及各类图标背景；
   此处仅补充测量弹出菜单与窄屏适配。 */
.measure-pop {
  position: absolute; bottom: 92px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; gap: 6px; padding: 8px; z-index: 50;
  background: rgba(0, 0, 0, 0.85); border: 1px solid #0194da; border-radius: 6px;
}
.measure-pop .btn { width: 84px; }
.measure-pop .btn.active { background: #0194da; color: #fff; border-color: #0194da; }
</style>

<style>
/* 完全交给 ordos 的 nav.css 控制菜单宽度/布局（桌面端与 ordos 一致）。
   窄屏时 ordos 的 #menu min-width:900px 会横向溢出，故做必要收敛。 */
@media (max-width: 960px) {
  #page-footer { height: 120px; }
  #menu { width: 100%; min-width: 0; }
  #menu-ul { justify-content: space-around; }
  .menu-btn { width: 60px; height: 60px; }
  #menu-ul > li p { font-size: 15px; margin-top: 8px; }
}
</style>
