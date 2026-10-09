<script setup>
import me from '@images/avatars/me.png'
import Profile from './profile.vue'
import Products from './products.vue'
import Projects from './projects.vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { personal } from '@/data/personal'
import { parseEmphasis } from '@/utils/emphasis'
import { getYears, getExpYears } from '@/utils/years'
import shortcutsConfig from '@/data/shortcuts.json'

const data = personal
const meta = data.meta
const tabs = data.tabs

// 👉 快速入口：与侧栏 QuickLinks 同源配置，跳转站点其他板块
// 并关联全局快捷键（shortcuts.json 的 shortcuts，按 `to` 匹配），用于展示键位提示
const quickLinks = (shortcutsConfig?.quickLinks ?? []).map(q => {
  const sc = (shortcutsConfig?.shortcuts ?? []).find(s => s.to === q.to)
  return { ...q, combo: sc?.combo ?? '' }
})

// 👉 主标签 = 板块锚点导航（点击平滑滚动到对应板块，而非切换显隐）
const activeKey = ref(0)
const sectionAnchors = { 3: 'section-about', 0: 'section-profile', 1: 'section-projects', 2: 'section-products' }

// 点击后短暂锁定高亮，避免平滑滚动途中被滚动判定覆盖（尤其是最后一个短板块）
let lockUntil = 0
const goTo = key => {
  activeKey.value = key
  lockUntil = Date.now() + 900
  const el = document.getElementById(sectionAnchors[key])
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 滚动时同步高亮当前所在板块：取「顶部已越过导航栏下方参考线」的最后一个板块。
// 按头部位置判定，避免短板块【产品】被紧邻且占满视口的【项目】抢走高亮。
let scrollRaf = false
const updateActiveSection = () => {
  const els = Object.entries(sectionAnchors)
    .map(([k, id]) => ({ k: Number(k), el: document.getElementById(id) }))
    .filter(s => s.el)
  if (!els.length) return
  // 已滚动到底：高亮文档顺序里的最后一个板块
  // （否则最后一个短板块的标题永远顶不到参考线，无法被选中）
  const doc = document.documentElement
  if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
    let last = els[0]
    for (const s of els) {
      if (s.el.getBoundingClientRect().top > last.el.getBoundingClientRect().top) last = s
    }
    activeKey.value = last.k
    return
  }
  const offset = 100 // 略低于吸顶导航(64px)
  // 与遍历顺序无关：在所有「标题已越过参考线」的板块中，取最靠下的那个
  let current = null
  let bestTop = -Infinity
  let topMost = 0
  let topMostTop = Infinity
  for (const s of els) {
    const top = s.el.getBoundingClientRect().top
    if (top < topMostTop) {
      topMostTop = top
      topMost = s.k
    }
    if (top <= offset && top > bestTop) {
      bestTop = top
      current = s.k
    }
  }
  activeKey.value = current ?? topMost ?? 0
}
const onScroll = () => {
  if (Date.now() < lockUntil) return // 点击后的平滑滚动期间不覆盖
  if (scrollRaf) return
  scrollRaf = true
  requestAnimationFrame(() => {
    updateActiveSection()
    scrollRaf = false
  })
}
// 用户手动滚动时立即解除锁定
const releaseLock = () => {
  lockUntil = 0
}
// capture:true 以便无论页面滚动发生在 window 还是内层滚动容器，都能收到滚动事件
const SCROLL_OPTS = { passive: true, capture: true }
onMounted(() => {
  window.addEventListener('scroll', onScroll, SCROLL_OPTS)
  window.addEventListener('resize', onScroll, { passive: true })
  window.addEventListener('wheel', releaseLock, { passive: true })
  window.addEventListener('touchstart', releaseLock, { passive: true })
  window.addEventListener('keydown', releaseLock)
  updateActiveSection()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll, SCROLL_OPTS)
  window.removeEventListener('resize', onScroll)
  window.removeEventListener('wheel', releaseLock)
  window.removeEventListener('touchstart', releaseLock)
  window.removeEventListener('keydown', releaseLock)
})

