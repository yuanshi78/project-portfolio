<script setup>
import me from '@images/avatars/me.png'
import Profile from './profile.vue'
import Projects from './projects.vue'
import ImageGallery from '@/components/ImageGallery.vue'
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDisplay } from 'vuetify'
import { personal } from '@/data/personal'
import { parseEmphasis } from '@/utils/emphasis'
import { getYears, getExpYears } from '@/utils/years'
import { visibleItems } from '@/utils/visibility'
import shortcutsConfig from '@/data/shortcuts.json'

const data = personal
const meta = data.meta
const tabs = data.tabs

const { smAndDown } = useDisplay()

// 👉 快速入口：与侧栏 QuickLinks 同源配置，跳转站点其他板块
// 并关联全局快捷键（shortcuts.json 的 shortcuts，按 `to` 匹配），用于展示键位提示
const quickLinks = (shortcutsConfig?.quickLinks ?? []).map(q => {
  const sc = (shortcutsConfig?.shortcuts ?? []).find(s => s.to === q.to)
  return { ...q, combo: sc?.combo ?? '' }
})

// 👉 简历下载（来自 personal.json 的 cv 配置）
const cvUrl = computed(() => data.cv?.url ?? '')
const cvLabel = computed(() => data.cv?.label ?? '下载简历')

// 👉 产品：第一个作为「精选大卡」，其余按普通卡片网格展示
const productItems = computed(() => visibleItems(data.products?.items ?? []))
const featuredProduct = computed(() => productItems.value[0])
const otherProducts = computed(() => productItems.value.slice(1))

// 👉 数字背书条：来自 personal.json 的 stats（纯强调文案，可增删改）
// value / label 支持 {years}（定居西安年数）与 {exp}（软件工程年数）占位符，来自 @/utils/years
const stats = computed(() =>
  (data.stats ?? []).map(s => ({
    ...s,
    value: String(s.value ?? '').replace('{years}', getYears()).replace('{exp}', getExpYears()),
    label: String(s.label ?? '').replace('{years}', getYears()).replace('{exp}', getExpYears()),
  })),
)

// 👉 移动端长文默认折叠（关于我 / 致雇主 / 个人信息），PC 常开；用户手动切换后以手动状态为准
const userToggled = reactive({})
const isExpanded = key => (key in userToggled ? userToggled[key] : !smAndDown.value)
const toggle = key => {
  userToggled[key] = !isExpanded(key)
}

// 👉 主标签 = 板块锚点导航（点击平滑滚动到对应板块，而非切换显隐）
const activeKey = ref(0)
const sectionAnchors = { 2: 'section-products', 1: 'section-projects', 3: 'section-about', 0: 'section-profile' }
// 点击标签时，若目标板块在移动端是折叠的，先展开
const collapsibleByTab = { 3: 'about', 0: 'profile' }

