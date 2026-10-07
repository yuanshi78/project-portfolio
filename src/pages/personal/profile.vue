<script setup>
import { computed, ref } from 'vue'
import { parseEmphasis } from '@/utils/emphasis'
import { visibleItems } from '@/utils/visibility'
import { getYears, getExpYears } from '@/utils/years'
import { useDisplay } from 'vuetify'

const { smAndDown } = useDisplay()

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  // 生日配置在 personal.json 顶层；仅用于自动算年龄，不在页面展示
  birthday: {
    type: String,
    default: '',
  },
})

// {years} 来华年数、{exp} 工龄，均来自 @/utils/years 全局配置

// 由生日自动计算周岁年龄（含月/日判断），生日本身不展示
const getAge = () => {
  if (!props.birthday) return ''
  const b = new Date(props.birthday)
  if (Number.isNaN(b.getTime())) return ''

  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--

  return age
}

// 解析文本：先替换占位符（{years}/{age}），再把 **强调** 拆成片段渲染
// 用法：在 JSON 的 text 中用 **文字** 包裹需要强调的部分
const renderSegments = text => {
  if (!text) return []

  return parseEmphasis(
    text
      .replace('{years}', getYears())
      .replace('{exp}', getExpYears())
      .replace('{age}', getAge()),
  )
}

// 👉 页内子标签（不增路由）：概览 / 专业技能 / 自我评价 / 职业想法
const tabs = [
  { key: 'overview', label: '概览', icon: 'ri-user-line' },
  { key: 'skills', label: '专业技能', icon: 'ri-tools-line' },
  { key: 'evaluation', label: '自我评价', icon: 'ri-speak-line' },
  { key: 'ideas', label: '职业想法', icon: 'ri-lightbulb-line' },
]
const activeTab = ref('overview')

const evaluationSec = computed(() => props.data.rightBottom?.[0])
const ideasSec = computed(() => props.data.rightBottom?.[1])

// 列表型子标签（概览 / 自我评价 / 职业想法）当前要渲染的章节
const currentSections = computed(() => {
  if (activeTab.value === 'overview') return props.data.left ?? []
  if (activeTab.value === 'evaluation') return evaluationSec.value ? [evaluationSec.value] : []
  if (activeTab.value === 'ideas') return ideasSec.value ? [ideasSec.value] : []

  return []
})
</script>

<template>
  <div class="profile-content">
    <!-- 👉 页内子标签（吸顶，紧贴主标签栏下方，滚动时常驻可见） -->
    <VCard
      rounded="lg"
      flat
      class="subtabs-sticky mb-6"
    >
      <VTabs
        v-model="activeTab"
        color="primary"
        density="comfortable"
        grow
        :show-arrows="false"
      >
        <VTab
          v-for="t in tabs"
          :key="t.key"
          :value="t.key"
          :prepend-icon="smAndDown ? undefined : t.icon"
        >
          {{ t.label }}
        </VTab>
      </VTabs>
    </VCard>

    <!-- 👉 专业技能（双列） -->
    <VCard
      v-if="activeTab === 'skills'"
      class="mb-6"
      rounded="lg"
      elevation="1"
    >
      <VCardText>
        <div class="section-head text-h5 font-weight-bold mb-2">
          {{ data.skills.title }}
        </div>
        <VRow>
          <VCol
            v-for="(it, idx) in visibleItems(data.skills.items)"
            :key="idx"
            cols="12"
            md="6"
          >
            <v-list>
              <v-list-item
                :prepend-icon="it.icon"
                :class="{ important: it.important }"
              >
                <span class="item-text">
                  <template
                    v-for="(seg, si) in renderSegments(it.text)"
                    :key="si"
                  >
                    <strong
                      v-if="seg.strong"
                      class="item-emphasis"
                    >{{ seg.text }}</strong>
                    <template v-else>{{ seg.text }}</template>
                  </template>
                </span>
              </v-list-item>
            </v-list>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- 👉 列表型章节：概览 / 自我评价 / 职业想法 -->
    <template v-else>
      <VCard
        v-for="sec in currentSections"
        :key="sec.title"
        class="mb-6"
        rounded="lg"
        elevation="1"
      >
        <VCardText>
          <div class="section-head text-h5 font-weight-bold mb-2">
            {{ sec.title }}
          </div>
          <v-list>
            <v-list-item
              v-for="(it, idx) in visibleItems(sec.items)"
              :key="idx"
              :prepend-icon="it.icon"
              :class="{ important: it.important }"
            >
              <span class="item-text">
                <template
                  v-for="(seg, si) in renderSegments(it.text)"
                  :key="si"
                >
                  <strong
                    v-if="seg.strong"
                    class="item-emphasis"
                  >{{ seg.text }}</strong>
                  <template v-else>{{ seg.text }}</template>
                </template>
              </span>
            </v-list-item>
          </v-list>
        </VCardText>
      </VCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.section-head {
  position: relative;
  padding-left: 14px;
  font-weight: 700;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 2px;
    bottom: 2px;
    width: 4px;
    border-radius: 4px;
    background: rgb(var(--v-theme-primary));
  }
}

.important {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

// 👉 文本内局部强调（JSON 中用 **文字** 标记），黄色高亮
.item-emphasis {
  font-weight: 600;
  color: rgb(var(--v-theme-warning));
}

// 👉 基准 15px，乘 --content-font-scale（顶栏字号按钮控制，默认 1）
.item-text {
  white-space: pre-line;
  line-height: 1.6;
  font-size: calc(0.9375rem * var(--content-font-scale, 1));
}

.v-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

// 👉 页内子标签吸顶：紧贴主标签栏下方（导航栏 64px + 主标签栏约 52px）
// 背景透明，仅用一条底线与下方内容分隔。
.subtabs-sticky {
  position: sticky;
  top: 116px;
  z-index: 10;
  background: transparent;
  box-shadow: none;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

// 👉 手机端：四个子标签一行内平分，去掉多余间距，确保「职业想法」可见
@media (max-width: 600px) {
  :deep(.v-tab) {
    min-width: 0 !important;
    padding-inline: 6px !important;
    font-size: 0.875rem !important;
  }
}
</style>
