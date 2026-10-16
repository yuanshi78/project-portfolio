<script setup>
import config from '@/data/shortcuts'

// 与全局快捷键（src/data/shortcuts.json 的 shortcuts）按 `to` 关联，
// 在为某个入口匹配到快捷键时，展示对应的键位提示。
// 注意：不要在此处把 link.label 展开成字符串（会按当时语言冻结、切换语言不更新）；
// 保留代理对象，在模板里访问 link.label 由其 get 陷阱按当前响应式语言解析。
const links = (config?.quickLinks ?? []).map(link => {
  const sc = (config?.shortcuts ?? []).find(s => s.to === link.to)
  return { link, combo: sc?.combo ?? '' }
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
      {{ $t('quickLinks') }}
    </div>
    <VBtn
      v-for="item in links"
      :key="item.link.to"
      :to="item.link.to"
      :prepend-icon="item.link.icon"
      variant="tonal"
      color="primary"
      class="mb-2 justify-start text-start text-body-2"
      block
      rounded="lg"
    >
      <div class="ql-body">
        <span class="ql-label">{{ item.link.label }}</span>
        <span
          v-if="item.combo"
          class="kbd-chip"
          :title="$t('hotkey', { combo: item.combo })"
        >{{ item.combo }}</span>
      </div>
    </VBtn>
  </div>
</template>

<style scoped>
.quick-links :deep(.v-btn) {
  height: auto;
  min-height: 2.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.quick-links :deep(.v-btn__content) {
  flex: 1 1 auto;
  align-items: flex-start;
}

.ql-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 1 auto;
  min-width: 0;
}

.ql-label {
  white-space: normal;
  overflow-wrap: anywhere;
}

.kbd-chip {
  display: inline-block;
  margin-top: 0.25rem;
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
