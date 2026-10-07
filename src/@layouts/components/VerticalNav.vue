<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useDisplay } from 'vuetify'
import logo from '@images/logo.svg?raw'

const props = defineProps({
  tag: {
    type: null,
    required: false,
    default: 'aside',
  },
  isOverlayNavActive: {
    type: Boolean,
    required: true,
  },
  toggleIsOverlayNavActive: {
    type: Function,
    required: true,
  },
})

const { mdAndDown } = useDisplay()
const refNav = ref()

// PerfectScrollbar 实例（组件暴露的 ps），用于在菜单内容变化后重算滚动状态
const refPs = ref()

/*ℹ️ 菜单内容变化（分组展开/折叠、路由切换、导航折叠）后同步滚动条状态：
滚动条只在「实际可见菜单高度 > 可用高度（页面高度去掉头部）」时出现。*/
const updatePs = () => {
  requestAnimationFrame(() => {
    const ps = refPs.value?.ps

    if (ps && typeof ps.update === 'function')
      ps.update()
  })
}

let observer = null
let boxObserver = null
const handleTransitionEnd = evt => {
  // 分组展开/折叠用的是 grid-template-rows 过渡，动画结束后再重算
  if (evt.propertyName === 'grid-template-rows')
    updatePs()
}

onMounted(() => {
  updatePs()

  // 内容/DOM 变化（分组开合、路由切换等）→ 重算
  if (refNav.value && window.MutationObserver) {
    observer = new MutationObserver(updatePs)
    observer.observe(refNav.value, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    })
  }

  // 导航折叠（mini）↔ 悬停展开：容器尺寸变化、条目高度随之变化 → 重算
  if (refNav.value && window.ResizeObserver) {
    boxObserver = new ResizeObserver(updatePs)
    boxObserver.observe(refNav.value)
  }

  refNav.value?.addEventListener('transitionend', handleTransitionEnd)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  boxObserver?.disconnect()
  refNav.value?.removeEventListener('transitionend', handleTransitionEnd)
})

/*ℹ️ Close overlay side when route is changed
Close overlay vertical nav when link is clicked
*/
const route = useRoute()

watch(() => route.path, () => {
  props.toggleIsOverlayNavActive(false)
})

const isVerticalNavScrolled = ref(false)
const updateIsVerticalNavScrolled = val => isVerticalNavScrolled.value = val

const handleNavScroll = evt => {
  isVerticalNavScrolled.value = evt.target.scrollTop > 0
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <Component
    :is="props.tag"
    ref="refNav"
    class="layout-vertical-nav"
    :class="[
      {
        'visible': isOverlayNavActive,
        'scrolled': isVerticalNavScrolled,
        'overlay-nav': mdAndDown,
      },
    ]"
  >
    <!-- 👉 Header -->
    <div class="nav-header">
      <slot name="nav-header">
        <RouterLink
          to="/"
          class="app-logo app-title-wrapper"
        >
          <div
            class="d-flex"
            v-html="logo"
          />

          <h1 class="font-weight-medium leading-normal text-xl text-uppercase">
            Materio
          </h1>
        </RouterLink>
      </slot>
    </div>
    <slot name="before-nav-items">
      <div class="vertical-nav-items-shadow" />
    </slot>
    <slot
      name="nav-items"
      :update-is-vertical-nav-scrolled="updateIsVerticalNavScrolled"
    >
      <PerfectScrollbar
        ref="refPs"
        tag="ul"
        class="nav-items"
        :options="{ wheelPropagation: false }"
        @ps-scroll-y="handleNavScroll"
      >
        <slot />
      </PerfectScrollbar>
    </slot>

    <slot name="after-nav-items" />
  </Component>
</template>

<style lang="scss" scoped>
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

<style lang="scss">
@use "@configured-variables" as variables;
@use "@layouts/styles/mixins";

// 👉 Vertical Nav
.layout-vertical-nav {
  position: fixed;
  z-index: variables.$layout-vertical-nav-z-index;
  display: flex;
  flex-direction: column;
  block-size: 100%;
  inline-size: variables.$layout-vertical-nav-width;
  inset-block-start: 0;
  inset-inline-start: 0;
  transition: inline-size 0.25s ease-in-out, box-shadow 0.25s ease-in-out;
  will-change: transform, inline-size;

  .nav-header {
    display: flex;
    align-items: center;

    .header-action {
      cursor: pointer;

      @at-root {
        #{variables.$selector-vertical-nav-mini} .nav-header .header-action {
          &.nav-pin,
          &.nav-unpin {
            display: none !important;
          }
        }
      }
    }
  }

  .app-title-wrapper {
    margin-inline-end: auto;
  }

  // 👉 菜单滚动区：只占「页面高度去掉头部」的剩余空间。
  // 原先 block-size:100% 是把整个导航高度都给它（会把底部挤出可视区）；
  // 改成 flex 填充剩余空间后，只有当菜单实际高度（折叠或展开）大于这块空间时才出现滚动条。
  .nav-items {
    flex: 1 1 0;
    min-block-size: 0;

    // 👉 内容未溢出时彻底隐藏滚动条：
    // PS 的 rail 只有在容器带 ps--active-y（内容溢出）时才 display:block，
    // 这里再加一道保险，防止状态滞后时残留轨道。
    &:not(.ps--active-y) .ps__rail-y {
      display: none !important;
    }
  }

  .nav-item-title {
    overflow: hidden;
    margin-inline-end: auto;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 👉 Collapsed
  .layout-vertical-nav-collapsed & {
    &:not(.hovered) {
      inline-size: variables.$layout-vertical-nav-collapsed-width;
    }
  }
}

// Small screen vertical nav transition
@media (max-width:1279px) {
  .layout-vertical-nav {
    &:not(.visible) {
      transform: translateX(-#{variables.$layout-vertical-nav-width});

      @include mixins.rtl {
        transform: translateX(variables.$layout-vertical-nav-width);
      }
    }

    transition: transform 0.25s ease-in-out;
  }
}
</style>
