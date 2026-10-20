import { reactive, watch } from 'vue';
import { GROUP_ORDER, seedDrills, seedFeatures, TYPE_DEFS } from './data/seed.js';

const STORAGE_KEY = 'chemical-plant-demo-v2' // v2: 要素坐标收缩进模型占地（旧缓存坐标在模型外）

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data.features || !data.drills) return null
    return data
  } catch (e) {
    return null
  }
}

function initialData() {
  return { features: seedFeatures(), drills: seedDrills() }
}

const persisted = loadFromStorage()
const data = persisted || initialData()

export const store = reactive({
  features: data.features,
  drills: data.drills,
  selectedId: null,
  // 图层分组可见性
  groupVisible: Object.fromEntries(GROUP_ORDER.map((g) => [g, true])),
  // UI 状态
  infoWindow: { open: false, feature: null, screenX: 0, screenY:0, editing: false },
  toasts: [],
  // 底图：satellite=在线卫星影像，offline=离线 Natural Earth II
  // 默认用离线底图（不依赖外网，也不会有卫星图）
  baseMap: 'offline',
  // Start with the map visible; searchKeyword is shared with the top search box.
  ui: { activeTab: 'search', searchKeyword: '' },
})

let toastSeq = 1
export function pushToast(message, type = 'info', timeout = 2600) {
  const id = toastSeq++
  store.toasts.push({ id, message, type })
  setTimeout(() => {
    const i = store.toasts.findIndex((t) => t.id === id)
    if (i >= 0) store.toasts.splice(i, 1)
  }, timeout)
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ features: store.features, drills: store.drills }))
  } catch (e) {
    pushToast('保存失败：' + e.message, 'error')
  }
}

// 任意修改后自动持久化
watch(() => [store.features, store.drills], () => save(), { deep: true })

// --------------------------- 要素 CRUD ---------------------------------------
export function addFeature(feature) {
  store.features.push(feature)
  pushToast(`已新增：${feature.name}`, 'success')
}

export function updateFeature(id, patch) {
  const idx = store.features.findIndex((x) => x.id === id)
  if (idx >= 0) {
    Object.assign(store.features[idx], patch)
    pushToast('已保存修改', 'success')
  }
}

export function removeFeature(id) {
  const idx = store.features.findIndex((x) => x.id === id)
  if (idx >= 0) {
    const name = store.features[idx].name
    store.features.splice(idx, 1)
    if (store.selectedId === id) closeInfo()
    pushToast(`已删除：${name}`, 'warn')
  }
}

export function getFeature(id) {
  return store.features.find((x) => x.id === id)
}

// --------------------------- 报警 ---------------------------------------------
export function simulateAlarm(sourceId = null) {
  const candidates = store.features.filter((x) => ['gas', 'device', 'fire', 'env'].includes(x.type))
  const src = sourceId ? store.features.find((x) => x.id === sourceId) : candidates[Math.floor(Math.random() * candidates.length)]
  if (!src) {
    pushToast('暂无可生成报警的监测点', 'warn')
    return null
  }
  const id = `alarm-${Date.now()}`
  const level = Math.random() > 0.5 ? '高' : '中'
  const feature = {
    id, type: 'alarm', name: `${src.name} 报警`, e: src.e, n: src.n, h: (src.h || 2) + 1,
    level, message: `${src.name} 检测到异常（示例数据），请核查。`, status: 'active',
    time: new Date().toISOString(), sourceId: src.id,
  }
  store.features.push(feature)
  pushToast(`模拟报警已生成：${feature.name}`, 'error')
  return feature
}

export function respondAlarm(id) {
  const a = store.features.find((x) => x.id === id)
  if (a && a.status === 'active') {
    a.status = 'responding'
    pushToast('已启动应急响应', 'info')
  }
}

export function clearAlarm(id) {
  const a = store.features.find((x) => x.id === id)
  if (a) {
    a.status = 'cleared'
    pushToast('报警已消警', 'success')
  }
}

// --------------------------- 演练 ---------------------------------------------
export function addDrill(drill) {
  store.drills.unshift({ id: `drill-${Date.now()}`, status: 'planned', ...drill })
  pushToast('演练记录已创建', 'success')
}

export function updateDrillStatus(id, status) {
  const d = store.drills.find((x) => x.id === id)
  if (d) {
    d.status = status
    pushToast('演练状态已更新', 'info')
  }
}

// --------------------------- 图层 ---------------------------------------------
export function toggleGroup(group) {
  store.groupVisible[group] = !store.groupVisible[group]
}

export function groupVisibleFor(type) {
  const def = TYPE_DEFS[type]
  return def ? store.groupVisible[def.group] : true
}

// --------------------------- 底图 ---------------------------------------------
export function setBaseMap(kind) {
  if (kind !== 'satellite' && kind !== 'offline') return
  store.baseMap = kind
}

// --------------------------- 选择 / 信息窗 ------------------------------------
export function selectFeature(feature, screenX, screenY, editing = false) {
  store.selectedId = feature.id
  store.infoWindow = { open: true, feature, screenX, screenY, editing }
}

export function closeInfo() {
  store.infoWindow.open = false
  store.infoWindow.editing = false
  store.selectedId = null
}

// --------------------------- 恢复初始 -----------------------------------------
export function resetData() {
  const fresh = initialData()
  store.features.splice(0, store.features.length, ...fresh.features)
  store.drills.splice(0, store.drills.length, ...fresh.drills)
  closeInfo()
  pushToast('已恢复初始演示数据', 'info')
}
