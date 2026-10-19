<template>
  <!-- 与 ordos index.html 的图层面板结构一致，样式由 public/css/nav.css 提供 -->
  <aside id="showLayersPanel" class="asideNav">
    <nav>
      <div id="show-layers" class="aside-head">
        <span id="sl-name">预警监控图层</span>
        <span class="head-arrow right"><i class="double-arr black dropdown-arrow"></i></span>
      </div>
      <div id="layers-categ" class="dropdown scroll">
        <ul id="layers-categ-ul">
          <li v-for="group in groups" :key="group">
            <div class="categ-header">
              <i
                class="check-box"
                :class="store.groupVisible[group] ? 'act' : 'iact'"
                @click="toggle(group)"
              ></i>
              <span class="ct-name">{{ group }}</span>
              <span class="li-arrow right"><i class="double-arr blue dropdown-arrow"></i></span>
            </div>
            <ul class="layers-lev2">
              <li v-for="t in typesOf(group)" :key="t.type">
                <i
                  class="check-box"
                  :class="store.groupVisible[group] ? 'act' : 'iact'"
                  @click="toggle(group)"
                ></i>
                <span class="ct-name">{{ t.def.label }}</span>
                <span class="lv2-count">({{ countOf(t.type) }})</span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>

    <!-- 底图切换：在线卫星影像 / 离线底图 -->
    <div class="add-block">
      <div class="add-title">底图</div>
      <div class="basemap-row">
        <button
          class="mapbtn"
          :class="{ act: store.baseMap === 'satellite' }"
          title="在线卫星影像（需联网）"
          @click="setBaseMap('satellite')"
        >卫星影像</button>
        <button
          class="mapbtn"
          :class="{ act: store.baseMap === 'offline' }"
          title="离线底图（不依赖网络）"
          @click="setBaseMap('offline')"
        >离线底图</button>
      </div>
    </div>

    <!-- 新增要素（原 TopBar 的添加按钮移入图层面板底部，保持 ordos 无顶栏的布局） -->
    <div class="add-block">
      <div class="add-title">新增要素</div>
      <div class="add-list scroll">
        <button
          v-for="(def, type) in TYPE_DEFS"
          :key="type"
          class="addbtn"
          :title="`添加${def.label}`"
          @click="emit('add', type)"
        >
          <span class="aicon" :style="{ backgroundImage: `url(${IMG}${def.icon || 'icon_default.png'})` }"></span>
          <span class="alabel">{{ def.label }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { store, toggleGroup, setBaseMap } from '../store.js'
import { TYPE_DEFS, GROUP_ORDER } from '../data/seed.js'

const emit = defineEmits(['add'])
const IMG = import.meta.env.BASE_URL + 'data/img/'

const groups = GROUP_ORDER

const byGroup = computed(() => {
  const m = {}
  for (const [type, def] of Object.entries(TYPE_DEFS)) {
    ;(m[def.group] ||= []).push({ type, def })
  }
  return m
})

function typesOf(group) { return byGroup.value[group] || [] }
function countOf(type) { return store.features.filter(f => f.type === type).length }
function toggle(group) { toggleGroup(group) }
</script>

<style scoped>
.lv2-count { margin-left: 4px; color: #0ad1f7; font-size: 16px; }

.add-block { margin-top: 8px; padding: 8px 10px 12px; background: rgba(0, 0, 0, 0.7); border-top: 1px solid #0194da; }
.add-title { font-size: 16px; color: #0ad1f7; margin-bottom: 6px; }
.add-list { display: flex; flex-wrap: wrap; gap: 4px; max-height: 96px; overflow-y: auto; }
.addbtn { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 56px; padding: 4px 6px; background: transparent; border: 1px solid transparent; border-radius: 4px; color: #cfe3f5; }
.addbtn:hover { background: rgba(1, 148, 218, 0.25); border-color: #0194da; color: #fff; }
.aicon { width: 22px; height: 22px; background-size: contain; background-repeat: no-repeat; background-position: center; }
.alabel { font-size: 11px; white-space: nowrap; }
.basemap-row { display: flex; gap: 6px; }
.mapbtn { flex: 1; padding: 4px 6px; font-size: 12px; color: #cfe3f5; background: transparent; border: 1px solid rgba(1, 148, 218, 0.5); border-radius: 4px; }
.mapbtn:hover { background: rgba(1, 148, 218, 0.25); color: #fff; }
.mapbtn.act { background: #0194da; border-color: #0ad1f7; color: #fff; }
</style>

<style>
/* nav.css 的 .asideNav/#layers-categ 为固定定位与 830px 高，适配本页头部(50px)/底部(145px)做收敛，
   视觉（配色/复选框/箭头/字号）保持 ordos 原样。 */
#showLayersPanel { top: 10px; left: 10px; width: 300px; bottom: 155px; }
#layers-categ { height: auto; max-height: 100%; }
@media (max-width: 768px) {
  #showLayersPanel { width: 240px; bottom: 130px; }
}
</style>
