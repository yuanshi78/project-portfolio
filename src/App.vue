<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import IntroOverlay from '@/components/IntroOverlay.vue'

// 注册全局键盘快捷键（组合键 → 页面，见 src/data/shortcuts.json）
useKeyboardShortcuts()

// 👉 首屏 3D 粒子聚合动画：仅初次加载播放一次，done 后淡出并露出首页
const showIntro = ref(true)

// 👉 顶部滚动进度条：随页面滚动实时反映阅读进度
const progress = ref(0)
let progressRaf = 0
const updateProgress = () => {
  if (progressRaf) return
  progressRaf = requestAnimationFrame(() => {
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    progress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    progressRaf = 0
  })
}
onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress, { passive: true })
    updateProgress()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateProgress)
  window.removeEventListener('resize', updateProgress)
})
</script>

<template>
  <VApp>
    <!-- 👉 首屏 3D 粒子聚合动画（元实），播放完淡出露出首页 -->
    <IntroOverlay
      v-if="showIntro"
      @done="showIntro = false"
    />

    <!-- 👉 顶部滚动进度条（主色，覆盖在顶栏之上） -->
    <div
      class="scroll-progress"
      aria-hidden="true"
    >
      <div
        class="scroll-progress__bar"
        :style="{ transform: `scaleX(${progress})` }"
      />
    </div>

    <RouterView />
  </VApp>
</template>

<style lang="scss">
// 👉 顶部滚动进度条：固定顶部 3px，主色，scaleX 由 JS 驱动
.scroll-progress {
  position: fixed;
  inset: 0 0 auto 0;
  height: 3px;
  z-index: 4000;
  pointer-events: none;
  background: transparent;
}

.scroll-progress__bar {
  height: 100%;
  width: 100%;
  transform-origin: 0 50%;
  transform: scaleX(0);
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 0 8px rgba(var(--v-theme-primary), 0.6);
  will-change: transform;
}

// 👉 首屏 3D 动画播放期间锁定滚动：隐藏底层首页的滚动条
html.intro-scroll-lock,
html.intro-scroll-lock body {
  overflow: hidden !important;
  scrollbar-width: none;
}

html.intro-scroll-lock ::-webkit-scrollbar {
  display: none;
}

// 👉 全局滚动条：保留滚动条本身（可拖动定位 + 无障碍），但做成细窄主题色，
//    避免 Windows 默认粗灰条在深色主题下突兀。
//    scrollbar-gutter 预留滚动条槽位，消除内容高度变化时滚动条出现/消失导致的横向抖动。
//    主题色复用侧栏 perfect-scrollbar 的同一个变量，浅色/深色自动跟随。
html {
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--v-theme-perfect-scrollbar-thumb)) transparent;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgb(var(--v-theme-perfect-scrollbar-thumb));
  border: 3px solid transparent; // 配合 background-clip 做出细条效果
  border-radius: 999px;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--v-theme-primary));
  background-clip: content-box;
}

::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
