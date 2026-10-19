<template>
  <!-- 复用 ordos 设备信息框结构：.modal-dialog(蓝色光晕) > .modal-content > .modal-header/.modal-body/.modal-footer1
       样式来自 public/css/default.css；此处仅用 .info-win 控制跟随定位。 -->
  <div class="info-win info-modal" :style="{ left: clampX + 'px', top: clampY + 'px' }">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header clearfix">
          <div class="equipName modal-info-eq">{{ f.name }}</div>
          <button type="button" class="close" @click="close">×</button>
        </div>

        <div v-if="!editing" class="modal-body info scroll">
          <div v-for="(row, i) in rows" :key="i" class="input-group">
            <span class="modal-label1">{{ row[0] }}<span>：</span></span>
            <span class="modal-info">{{ row[1] }}</span>
          </div>
          <div class="modal-footer1 centered info">
            <button type="button" class="btn" @click="startEdit">编辑</button>
            <button type="button" class="btn" @click="locate">定位</button>
            <button type="button" class="btn" @click="del">删除</button>
          </div>
        </div>

        <div v-else class="modal-body edit scroll">
          <div class="input-group">
            <span class="modal-label1">名称<span>：</span></span>
            <input v-model="draft.name" type="text" />
          </div>
          <div class="input-row">
            <div class="input-group">
              <span class="modal-label1">东向 e(m)<span>：</span></span>
              <input v-model.number="draft.e" type="text" class="shorter" />
            </div>
            <div class="input-group">
              <span class="modal-label1">北向 n(m)<span>：</span></span>
              <input v-model.number="draft.n" type="text" class="shorter" />
            </div>
          </div>
          <div class="input-row">
            <div class="input-group">
              <span class="modal-label1">高度 h(m)<span>：</span></span>
              <input v-model.number="draft.h" type="text" class="shorter" />
            </div>
            <div class="input-group">
              <span class="modal-label1">状态<span>：</span></span>
              <span class="select">
                <select v-model="draft.status">
                  <option>正常</option><option>异常</option><option>停机</option><option>离线</option>
                </select>
              </span>
            </div>
          </div>
          <div v-if="f.value !== undefined" class="input-group">
            <span class="modal-label1">读数<span>：</span></span>
            <input v-model.number="draft.value" type="text" class="shorter" />
          </div>
          <div class="modal-footer1 centered edit">
            <button type="button" class="btn btn-primary" @click="save">保存</button>
            <button type="button" class="btn" @click="editing = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { store, updateFeature, removeFeature, closeInfo } from '../store.js'
import { TYPE_DEFS } from '../data/seed.js'
import { app } from '../cesium/cesiumApp.js'

const f = computed(() => store.infoWindow.feature)
const editing = ref(false)
const draft = reactive({})
const typeLabel = computed(() => (f.value ? (TYPE_DEFS[f.value.type] || {}).label : ''))
const fmt = v => (typeof v === 'number' ? v.toFixed(1) : v)

const rows = computed(() => {
  const x = f.value
  if (!x) return []
  const r = [['类型', typeLabel.value], ['坐标(本地)', `${fmt(x.e)}, ${fmt(x.n)}, ${fmt(x.h)} m`]]
  if (x.status) r.push(['状态', x.status])
  if (x.gas) r.push(['气体', `${x.gas}（${x.kind}）`])
  if (x.value !== undefined) r.push(['读数', `${x.value} ${x.unit || ''}`])
  if (x.threshold) r.push(['阈值', `${x.threshold} ${x.unit || ''}`])
  if (x.dept) r.push(['部门', x.dept])
  if (x.role) r.push(['岗位', x.role])
  if (x.areaType) r.push(['区域', x.areaType])
  if (x.open !== undefined) r.push(['门禁', x.open ? '开启' : '关闭'])
  if (x.flow) r.push(['管线', x.flow])
  if (x.items) r.push(['物资', x.items.map(i => `${i[0]}×${i[1]}`).join('，')])
  if (x.message) r.push(['说明', x.message])
  return r
})

watch(() => store.infoWindow.editing, (v) => {
  editing.value = v
  if (v) Object.assign(draft, JSON.parse(JSON.stringify(f.value)))
})
watch(() => store.infoWindow.feature && store.infoWindow.feature.id, () => {
  editing.value = store.infoWindow.editing
  if (store.infoWindow.editing) Object.assign(draft, JSON.parse(JSON.stringify(f.value)))
})

function startEdit() { Object.assign(draft, JSON.parse(JSON.stringify(f.value))); editing.value = true }
function save() { updateFeature(f.value.id, JSON.parse(JSON.stringify(draft))); editing.value = false }
function del() { removeFeature(f.value.id) }
function locate() { app.flyToFeature(f.value) }
function close() { closeInfo() }

const clampX = computed(() => {
  const x = store.infoWindow.screenX || 0
  return Math.min(Math.max(x, 220), window.innerWidth - 240)
})
const clampY = computed(() => {
  const y = store.infoWindow.screenY || 0
  return Math.max(y - 260, 66)
})
</script>

<style scoped>
/* 跟随定位：默认居中于要素上方；ordos 视觉(光晕/蓝框/按钮)由 default.css 提供 */
.info-win {
  position: absolute; z-index: 99999999; width: 420px;
  transform: translateX(-50%); pointer-events: auto;
}
/* default.css 的 .modal-body.info min-width:400 / .input-group input 宽 320 需按本弹窗收敛 */
.info-win :deep(.modal-body) { min-width: 0 !important; max-height: 300px; }
.info-win :deep(.modal-content) { background: rgba(6, 14, 26, 0.96); }
.info-win :deep(.input-group input[type=text]) { width: 180px; }
.info-win :deep(.input-group .select) { width: 180px; }
.info-win :deep(.input-group .select select) { width: 100%; height: 35px; }
</style>
