<script setup>
import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

let isOpen = ref(false)
watchEffect(() => {
  isOpen.value = props.item.isOpen !== undefined ? props.item.isOpen : false
})

// 👉 分组名称（公司名）过长时截断，用 tooltip 展示完整名称
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
    :class="isOpen && 'open'"
    class="nav-group"
  >
    <div
      class="nav-group-label"
      @click="isOpen = !isOpen"
    >
      <VIcon
        :icon="item.icon || 'ri-checkbox-blank-circle-line'"
        class="nav-item-icon"
      />
      <span
        ref="titleEl"
        class="nav-item-title"
      >{{ item.title }}
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
        :class="item.badgeClass"
        class="nav-item-badge"
      >
        {{ item.badgeContent }}
      </span>
      <VIcon
        class="nav-group-arrow"
        icon="ri-arrow-right-s-line"
      />
    </div>
    <div class="nav-group-children-wrapper">
      <ul class="nav-group-children">
        <slot />
      </ul>
    </div>
  </li>
</template>

<style lang="scss">
.layout-vertical-nav {
  .nav-group {
    &-label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    // 过长名称截断为单行，配合上面的 tooltip 展示完整名称
    .nav-item-title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nav-group-children-wrapper {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.3s ease-in-out;

      .nav-group-children {
        overflow: hidden;
      }
    }

    &.open {
      .nav-group-children-wrapper {
        grid-template-rows: 1fr;
      }
    }
  }
}
</style>
