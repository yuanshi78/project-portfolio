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
</style>
