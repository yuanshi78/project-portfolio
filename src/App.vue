<script setup>
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

// 注册全局键盘快捷键（组合键 → 页面，见 src/data/shortcuts.json）
useKeyboardShortcuts()
</script>

<template>
  <VApp>
    <RouterView />
  </VApp>
</template>