// 点击后短暂锁定高亮，避免平滑滚动途中被滚动判定覆盖（尤其是最后一个短板块）
let lockUntil = 0
const goTo = key => {
  activeKey.value = key
  if (collapsibleByTab[key] !== undefined) userToggled[collapsibleByTab[key]] = true
  lockUntil = Date.now() + 900
  const el = document.getElementById(sectionAnchors[key])
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 滚动时同步高亮当前所在板块：取「顶部已越过吸顶导航 + 分段导航参考线」的最后一个板块。
// 按头部位置判定，避免短板块被紧邻且占满视口的下一板块抢走高亮。
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
  // 参考线：略低于吸顶导航(64px)
  const offset = 100
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

// 👉 Hero 一句定位：about 的第一段（替换 {years}/{exp} 占位符）
const heroTagline = computed(() => (data.about ?? '').split('\n')[0]?.trim() ?? '')

// 👉 叙述性长文（关于我 / 致雇主）：支持多段 \n 与 **强调**
const aboutSegments = computed(() =>
  parseEmphasis(
    (data.about ?? '')
      .replace('{years}', getYears())
      .replace('{exp}', getExpYears()),
  ),
)
const forEmployersSegments = computed(() => parseEmphasis(data.forEmployers ?? ''))
</script>

<template>
  <!--
    首页 = 求职落地页，按说服链排布：
    ① Hero（身份 + 定位 + CTA）→ ② 数字背书条 → ③ 精选产品 → ④ 项目
    → ⑤ 关于我 / 致雇主（PC 双栏）→ ⑥ 个人信息（CV 细节）
    移动端：长文默认折叠；主题（配色 / 暗色模式 / 主色 / 卡片样式 / 字号缩放）保持完全不变。
  -->
  <div class="home-layout">
    <!-- 👉 ① Hero：封面做整卡背景 + 头像 + 姓名 + 一句定位 + CTA -->
    <VCard
      class="hero-card mb-6"
      rounded="xl"
      elevation="2"
    >
      <div class="hero-media">
        <div
          class="hero-cover"
          :style="{ backgroundImage: `url(${data.cover})` }"
        />
        <div class="hero-scrim" />

        <div class="hero-inner text-center">
          <VAvatar
            :image="me"
            :size="smAndDown ? 88 : 96"
            class="hero-avatar mb-3"
          />

          <div class="text-h5 text-lg-h4 font-weight-bold hero-name">
            {{ data.name }}
          </div>

          <div class="d-flex flex-wrap justify-center mt-3">
            <VChip
              v-for="(m, i) in meta"
              :key="i"
              size="small"
              class="hero-chip ma-1"
              :prepend-icon="m.icon"
            >
              {{ m.text }}
            </VChip>
          </div>

          <p
            v-if="heroTagline"
            class="hero-tagline mt-3 mb-0"
          >
            {{ heroTagline }}
          </p>

          <div class="d-flex flex-wrap justify-center mt-4">
            <VBtn
              v-if="cvUrl"
              color="primary"
              :href="cvUrl"
              download
              prepend-icon="ri-download-line"
              class="me-2 mb-2"
            >
              {{ cvLabel }}
            </VBtn>

            <VMenu
              v-if="quickLinks.length"
              location="bottom"
            >
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  variant="tonal"
                  color="primary"
                  prepend-icon="ri-rocket-line"
                  class="mb-2"
                >
                  快速入口
                </VBtn>
              </template>
              <VList density="compact">
                <VListItem
                  v-for="q in quickLinks"
                  :key="q.to"
                  :to="q.to"
                  :prepend-icon="q.icon"
                  :title="q.label"
                >
                  <template #append>
                    <span
                      v-if="q.combo"
                      class="kbd-chip"
                    >{{ q.combo }}</span>
                  </template>
                </VListItem>
              </VList>
            </VMenu>
          </div>
        </div>
      </div>
    </VCard>

    <!-- 👉 ② 数字背书条（personal.json 的 stats，未配置则不渲染） -->
    <VRow
      v-if="stats.length"
      dense
      class="mb-6 stats-row"
    >
      <VCol
        v-for="(s, i) in stats"
        :key="i"
        cols="6"
        sm="3"
      >
        <VCard
          class="stat-card h-100"
          rounded="lg"
          elevation="1"
        >
          <VCardText class="text-center py-3">
            <VIcon
              :icon="s.icon"
              color="primary"
              size="22"
              class="mb-1"
            />
            <div class="stat-value">
              <template
                v-for="(seg, si) in parseEmphasis(s.value)"
                :key="`v${si}`"
              >
                <strong
                  v-if="seg.strong"
                  class="stat-emphasis"
                >{{ seg.text }}</strong>
                <template v-else>{{ seg.text }}</template>
              </template>
            </div>
            <div class="stat-label">
              <template
                v-for="(seg, si) in parseEmphasis(s.label)"
                :key="`l${si}`"
              >
                <strong
                  v-if="seg.strong"
                  class="stat-emphasis"
                >{{ seg.text }}</strong>
                <template v-else>{{ seg.text }}</template>
              </template>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- 👉 四个板块按钮：移动端/中屏底部悬浮胶囊，PC（≥1280）右侧垂直居中悬浮 -->
    <div class="main-tabs">
      <VBtn
        v-for="t in tabs"
        :key="t.key"
        color="primary"
        size="small"
        rounded="lg"
        :variant="activeKey === t.key ? 'flat' : 'tonal'"
        :prepend-icon="t.icon"
        class="tab-btn"
        @click="goTo(t.key)"
      >
        {{ t.label }}
      </VBtn>
    </div>

    <!-- 👉 ③ 精选产品（第一个产品独占大卡，其余按普通卡片网格） -->
    <section
      id="section-products"
      class="anchor-section"
    >
      <div class="section-title mb-3">
        产品
      </div>

      <template v-if="featuredProduct">
        <VCard
          class="featured-card mb-6"
          rounded="xl"
          elevation="2"
        >
          <ImageGallery :images="featuredProduct.images" />
          <VCardText>
            <VChip
              v-if="featuredProduct.status"
              size="small"
              variant="tonal"
              label
              :color="featuredProduct.statusColor"
              class="mb-2"
            >
              {{ featuredProduct.status }}
            </VChip>
            <div class="text-h5 font-weight-bold mb-1 featured-title">
              {{ featuredProduct.title }}
            </div>
            <div
              v-if="featuredProduct.subtitle"
              class="text-body-2 text-medium-emphasis mb-2"
            >
              {{ featuredProduct.subtitle }}
            </div>
            <div class="product-text mb-3">
              {{ featuredProduct.text }}
            </div>
            <VBtn
              v-if="featuredProduct.to"
              :to="featuredProduct.to"
              color="primary"
              prepend-icon="ri-arrow-right-line"
            >
              查看详情
            </VBtn>
          </VCardText>
        </VCard>

        <!-- 其余产品（当前只有 1 个产品，此分支为未来扩展预留） -->
        <VRow
          v-if="otherProducts.length"
          class="mb-6"
        >
          <VCol
            v-for="item in otherProducts"
            :key="item.to || item.title"
            cols="12"
            sm="6"
            class="d-flex"
          >
            <VCard
              class="flex-1-1"
              rounded="lg"
              elevation="1"
            >
              <ImageGallery :images="item.images" />
              <VCardItem>
                <VCardTitle>
                  <RouterLink
                    :to="item.to"
                    class="text-decoration-none"
                  >{{ item.title }}</RouterLink>
                </VCardTitle>
                <VCardSubtitle v-if="item.subtitle">{{ item.subtitle }}</VCardSubtitle>
              </VCardItem>
              <VCardText>
                <VChip
                  v-if="item.status"
                  size="small"
                  variant="tonal"
                  label
                  :color="item.statusColor"
                  class="mb-2"
                >
                  {{ item.status }}
                </VChip>
                <div class="product-text mb-2">
                  {{ item.text }}
                </div>
                <RouterLink
                  v-if="item.to"
                  :to="item.to"
                  class="text-decoration-none d-inline-flex align-center text-primary"
                >
                  <span>查看详情</span>
                  <VIcon
                    icon="ri-arrow-right-line"
                    size="18"
                    class="ms-1"
                  />
                </RouterLink>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </template>
    </section>

    <!-- 👉 ④ 项目 -->
    <section
      id="section-projects"
      class="anchor-section"
    >
      <Projects :data="data.experience" />
    </section>

    <!-- 👉 ⑤ 关于我 + 致雇主（PC ≥1280 双栏并排；移动端可折叠） -->
    <div class="about-grid">
      <section
        v-if="data.about"
        id="section-about"
        class="anchor-section"
      >
        <VCard
          rounded="lg"
          elevation="1"
          class="collapsible-card"
          :class="{ 'is-toggle': smAndDown }"
        >
          <div
            class="collapsible-head"
            @click="smAndDown && toggle('about')"
          >
            <div class="section-head text-h5 font-weight-bold">
              关于我
            </div>
            <VIcon
              v-if="smAndDown"
              :icon="isExpanded('about') ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
              class="text-medium-emphasis"
            />
          </div>
          <VExpandTransition>
            <VCardText
              v-show="isExpanded('about')"
              class="pt-0"
            >
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
          </VExpandTransition>
        </VCard>
      </section>

      <section
        v-if="data.forEmployers"
        class="anchor-section"
      >
        <VCard
          class="for-employers collapsible-card"
          rounded="lg"
          elevation="1"
          :class="{ 'is-toggle': smAndDown }"
        >
          <div
            class="collapsible-head"
            @click="smAndDown && toggle('employers')"
          >
            <div class="section-head text-h5 font-weight-bold">
              致雇主 / 合作意向
            </div>
            <VIcon
              v-if="smAndDown"
              :icon="isExpanded('employers') ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
              class="text-medium-emphasis"
            />
          </div>
          <VExpandTransition>
            <VCardText
              v-show="isExpanded('employers')"
              class="pt-0"
            >
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
          </VExpandTransition>
        </VCard>
      </section>
    </div>

    <!-- 👉 ⑥ 个人信息（CV 细节，移动端可折叠） -->
    <section
      id="section-profile"
      class="anchor-section"
    >
      <div
        class="section-title mb-3 profile-title"
        :class="{ 'is-toggle': smAndDown }"
        @click="smAndDown && toggle('profile')"
      >
        个人信息
        <VIcon
          v-if="smAndDown"
          :icon="isExpanded('profile') ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
          size="20"
          class="ms-1 text-medium-emphasis"
        />
      </div>
      <VExpandTransition>
        <div v-show="isExpanded('profile')">
          <Profile
            :data="data.profile"
            :birthday="data.birthday"
          />
        </div>
      </VExpandTransition>
    </section>
  </div>
</template>

<style lang="scss" scoped>
// 👉 外层：单列内容（落地叙事）
.home-layout {
  max-width: 1080px;
  margin-inline: auto;
}

@media (max-width: 1279px) {
  .home-layout {
    max-width: 720px;
    padding-bottom: 88px; // 给底部悬浮按钮胶囊留空间
  }
}

// 👉 ① Hero：封面整卡背景 + 深色遮罩（保证任意主题下文字可读）
.hero-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.hero-media {
  position: relative;
  overflow: hidden;
  border-radius: inherit;
  min-height: 340px;
  display: flex;
}

.hero-cover {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.72) 100%);
}

