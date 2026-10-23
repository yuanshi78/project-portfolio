<template>
  <!-- 复用 ordos 设备信息框结构：.modal-dialog(蓝色光晕) > .modal-content > .modal-header/.modal-body/.modal-footer1
       样式来自 public/css/default.css；此处仅用 .info-win 控制跟随定位与排版收敛。 -->
  <div class="info-win info-modal" :style="{ left: clampX + 'px', top: clampY + 'px', '--type': typeColor }">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header clearfix">
          <div class="equipName modal-info-eq">
            <span class="type-dot" :style="{ background: typeColor, boxShadow: `0 0 6px ${typeColor}` }"></span>{{ f.name }}
          </div>
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
const typeColor = computed(() => (f.value ? (TYPE_DEFS[f.value.type] || {}).color : '#34d399'))
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
/* 跟随定位：默认居中于要素上方。ordos 基础视觉来自 default.css，
   下面 :deep() 仅针对本弹窗做精致化卡片改造，不影响其它共用 default.css 的弹窗。
   类型色通过根元素 CSS 变量 --type 注入，统一标题/边框/按钮/光晕的氛围色。 */
.info-win {
  position: absolute; z-index: 99999999; width: 420px;
  transform: translateX(-50%); pointer-events: auto;
}
.info-win :deep(.modal-body) { min-width: 0 !important; max-height: 300px; }
.info-win :deep(.input-group input[type=text]) { width: 180px; }
.info-win :deep(.input-group .select) { width: 180px; }
.info-win :deep(.input-group .select select) { width: 100%; height: 35px; }

/* —— 卡片容器：圆角 + 类型色描边/光晕 + 渐变底色，取代默认方框蓝晕 —— */
.info-win :deep(.modal-dialog) {
  padding: 0; background: transparent; border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55),
              0 0 22px color-mix(in srgb, var(--type) 38%, transparent);
  animation: infoIn 0.22s ease-out;
}
@keyframes infoIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}
.info-win :deep(.modal-content) {
  background: linear-gradient(180deg, rgba(12, 24, 44, 0.98), rgba(4, 10, 20, 0.97));
  border: 1px solid color-mix(in srgb, var(--type) 45%, rgba(255, 255, 255, 0.07));
  border-radius: 14px; overflow: hidden;
}

/* —— 标题栏：类型色渐变底纹 + 类型色圆点 + 左对齐标题，关闭按钮与标题同轴 —— */
.info-win :deep(.modal-header) {
  display: flex; align-items: center; gap: 8px; margin: 0;
  padding: 12px 14px !important; border-radius: 14px 14px 0 0;
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--type) 22%, transparent), transparent);
  border-bottom: 1px solid
    color-mix(in srgb, var(--type) 40%, rgba(255, 255, 255, 0.06)) !important;
}
.info-win :deep(.equipName) {
  flex: 1; text-align: left; font-size: 16px; font-weight: 600;
  letter-spacing: 0.5px; color: #eaf4ff;
  display: flex; align-items: center; gap: 8px;
}
.type-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--type); box-shadow: 0 0 8px var(--type); flex: 0 0 auto;
}
.info-win :deep(.modal-header .close) {
  float: none; width: 24px; height: 24px; line-height: 22px;
  font-size: 16px; margin-left: 8px; flex: 0 0 auto;
  color: #cfe6ff !important; border: 1px solid rgba(255, 255, 255, 0.25) !important;
  background: rgba(255, 255, 255, 0.05); border-radius: 50%;
  opacity: 0.9; transition: all 0.15s;
}
.info-win :deep(.modal-header .close:hover) {
  opacity: 1; color: #fff !important; background: rgba(255, 255, 255, 0.18);
  transform: rotate(90deg);
}

/* —— 信息行：label 左 / 值右对齐铺满整行，悬停高亮 + 细分隔线 —— */
.info-win :deep(.modal-body.info) { padding: 10px 14px !important; }
.info-win :deep(.modal-body.info .input-group) {
  display: flex; align-items: baseline; gap: 12px;
  padding: 9px 8px; border-radius: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.15s;
}
.info-win :deep(.modal-body.info .input-group:hover) { background: rgba(255, 255, 255, 0.04); }
.info-win :deep(.modal-body.info .input-group:last-of-type) { border-bottom: none; }
.info-win :deep(.modal-body.info .modal-label1) {
  display: block; flex: 0 0 auto; margin: 0;
  font-size: 13px; letter-spacing: 0.5px; color: #7fa8c9;
}
.info-win :deep(.modal-body.info .modal-info) {
  flex: 1; text-align: right; max-width: none;
  font-size: 14px; color: #eaf4ff;
  font-variant-numeric: tabular-nums; word-break: break-all;
}

/* —— 按钮区：三枚等宽胶囊按钮；定位(主操作)用类型色填充，删除用红色危险色 —— */
.info-win :deep(.modal-footer1.centered.info) {
  display: flex; gap: 8px; margin: 4px 0 0;
  padding: 12px 14px 14px;
  border-top: 1px solid
    color-mix(in srgb, var(--type) 30%, rgba(255, 255, 255, 0.06));
}
.info-win :deep(.modal-footer1.centered.info .btn) {
  flex: 1; padding: 8px 0; font-size: 13px; font-weight: 600;
  line-height: 1.2; letter-spacing: 2px; border-radius: 8px; cursor: pointer;
  color: #d6ecff; border: 1px solid rgba(120, 180, 230, 0.4);
  background: rgba(120, 180, 230, 0.12); transition: all 0.15s;
}
.info-win :deep(.modal-footer1.centered.info .btn:hover) {
  background: rgba(120, 180, 230, 0.28); color: #fff;
  transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.info-win :deep(.modal-footer1.centered.info .btn:nth-child(2)) {
  color: #fff; border-color: var(--type);
  background: color-mix(in srgb, var(--type) 32%, transparent);
}
.info-win :deep(.modal-footer1.centered.info .btn:nth-child(2):hover) {
  background: color-mix(in srgb, var(--type) 55%, transparent);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--type) 40%, transparent);
}
.info-win :deep(.modal-footer1.centered.info .btn:last-child) {
  color: #ff9b9b; border-color: rgba(255, 107, 107, 0.6);
  background: rgba(255, 107, 107, 0.12);
}
.info-win :deep(.modal-footer1.centered.info .btn:last-child:hover) {
  color: #fff; background: rgba(255, 107, 107, 0.38);
  box-shadow: 0 4px 12px rgba(255, 80, 80, 0.32);
}
</style>
