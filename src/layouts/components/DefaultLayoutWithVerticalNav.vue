<script setup>
import { computed } from 'vue'
import Footer from '@/layouts/components/Footer.vue'
import NavItems from '@/layouts/components/NavItems.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import logo from '@images/logo.svg?raw'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'
import personal from '@/data/personal.json'
import { visibleItems } from '@/utils/visibility'

// 顶部代码仓库入口由 personal.json 的 repos 配置驱动（可加可减，也支持 visibility: hidden）
const repos = computed(() => visibleItems(personal.repos ?? []))
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

        <UserProfile />
      </div>
    </template>

    <template #vertical-nav-header="{ toggleIsOverlayNavActive }">
      <RouterLink
        class="app-logo app-title-wrapper"
        to="/"
      >
        <div
          class="d-flex"
          v-html="logo"
        />

        <h1 class="font-weight-medium leading-normal text-xl text-uppercase">
          Portfolio
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
</style>
