<template>
  <!-- 与 ordos index.html 的图层面板结构一致，样式由 public/css/nav.css 提供 -->
  <aside id="showLayersPanel" class="asideNav" ref="panelEl" :style="panelStyle" @mousedown="onPanelDown">
    <nav>
      <div id="show-layers" class="aside-head" @click="onHeaderClick">
        <span id="sl-name">预警监控图层</span>
        <span class="head-arrow right" :class="{ closed: headCollapsed }"><i class="double-arr black dropdown-arrow"></i></span>
      </div>
      <div id="layers-categ" class="dropdown scroll">
        <ul id="layers-categ-ul">
          <li v-for="group in groups" :key="group">
            <div class="categ-header" :class="{ closed: !openGroups[group] }">
              <i
                class="check-box"
                :class="groupCheckClasses(group)"
                @click="toggle(group)"
              ></i>
              <span class="ct-name">{{ group }}</span>
              <span class="li-arrow right" @click.stop="toggleGroupOpen(group)"><i class="double-arr blue dropdown-arrow"></i></span>
            </div>
            <ul class="layers-lev2" v-show="openGroups[group]">
              <li v-for="t in typesOf(group)" :key="t.type">
                <i
                  class="check-box"
                  :class="store.typeVisible[t.type] ? 'act' : 'iact'"
                  @click="toggleType(t.type)"
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

  </aside>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { store, toggleGroup, toggleType, groupCheckState, setBaseMap } from '../store.js'
import { TYPE_DEFS, GROUP_ORDER } from '../data/seed.js'

const groups = GROUP_ORDER

// —— 面板拖拽：按住面板任意处（除复选框/按钮等交互控件）拖动，松开保持位置；拖动时不误触发点击 ——
const panelEl = ref(null)
const pos = reactive({ x: 10, y: 10 })
const size = reactive({ w: 300, h: 0 })
const moved = ref(false)
const dragging = ref(false)
let didDrag = false
let startX = 0, startY = 0, ox = 0, oy = 0

function onPanelDown(e) {
  if (e.button !== 0) return
  // 交互控件（复选框 / 按钮 / 展开箭头 / 输入框）不触发拖拽，保留它们本身的点击行为
  if (e.target.closest('.check-box, button, .li-arrow, input, select, textarea')) return
  dragging.value = true
  didDrag = false
  const r = panelEl.value.getBoundingClientRect()
  ox = r.left; oy = r.top
  pos.x = ox; pos.y = oy
  size.w = r.width; size.h = r.height
  moved.value = true
  startX = e.clientX; startY = e.clientY
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  e.preventDefault()
}
function onMove(e) {
  if (!dragging.value) return
  // 始终基于拖拽起点(ox/oy)+总位移计算；不能用已被上一次移动改过的 pos，否则会逐帧累加导致面板飞出
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true
  let nx = ox + dx
  let ny = oy + dy
  nx = Math.max(0, Math.min(nx, window.innerWidth - size.w))
  ny = Math.max(0, Math.min(ny, window.innerHeight - 60))
  pos.x = nx; pos.y = ny
}
function onUp() {
  dragging.value = false
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
}
function onHeaderClick() {
  if (didDrag) { didDrag = false; return } // 拖拽结束的 click 不触发展开/收起
  toggleAll()
}
const panelStyle = computed(() => {
  if (!moved.value) return {}
  return {
    top: pos.y + 'px',
    left: pos.x + 'px',
    width: size.w + 'px',
    height: size.h + 'px',
    bottom: 'auto',
    cursor: dragging.value ? 'grabbing' : 'grab',
  }
})

// 各分类子项展开 / 折叠（与复选框的地图显隐相互独立）
const openGroups = reactive(Object.fromEntries(GROUP_ORDER.map((g) => [g, true])))

// 头部箭头：全展开时点一下=全部收起；否则（含部分展开）=全部展开
const headCollapsed = computed(() => !groups.every((g) => openGroups[g]))
function toggleAll() {
  const allOpen = groups.every((g) => openGroups[g])
  const target = !allOpen
  groups.forEach((g) => { openGroups[g] = target })
}
function toggleGroupOpen(group) { openGroups[group] = !openGroups[group] }

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

