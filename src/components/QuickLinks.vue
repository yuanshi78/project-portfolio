<script setup>
import config from '@/data/shortcuts.json'

const links = config?.quickLinks ?? []
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
    </VBtn>
  </div>
</template>

<style scoped>
.quick-links :deep(.v-btn__content) {
  flex: 1 1 auto;
  justify-content: flex-start;
}
</style>
