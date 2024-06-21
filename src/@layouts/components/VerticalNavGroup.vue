<script setup>
import { ref, watchEffect } from 'vue'

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
      <span class="nav-item-title">{{ item.title }}</span>
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