// 👉 顶部叙述性自我介绍（非列表）：支持多段 \n 与 **强调**
// 与 profile.vue 保持一致：{years} 来华年数、{exp} 工龄，均来自 @/utils/years 全局配置
const aboutSegments = computed(() =>
  parseEmphasis(
    (data.about ?? '')
      .replace('{years}', getYears())
      .replace('{exp}', getExpYears()),
  ),
)

// 👉 致雇主 / 合作意向（独立板块，不混入 CV 与 about）
const forEmployersSegments = computed(() => parseEmphasis(data.forEmployers ?? ''))
</script>

<template>
  <div class="detail-content mx-auto">
    <!-- 👉 Hero 个人卡 -->
    <VCard
      class="hero-card mb-6"
      rounded="xl"
      elevation="2"
    >
      <VImg
        :src="data.cover"
        aspect-ratio="3"
        cover
        max-height="200"
      />

      <VCardText class="text-center pt-0">
        <VAvatar
          :image="me"
          class="avatar-center"
          size="120"
        />

        <VCardTitle class="text-h4 text-lg-h3 font-weight-bold pa-0 hero-title mt-2">
          {{ data.name }}
        </VCardTitle>

        <div class="d-flex flex-wrap justify-center mt-3">
          <VChip
            v-for="(m, i) in meta"
            :key="i"
            size="small"
            variant="tonal"
            :prepend-icon="m.icon"
            class="me-1 mb-1"
          >
            {{ m.text }}
          </VChip>
        </div>

      </VCardText>
    </VCard>

    <!-- 👉 快速入口：一键跳转到站点其他板块（与侧栏 QuickLinks 同源配置） -->
    <VCard
      v-if="quickLinks.length"
      class="mb-6"
      rounded="lg"
      elevation="1"
    >
      <VCardText>
        <div class="section-title mb-3">
          快速入口
        </div>
        <div class="d-flex flex-wrap align-center">
          <VBtn
            v-for="q in quickLinks"
            :key="q.to"
            :to="q.to"
            color="primary"
            variant="tonal"
            :prepend-icon="q.icon"
            class="me-2 mb-2"
          >
            {{ q.label }}
            <span
              v-if="q.combo"
              class="kbd-chip ms-2"
              :title="`快捷键：${q.combo}`"
            >{{ q.combo }}</span>
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- 👉 关于我（叙述性自我介绍，非列表格式） -->
    <VCard
      v-if="data.about"
      id="section-about"
      class="mb-6 anchor-section"
      rounded="lg"
      elevation="1"
    >
      <VCardText>
        <div class="section-head text-h5 font-weight-bold mb-2">
          关于我
        </div>
        <p class="about-text">
          <template
            v-for="(seg, si) in aboutSegments"
            :key="si"
          >
            <strong
              v-if="seg.strong"
              class="about-emphasis"
            >{{ seg.text }}</strong>
            <template v-else>{{ seg.text }}</template>
          </template>
        </p>
      </VCardText>
    </VCard>

    <!-- 👉 致雇主 / 合作意向（独立板块，避免与 CV、about 混淆） -->
    <VCard
      v-if="data.forEmployers"
      class="mb-6 for-employers"
      rounded="lg"
      elevation="1"
    >
      <VCardText>
        <div class="section-head text-h5 font-weight-bold mb-2">
          致雇主 / 合作意向
        </div>
        <p class="about-text">
          <template
            v-for="(seg, si) in forEmployersSegments"
            :key="si"
          >
            <strong
              v-if="seg.strong"
              class="about-emphasis"
            >{{ seg.text }}</strong>
            <template v-else>{{ seg.text }}</template>
          </template>
        </p>
      </VCardText>
    </VCard>

    <!-- 👉 切换：个人信息 / 产品 / 项目 -->
    <!-- 点击按钮平滑滚动到对应板块（锚点导航）；桌面端（≥lg）右侧垂直居中悬浮，落地即见；中屏/移动端顶部吸顶 -->
    <div class="main-tabs">
      <VBtn
        v-for="t in tabs"
        :key="t.key"
        color="primary"
        :variant="activeKey === t.key ? 'flat' : 'tonal'"
        :prepend-icon="t.icon"
        class="tab-btn"
        @click="goTo(t.key)"
      >
        {{ t.label }}
      </VBtn>
    </div>

    <!-- 👉 个人信息 -->
    <section
      id="section-profile"
      class="anchor-section"
    >
      <div class="section-title mb-3">
        个人信息
      </div>
      <Profile :data="data.profile" :birthday="data.birthday" />
    </section>

    <!-- 👉 产品 -->
    <section
      id="section-products"
      class="anchor-section"
    >
      <Products :data="data.products" />
    </section>

    <!-- 👉 项目 -->
    <section
      id="section-projects"
      class="anchor-section"
    >
      <Projects :data="data.experience" />
    </section>
  </div>
