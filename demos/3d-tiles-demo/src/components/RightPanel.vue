<template>
  <div class="right-panel panel">
    <div class="tabs">
      <button
        v-for="t in tabs" :key="t.key" class="tab" :class="{ active: tab === t.key }"
        @click="switchTab(t.key)"
      >{{ t.label }}</button>
    </div>

    <div class="body scroll">
      <!-- 搜索 -->
      <div v-if="tab === 'search'" class="pad">
        <input v-model="query" placeholder="搜索名称 / 类型，如 储罐、摄像头…" />
        <div class="result" v-for="f in searchResults" :key="f.id" @click="locate(f)">
          <span class="dot" :style="{ background: colorOf(f.type) }"></span>
          <span class="rname">{{ f.name }}</span>
          <span class="rtag">{{ labelOf(f.type) }}</span>
        </div>
        <div v-if="query && searchResults.length === 0" class="empty">无匹配要素</div>
      </div>

      <!-- 监测 -->
      <div v-else-if="tab === 'monitor'" class="pad">
        <div class="note">以下为示例 / 模拟数据，非真实监测值。</div>
        <button class="btn warn small" @click="simulateRefresh">模拟刷新读数</button>
        <div class="sec">生产设备</div>
        <div v-for="f in byType('device')" :key="f.id" class="row">
          <span class="rname">{{ f.name }}</span>
          <span class="val">{{ f.value }} {{ f.unit }}</span>
          <span class="tag" :class="statusClass(f.status)">{{ f.status }}</span>
        </div>
        <div class="sec">气体监测</div>
        <div v-for="f in byType('gas')" :key="f.id" class="row">
          <span class="rname">{{ f.gas }}（{{ f.kind }}）</span>
          <span class="val" :class="{ danger: f.value > f.threshold }">{{ f.value }} {{ f.unit }} / 阈 {{ f.threshold }}</span>
        </div>
        <div class="sec">环境监测</div>
        <div v-for="f in byType('env')" :key="f.id" class="row">
          <span class="rname">{{ f.paramName }}</span>
          <span class="val">{{ f.value }} {{ f.unit }}</span>
        </div>
      </div>

      <!-- 报警 -->
      <div v-else-if="tab === 'alarm'" class="pad">
        <button class="btn danger small" @click="simulateAlarm">＋ 模拟报警</button>
        <div v-for="f in byType('alarm')" :key="f.id" class="card">
          <div class="c-head">
            <span :class="['tag', statusClass(f.status)]">{{ f.status === 'active' ? '活动' : f.status === 'responding' ? '处置中' : '已消警' }}</span>
            <span class="clevel">{{ f.level }}级</span>
          </div>
          <div class="c-name">{{ f.name }}</div>
          <div class="c-msg">{{ f.message }}</div>
          <div v-if="f.status === 'active'" class="c-actions">
            <button class="btn small" @click="respondAlarm(f.id)">应急响应</button>
            <button class="btn danger small" @click="clearAlarm(f.id)">消警</button>
          </div>
        </div>
        <div v-if="byType('alarm').length === 0" class="empty">暂无报警</div>
      </div>

      <!-- 演练 -->
      <div v-else-if="tab === 'drill'" class="pad">
        <button class="btn primary small" @click="showForm = !showForm">＋ 新建演练</button>
        <div v-if="showForm" class="form">
          <input v-model="form.name" placeholder="演练名称" />
          <input v-model="form.date" placeholder="日期 2026-08-01" />
          <textarea v-model="form.desc" rows="2" placeholder="演练说明"></textarea>
          <button class="btn primary small" @click="createDrill">保存</button>
        </div>
        <div v-for="d in store.drills" :key="d.id" class="card">
          <div class="c-head">
            <span class="c-name">{{ d.name }}</span>
            <span :class="['tag', drillClass(d.status)]">{{ drillText(d.status) }}</span>
          </div>
          <div class="c-msg">{{ d.date }} · {{ d.desc }}</div>
          <div class="c-actions">
            <button class="btn small" v-if="d.status !== 'planned'" @click="updateDrillStatus(d.id, 'planned')">计划</button>
            <button class="btn small" v-if="d.status !== 'ongoing'" @click="updateDrillStatus(d.id, 'ongoing')">进行中</button>
            <button class="btn small" v-if="d.status !== 'done'" @click="updateDrillStatus(d.id, 'done')">已完成</button>
          </div>
        </div>
      </div>

      <!-- 人员 -->
      <div v-else-if="tab === 'person'" class="pad">
        <div v-for="f in byType('person')" :key="f.id" class="row click" @click="selectPerson(f)">
          <span class="dot" :style="{ background: colorOf(f.type) }"></span>
          <span class="rname">{{ f.name }}</span>
          <span class="rtag">{{ f.dept }} · {{ f.role }}</span>
        </div>
        <div v-if="selectedPerson" class="trail-box">
          <div class="c-name">{{ selectedPerson.name }} · {{ selectedPerson.status }}</div>
          <div class="c-msg">{{ selectedPerson.dept }} / {{ selectedPerson.role }}</div>
          <div class="trail-ctrl">
            <button class="btn small" @click="playPause">{{ playing ? '⏸' : '▶' }}</button>
            <button class="btn small" @click="resetTrail">↺ 重置</button>
            <input type="range" min="0" :max="trailMax" v-model.number="progress" @input="seek" />
          </div>
        </div>
      </div>

      <!-- 物资 / 危险源 -->
      <div v-else-if="tab === 'material'" class="pad">
        <div class="sec">物资仓库</div>
        <div v-for="f in byType('warehouse')" :key="f.id" class="card">
          <div class="c-name">{{ f.name }}</div>
          <div class="items">
            <span v-for="it in f.items" :key="it[0]" class="tag">{{ it[0] }} ×{{ it[1] }}</span>
          </div>
        </div>
        <div class="sec">标识区域 / 危险源</div>
        <div v-for="f in byType('area')" :key="f.id" class="row">
          <span class="dot" :style="{ background: colorOf(f.type) }"></span>
          <span class="rname">{{ f.name }}</span>
          <span class="rtag">危险源标识</span>
        </div>
      </div>

      <!-- 视频 -->
      <div v-else-if="tab === 'video'" class="pad">
        <div class="note">本地演示状态：未接入实时视频服务（无真实视频流地址）。</div>
        <div v-for="f in byType('camera')" :key="f.id" class="card video">
          <div class="c-head"><span class="c-name">{{ f.name }}</span><span class="tag ok">离线演示</span></div>
          <div class="video-ph">📷 视频画面占位（演示）</div>
          <button class="btn small" @click="locate(f)">定位</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { app } from '../cesium/cesiumApp.js'
