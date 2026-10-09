<script setup>
import { computed } from 'vue'
import Footer from '@/layouts/components/Footer.vue'
import NavItems from '@/layouts/components/NavItems.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import QuickLinks from '@/components/QuickLinks.vue'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'
import personal from '@/data/personal.json'
import { visibleItems } from '@/utils/visibility'
import { useFontScale } from '@/utils/fontScale'

// 内容正文字号：放大 / 放小 两个独立按钮，选择记在 localStorage
const {
  current: fontLevel,
  increase: increaseFontLevel,
  decrease: decreaseFontLevel,
  canIncrease,
  canDecrease,
} = useFontScale()

// 顶部代码仓库入口由 personal.json 的 repos 配置驱动（可加可减，也支持 visibility: hidden）
const repos = computed(() => visibleItems(personal.repos ?? []))

// 侧边栏品牌名由 personal.json 的 site.name 配置
const siteName = computed(() => personal.site?.name ?? '')

// 站点 logo 由 personal.json 的 site.logo 配置（路径指向 public/ 下的文件，如 /images/logo.svg）
const siteLogo = computed(() => personal.site?.logo ?? '')

// 简历下载入口由 personal.json 的 cv 配置驱动（未配置 url 则不在导航栏显示）
const cvUrl = computed(() => personal.cv?.url ?? '')
const cvLabel = computed(() => personal.cv?.label ?? '下载简历')
</script>

<template>
  <VerticalNavLayout>
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <!-- 👉 Vertical nav toggle in overlay mode -->
        <IconBtn
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="ri-menu-line" />
        </IconBtn>

        <VSpacer />

        <div class="navbar-actions d-flex align-center">
          <!-- 👉 代码仓库入口（来自 personal.json 的 repos） -->
          <IconBtn
            v-for="repo in repos"
            :key="repo.url"
            class="me-2"
            :href="repo.url"
            rel="noopener noreferrer"
            target="_blank"
          >
            <VIcon :icon="repo.icon" />
            <VTooltip
              activator="parent"
              open-delay="500"
              scroll-strategy="close"
            >
              {{ repo.name }}
            </VTooltip>
          </IconBtn>

          <!-- 👉 简历下载（来自 personal.json 的 cv 配置） -->
          <IconBtn
            v-if="cvUrl"
            class="me-2"
            :href="cvUrl"
            download
          >
            <VIcon icon="ri-download-line" />
            <VTooltip
              activator="parent"
              open-delay="500"
              scroll-strategy="close"
            >
              {{ cvLabel }}
            </VTooltip>
          </IconBtn>

          <!-- 👉 内容正文字号：放小 / 放大 两个独立按钮，到两端自动禁用 -->
          <IconBtn
            class="me-1"
            :disabled="!canDecrease"
            @click="decreaseFontLevel"
          >
            <VIcon icon="ri-zoom-out-line" />
            <VTooltip
              activator="parent"
              open-delay="500"
              scroll-strategy="close"
            >
              放小正文（当前：{{ fontLevel.label }}）
            </VTooltip>
          </IconBtn>
          <IconBtn
            class="me-2"
            :disabled="!canIncrease"
            @click="increaseFontLevel"
          >
            <VIcon icon="ri-zoom-in-line" />
            <VTooltip
              activator="parent"
              open-delay="500"
              scroll-strategy="close"
            >
              放大正文（当前：{{ fontLevel.label }}）
            </VTooltip>
          </IconBtn>

          <UserProfile />
        </div>
      </div>
    </template>

    <template #vertical-nav-header="{ toggleIsOverlayNavActive }">
      <RouterLink
        class="app-logo app-title-wrapper"
        to="/"
      >
        <img
          v-if="siteLogo"
          :src="siteLogo"
          alt="logo"
          class="d-flex app-logo-img"
          style="height: 24px; width: auto;"
        >

        <h1 class="font-weight-medium leading-normal text-xl text-uppercase">
          {{ siteName }}
        </h1>
      </RouterLink>

      <IconBtn
        class="d-block d-lg-none"
        @click="toggleIsOverlayNavActive(false)"
      >
        <VIcon icon="ri-close-line" />
      </IconBtn>
    </template>

    <template #vertical-nav-content>
      <QuickLinks />
      <VDivider class="my-2" />
      <NavItems />
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <!--      <Footer />-->
    </template>
  </VerticalNavLayout>
</template>

<style lang="scss" scoped>
.meta-key {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 1.5625rem;
  line-height: 1.3125rem;
  padding-block: 0.125rem;
  padding-inline: 0.25rem;
}

.app-logo {
  display: flex;
  align-items: center;
  column-gap: 0.75rem;

  .app-logo-title {
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 1.75rem;
    text-transform: uppercase;
  }
}

// 👉 顶部动作区：手机上收紧间距，并给头像留出右边距，避免拥挤 / 贴边
.navbar-actions {
  margin-inline-end: 2px;
}

@media (max-width: 599px) {
  .navbar-actions {
    margin-inline-end: 6px;
  }

  // 覆盖按钮自带的 me-* 间距，排得更紧凑
  .navbar-actions :deep(.v-btn) {
    margin-inline-end: 2px !important;
  }
}
</style>

<!-- 全局样式（非 scoped）：顶栏背景改为完全不透明 -->
<style lang="scss">
// 默认顶栏滚动时使用 surface 0.85 + backdrop-filter 模糊，页面内容会透出来。
// 这里统一改为不透明的 surface 色并去掉模糊，避免内容（如「关于我」）从顶栏透出。
.layout-navbar.navbar-blur {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background-color: rgb(var(--v-theme-surface)) !important;
}

.navbar-content-container {
  background-color: rgb(var(--v-theme-surface)) !important;
}
</style>