</template>

<style lang="scss" scoped>
.detail-content {
  max-width: 960px;
}

// 移动端/中屏：为底部悬浮标签栏预留空间，避免遮挡正文末尾
@media (max-width: 1279px) {
  .detail-content {
    padding-bottom: 88px;
  }
}

.hero-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.hero-title {
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.avatar-center {
  margin-top: -60px;
  border: 4px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-surface));
  position: relative;
  z-index: 1;
}

.about-text {
  white-space: pre-line;
  line-height: 1.8;
  // 基准 16px，乘 --content-font-scale（顶栏字号按钮控制，默认 1）
  font-size: calc(1rem * var(--content-font-scale, 1));
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.about-emphasis {
  font-weight: 600;
  color: #FFC857;
}

// 👉 致雇主板块：左侧主色描边，区别于普通自我介绍
.for-employers {
  border-inline-start: 4px solid rgb(var(--v-theme-primary));
}

// 👉 主标签栏
// 移动端/中屏（默认）：底部悬浮胶囊，拇指可达、不占顶部，落地即见。
// （正文已预留底部间距，避免遮挡）
.main-tabs {
  position: fixed;
  left: 50%;
  bottom: 0.75rem; // 12px
  transform: translateX(-50%);
  z-index: 30;
  display: flex;
  flex-wrap: nowrap;
  gap: 0.375rem; // 6px
  max-width: calc(100% - 1.5rem); // 24px
  padding: 0.375rem; // 6px
  border-radius: 0.875rem; // 14px
  background: rgb(var(--v-theme-surface));
  border: 0.0625rem solid rgba(var(--v-border-color), var(--v-border-opacity)); // 1px
  box-shadow: 0 0.625rem 1.75rem -0.75rem rgba(0, 0, 0, 0.45);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-btn {
  white-space: nowrap;
}

// 窄屏：隐藏图标、收紧内边距，保证一行放得下
@media (max-width: 599px) {
  .main-tabs :deep(.v-btn) {
    padding-inline: 0.625rem; // 10px
    font-size: 0.8125rem;
  }

  .main-tabs :deep(.v-btn__prepend) {
    display: none;
  }
}

// 👉 桌面端（≥lg）：右侧垂直居中悬浮，落地即见，不随内容滚动。
@media (min-width: 1280px) {
  .main-tabs {
    top: 50%;
    right: 1.5rem; // 24px
    bottom: auto;
    left: auto;
    transform: translateY(-50%);
    flex-direction: column;
    align-items: stretch;
    max-width: none;
    overflow: visible;
    gap: 0.875rem; // 14px
    padding: 0.5rem; // 8px
    border-radius: 0.875rem; // 14px
  }
}

// 👉 板块锚点：滚动定位时避开顶部吸顶导航栏
.anchor-section {
  scroll-margin-top: 80px;
  margin-bottom: 28px;
}

// 👉 「个人信息」板块标题（与产品/项目组件内部标题风格一致）
.section-title {
  position: relative;
  padding-left: 14px;
  font-weight: 700;
  font-size: 1.5rem;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 4px;
    border-radius: 4px;
    background: rgb(var(--v-theme-primary));
  }
}

// 👉 快捷键位提示（kbd 风格小标签）
.kbd-chip {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.6875rem;
  line-height: 1;
  padding: 0.1875rem 0.375rem;
  border-radius: 0.375rem;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  white-space: nowrap;
}
</style>