import { store, simulateAlarm, respondAlarm, clearAlarm, addDrill, updateDrillStatus, selectFeature } from '../store.js'
import { TYPE_DEFS } from '../data/seed.js'

const tabs = [
  { key: 'search', label: '搜索' },
  { key: 'monitor', label: '监测' },
  { key: 'alarm', label: '报警' },
  { key: 'drill', label: '演练' },
  { key: 'person', label: '人员' },
  { key: 'material', label: '物资' },
  { key: 'video', label: '视频' },
]
const tab = computed(() => store.ui.activeTab)
const query = ref('')
// 顶部搜索框（ordos #search-panel）输入的关键字同步到本页搜索
watch(() => store.ui.searchKeyword, (kw) => { if (kw) query.value = kw })

function switchTab(k) {
  if (k !== 'person') stopPlay()
  app.clearTrail?.()
  store.ui.activeTab = k
}

const colorOf = (t) => (TYPE_DEFS[t] || {}).color || '#fff'
const labelOf = (t) => (TYPE_DEFS[t] || {}).label || t
const byType = (t) => store.features.filter((f) => f.type === t)
const countOf = (t) => byType(t).length

const searchResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return store.features.filter((f) => {
    const label = labelOf(f.type)
    return f.name.toLowerCase().includes(q) || label.toLowerCase().includes(q)
  })
})

function locate(f) {
  app.flyToFeature(f)
  selectFeature(f)
}

function statusClass(s) {
  if (s === 'active' || s === '停机') return 'danger'
  if (s === 'responding' || s === 'ongoing' || s === 'planned') return 'warn'
  return 'ok'
}
function drillClass(s) { return s === 'done' ? 'ok' : s === 'ongoing' ? 'warn' : '' }
function drillText(s) { return s === 'done' ? '已完成' : s === 'ongoing' ? '进行中' : '计划中' }

// 监测 - 模拟刷新
function simulateRefresh() {
  for (const f of store.features) {
    if (['device', 'gas', 'env'].includes(f.type) && typeof f.value === 'number') {
      const delta = f.value * (Math.random() - 0.5) * 0.16
      f.value = +(f.value + delta).toFixed(f.value < 10 ? 2 : 1)
    }
  }
}

// 报警
function onSimulateAlarm() { simulateAlarm() }

// 演练
const showForm = ref(false)
const form = ref({ name: '', date: '', desc: '' })
function createDrill() {
  if (!form.value.name) return
  addDrill({ ...form.value })
  form.value = { name: '', date: '', desc: '' }
  showForm.value = false
}

// 人员轨迹
const selectedPerson = ref(null)
const playing = ref(false)
const progress = ref(0)
const trailMax = ref(0)
let timer = null