.hero-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 48px 24px 40px;
  color: #fff;
  align-self: center;
}

.hero-avatar {
  border: 3px solid rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.18);
}

.hero-name {
  color: #fff;
  line-height: 1.2;
  letter-spacing: -0.5px;
  // 基准 = text-h5(1.125rem)，≥lg = text-lg-h4(1.5rem)；覆盖工具类需 !important
  font-size: calc(1.125rem * var(--content-font-scale, 1)) !important;

  @media (min-width: 1280px) {
    font-size: calc(1.5rem * var(--content-font-scale, 1)) !important;
  }
}

// 遮罩上强制白字，避免浅色主题下 tonal 组件在深底上不可读
// （body 前缀提权：主题用 body .v-chip.v-chip--size-small 控制小号 chip 字号）
body .hero-chip.v-chip {
  background: rgba(255, 255, 255, 0.16) !important;
  color: #fff !important;
  // 基准 13px（小号 chip），接入字号缩放
  font-size: calc(0.8125rem * var(--content-font-scale, 1)) !important;

  :deep(.v-icon) {
    color: #fff !important;
  }
}

.hero-tagline {
  max-width: 720px;
  margin-inline: auto;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.75;
  // 基准 16px，乘 --content-font-scale（顶栏字号按钮控制，默认 1）
  font-size: calc(1rem * var(--content-font-scale, 1));
}

