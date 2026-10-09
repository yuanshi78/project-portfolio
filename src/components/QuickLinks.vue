<script setup>
import config from '@/data/shortcuts.json'

// 与全局快捷键（src/data/shortcuts.json 的 shortcuts）按 `to` 关联，
// 在为某个入口匹配到快捷键时，展示对应的键位提示。
const links = (config?.quickLinks ?? []).map(link => {
  const sc = (config?.shortcuts ?? []).find(s => s.to === link.to)
  return { ...link, combo: sc?.combo ?? '' }
})
</script>

<template>
  <div
    v-if="links.length"
    class="quick-links px-4 pt-2 pb-3"
  >
    <div class="text-overline text-medium-emphasis mb-2 d-flex align-center">
      <VIcon
        icon="ri-rocket-line"
        size="x-small"
        class="me-1"
      />
      快捷入口
    </div>
    <VBtn
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :prepend-icon="link.icon"
      variant="tonal"
      color="primary"
      class="mb-2 justify-start text-start text-body-2"
      block
      rounded="lg"
    >
      {{ link.label }}
      <span
        v-if="link.combo"
        class="kbd-chip ms-auto"
        :title="`快捷键：${link.combo}`"
      >{{ link.combo }}</span>
    </VBtn>
  </div>
</template>

<style scoped>
.quick-links :deep(.v-btn__content) {
  flex: 1 1 auto;
  justify-content: flex-start;
}

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