// 一级复选框：全选→act，部分→iact+indet（中间横线），全不→iact
function groupCheckClasses(group) {
  const s = groupCheckState(group)
  if (s === 'all') return ['act']
  if (s === 'some') return ['iact', 'indet']
  return ['iact']
}
</script>

<style scoped>
/* 头部箭头：一键展开/收起所有分类；全收起时箭头转向右(-90°) */
#show-layers { cursor: grab; user-select: none; }
/* 整个面板可拖：空白处 grab，交互控件仍保持 pointer；禁用选中避免拖拽时选到文字 */
#showLayersPanel { cursor: grab; user-select: none; }
#showLayersPanel .check-box,
#showLayersPanel button,
#showLayersPanel .li-arrow { cursor: pointer; }
#show-layers:hover { filter: brightness(1.12); }
.double-arr { transition: transform 0.2s ease; }
.head-arrow.closed .double-arr { transform: rotate(-90deg); }
.categ-header.closed .li-arrow .double-arr { transform: rotate(-90deg); }
.li-arrow { cursor: pointer; }
.categ-header.closed .li-arrow { opacity: 0.7; }

.lv2-count { margin-left: 4px; color: var(--accent); font-size: 15px; font-family: var(--mono); }

.add-block { margin-top: 8px; padding: 10px 10px 12px; background: rgba(8, 18, 32, 0.5); border-top: 1px solid rgba(34, 211, 238, 0.28); }
.add-title { font-size: 14px; color: var(--accent); margin-bottom: 8px; font-weight: 700; letter-spacing: 0.5px; }
.add-title::before { content: ""; display: inline-block; width: 3px; height: 12px; margin-right: 6px; border-radius: 2px; background: var(--accent); box-shadow: var(--glow); vertical-align: -1px; }
.basemap-row { display: flex; gap: 6px; }
.mapbtn {
  flex: 1; padding: 6px; font-size: 12px; color: var(--txt-1);
  background: rgba(8, 18, 32, 0.6); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 8px;
}
.mapbtn:hover { background: rgba(34, 211, 238, 0.14); color: #fff; }
.mapbtn.act { background: linear-gradient(180deg, #2ad4ef, #14a7c4); border-color: #2ad4ef; color: #03121a; font-weight: 700; box-shadow: var(--glow); }
</style>

<style>
/* nav.css 的 .asideNav/#layers-categ 为固定定位与 830px 高，适配本页头部(50px)/底部(145px)做收敛，
   视觉（配色/复选框/箭头/字号）保持 ordos 原样。 */
#showLayersPanel { top: 10px; left: 10px; width: 300px; bottom: 155px; display: flex; flex-direction: column; overflow: hidden; }
/* 面板纵向 flex：标题栏固定、树区占剩余空间并内部滚动；底图/新增要素区块沉底。
   nav.css 原样式只有 overflow-x、scrollbar 隐藏，且 max-height:100% 父级无高度约束 → 树从来没滚过。 */
#showLayersPanel > nav { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
#showLayersPanel > nav > #layers-categ {
  flex: 1 1 auto; min-height: 0;
  height: auto; max-height: none;
  overflow-y: auto; overflow-x: hidden;
  scrollbar-width: none;
}
/* 滚动条宽度 0（隐藏，但仍可滚动）：scrollbar-width 标准取值只有 auto/thin/none，
   故 none 负责 Firefox，::-webkit-scrollbar 宽度归零负责 Chromium/WebKit。 */
#layers-categ::-webkit-scrollbar { width: 0; height: 0; }

/* 复选框与选项名称之间留出间距 */
#layers-categ .check-box { margin-right: 8px; }
/* 一级复选框「部分选中」态：空框 + 中间横线 */
#layers-categ .check-box.indet { position: relative; }
#layers-categ .check-box.indet::after {
  content: ""; position: absolute; left: 4px; right: 4px; top: 9px;
  height: 2px; border-radius: 1px; background: var(--accent, #2ad4ef);
}
@media (max-width: 768px) {
  #showLayersPanel { width: 240px; bottom: 130px; }
}
</style>