@media (max-width: 1023px) {
  .hero-media {
    min-height: 0;
  }

  .hero-inner {
    padding: 32px 16px 28px;
  }

  // 移动端定位语最多 3 行，控制 Hero 高度
  .hero-tagline {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// 👉 ② 数字背书条
.stat-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.stat-value {
  // 基准 20px，乘 --content-font-scale（顶栏字号按钮控制，默认 1）
  font-size: calc(1.25rem * var(--content-font-scale, 1));
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  // 基准 12px，乘 --content-font-scale（顶栏字号按钮控制，默认 1）
  font-size: calc(0.75rem * var(--content-font-scale, 1));
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 2px;
}

// 👉 数字背书条 JSON 中的 **强调**（与 about-emphasis 同款暖金色）
.stat-emphasis {
  font-weight: 600;
  color: #FFC857;
}

// 👉 四个板块按钮：移动端/中屏底部悬浮胶囊；PC（≥1280）右侧垂直居中悬浮
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
  border: 0.0625rem solid rgba(var(--v-border-color), var(--v-border-opacity));
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
  flex: 0 0 auto;
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

// 👉 桌面端（≥1280）：右侧垂直居中悬浮，落地即见，不随内容滚动
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
  }
}

// 👉 板块锚点：滚动定位时避开顶部吸顶导航栏
.anchor-section {
  scroll-margin-top: 80px;
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
}

// 👉 ⑤ 关于我 + 致雇主：PC ≥1280 双栏并排
.about-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: start;
  margin-bottom: 28px;
}

@media (min-width: 1280px) {
  .about-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.about-grid .anchor-section {
  margin-bottom: 0;
}

// 👉 可折叠板块（移动端折叠 / PC 常开）
.collapsible-card.is-toggle .collapsible-head,
.profile-title.is-toggle {
  cursor: pointer;
  user-select: none;
}

.collapsible-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 16px;
}

// 👉 「产品 / 个人信息」板块标题（含左侧主色竖条）
.section-title {
  position: relative;
  padding-left: 14px;
  font-weight: 700;
  // 基准 24px，乘 --content-font-scale（顶栏字号按钮控制，默认 1）
  font-size: calc(1.5rem * var(--content-font-scale, 1));

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

// 👉 卡片内板块标题（关于我 / 致雇主，同款竖条）
.section-head {
  position: relative;
  padding-left: 14px;
  // 覆盖 text-h5 的固定字号（Vuetify 工具类带 !important，需同权重），接入字号缩放（P1）
  font-size: calc(1.5rem * var(--content-font-scale, 1)) !important;

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

// 👉 精选产品正文
.product-text {
  font-size: calc(0.9375rem * var(--content-font-scale, 1));
  line-height: 1.7;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

// 👉 其余文字接入字号缩放：卡片标题 / 副标题 / 精选产品标题
.home-layout :deep(.v-card-title) {
  // 基准 15px（主题 v-card-title 默认），覆盖需 !important
  font-size: calc(0.9375rem * var(--content-font-scale, 1)) !important;
}

// 副标题实测基准 13px，接入缩放（覆盖需 !important）
.home-layout :deep(.v-card-subtitle) {
  font-size: calc(0.8125rem * var(--content-font-scale, 1)) !important;
}

.featured-title {
  font-size: calc(1.125rem * var(--content-font-scale, 1)) !important;
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