function selectPerson(f) {
  stopPlay()
  selectedPerson.value = f
  const n = app.startTrail(f) || 0
  trailMax.value = Math.max(0, n - 1)
  progress.value = 0
}

function playPause() {
  if (!selectedPerson.value) return
  if (playing.value) stopPlay()
  else {
    playing.value = true
    timer = setInterval(() => {
      if (progress.value >= trailMax.value) { progress.value = 0 }
      app.setTrailIndex(progress.value)
      progress.value++
    }, 420)
  }
}
function stopPlay() {
  playing.value = false
  if (timer) { clearInterval(timer); timer = null }
}
function resetTrail() {
  stopPlay()
  progress.value = 0
  app.setTrailIndex(0)
}
function seek() { app.setTrailIndex(progress.value) }

onBeforeUnmount(() => { stopPlay(); app.clearTrail?.() })
</script>

<style scoped>
.right-panel { overflow: hidden; }
.tabs {
  display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 8px 0;
  background: linear-gradient(180deg, rgba(14, 30, 50, 0.9), rgba(7, 16, 28, 0.6));
  border-bottom: 1px solid rgba(34, 211, 238, 0.3);
}
.tab {
  background: transparent; border: 1px solid transparent; border-bottom: none;
  color: var(--txt-1); padding: 6px 11px; font-size: 12.5px; border-radius: 8px 8px 0 0;
}
.tab:hover { color: #fff; }
.tab.active { color: #fff; background: rgba(34, 211, 238, 0.16); border-color: rgba(34, 211, 238, 0.4); }
.body { flex: 1; padding: 0; }
.pad { padding: 12px 14px; }

.note {
  font-size: 11px; color: var(--warn); margin-bottom: 10px;
  background: rgba(255, 180, 84, 0.08); border: 1px solid rgba(255, 180, 84, 0.25);
  padding: 7px 9px; border-radius: 6px;
}
.empty { color: var(--txt-2); font-size: 12px; padding: 10px 0; }
.sec { font-size: 13px; color: var(--accent); margin: 12px 0 6px; font-weight: 700; letter-spacing: 0.5px; }
.sec::before { content: ""; display: inline-block; width: 3px; height: 12px; margin-right: 6px; border-radius: 2px; background: var(--accent); box-shadow: var(--glow); vertical-align: -1px; }

.result, .row {
  display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 8px; font-size: 13px;
  border: 1px solid transparent; transition: all 0.12s;
}
.result:hover, .row.click:hover { background: rgba(34, 211, 238, 0.12); border-color: rgba(34, 211, 238, 0.3); cursor: pointer; }
.dot { width: 9px; height: 9px; border-radius: 50%; flex: none; box-shadow: 0 0 8px currentColor; }
.rname { flex: 1; color: var(--txt-0); }
.rtag { font-size: 11px; color: var(--txt-2); }
.val { font-size: 12px; color: var(--txt-1); font-family: var(--mono); font-variant-numeric: tabular-nums; }
.val.danger { color: var(--danger); font-weight: 600; text-shadow: 0 0 8px rgba(255, 93, 115, 0.5); }

.card {
  background: rgba(8, 18, 32, 0.66); border: 1px solid rgba(34, 211, 238, 0.22);
  border-left: 3px solid var(--accent); border-radius: 8px; padding: 9px 11px; margin-bottom: 9px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
}
.c-head { display: flex; align-items: center; justify-content: space-between; }
.c-name { font-size: 13px; font-weight: 600; }
.clevel { font-size: 11px; color: var(--warn); font-family: var(--mono); }
.c-msg { font-size: 12px; color: var(--txt-1); margin: 5px 0; }
.c-actions { display: flex; gap: 6px; margin-top: 7px; }
.items { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }

.form { display: flex; flex-direction: column; gap: 7px; margin: 8px 0; }
.btn.small { padding: 5px 9px; font-size: 12px; }
.btn.primary.small { background: linear-gradient(180deg, #2ad4ef, #14a7c4); color: #03121a; border-color: #2ad4ef; }

.video-ph {
  height: 100px; display: flex; align-items: center; justify-content: center;
  background: repeating-linear-gradient(45deg, #06101c, #06101c 10px, #0a1626 10px, #0a1626 20px);
  border: 1px dashed var(--line-2); border-radius: 8px; color: var(--txt-2); margin: 7px 0; font-size: 12px;
}

.trail-box { margin-top: 10px; background: rgba(8, 18, 32, 0.7); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 8px; padding: 9px 11px; }
.trail-ctrl { display: flex; align-items: center; gap: 8px; margin-top: 9px; }
.trail-ctrl input[type='range'] { flex: 1; accent-color: var(--accent); }

@media (max-width: 768px) {
  .pad { padding: 10px; }
  .tab { padding: 5px 8px; font-size: 11.5px; }
}
</style>
