<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  item: {
    type: null,
    required: true,
  },
})

// 👉 名称过长时会被截断（显示省略号），此时用 tooltip 展示完整名称
const titleEl = ref(null)
const isTruncated = ref(false)

const updateTruncated = () => {
  const el = titleEl.value

  isTruncated.value = !!el && el.scrollWidth - el.clientWidth > 1
}

let observer = null

onMounted(() => {
  updateTruncated()

  window.addEventListener('resize', updateTruncated)

  if (window.ResizeObserver && titleEl.value) {
    observer = new ResizeObserver(updateTruncated)
    observer.observe(titleEl.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTruncated)

  if (observer)
    observer.disconnect()
})
</script>

<template>
  <li
    class="nav-link"
    :class="{ disabled: item.disable }"
  >
    <Component
      :is="item.to ? 'RouterLink' : 'a'"
      :to="item.to"
      :href="item.href"
      :target="item.target"
    >
      <VIcon
        :icon="item.icon || 'ri-checkbox-blank-circle-line'"
        class="nav-item-icon"
      />
      <!-- 👉 Title -->
      <span
        ref="titleEl"
        class="nav-item-title"
      >
        {{ item.title }}
        <VTooltip
          v-if="isTruncated"
          activator="parent"
          location="end"
          open-delay="300"
          scroll-strategy="close"
        >
          {{ item.title }}
        </VTooltip>
      </span>
      <span
        class="nav-item-badge"
        :class="item.badgeClass"
      >
        {{ item.badgeContent }}
      </span>
    </Component>
  </li>
</template>

<style lang="scss">
.layout-vertical-nav {
  .nav-link a {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  // 过长名称截断为单行，配合上面的 tooltip 展示完整名称
  .nav-link .nav-item-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
