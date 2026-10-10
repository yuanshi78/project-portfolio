<script setup>
// 通用图片画廊：由 JSON 的 images 数组驱动，可在产品/项目卡片等处复用。
// - 第一张（或当前选中的那张）作为封面（按屏幕取 card 变体）。
// - 多于 1 张时提供缩略图切换。
// - 点击封面 / 缩略图 / 灯箱内的图，可放大预览（灯箱，含上一张/下一张、关闭）。
// 图片路径只存相对路径（如 "rainbow/project1.png"），变体由 resolveImage 解析。
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { resolveImage } from '@/utils/image'

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
})

// 👉 无图时的默认占位图（SVG 原图，任意尺寸可用，无需生成变体）
const DEFAULT_COVER = '/images/default-cover.svg'
const hasImages = computed(() => !!(props.images && props.images.length))

const { smAndDown } = useDisplay()

const coverVariant = computed(() => (smAndDown.value ? 'card-mobile' : 'card-pc'))
const zoomVariant = computed(() => (smAndDown.value ? 'zoom-mobile' : 'zoom-pc'))

const active = ref(0)

// 👉 灯箱
const zoomOpen = ref(false)
const zoomIndex = ref(0)
const openZoom = i => {
  zoomIndex.value = i
  zoomOpen.value = true
}
const zoomStep = dir => {
  const n = props.images.length
  if (n)
    zoomIndex.value = (zoomIndex.value + dir + n) % n
}
</script>

<template>
  <div class="img-gallery">
    <!-- 👉 封面（第一张，或当前选中的那张）。.prevent 阻止所在卡片（VCard :to）的路由跳转。 -->
    <div
      v-if="hasImages"
      class="ig-cover"
      @click.prevent.stop="openZoom(active)"
    >
      <VImg
        :src="resolveImage(images[active], coverVariant)"
        aspect-ratio="16/9"
        eager
        class="ig-cover-img"
      >
        <template #placeholder>
          <div class="ig-cover-ph" />
        </template>
      </VImg>
      <div class="ig-zoom-hint">
        <VIcon
          icon="ri-zoom-in-line"
          size="16"
        />
      </div>
    </div>

    <!-- 👉 无图：默认占位图（不可点击放大，无缩略图 / 灯箱） -->
    <div
      v-else
      class="ig-cover ig-cover--default"
    >
      <img
        :src="DEFAULT_COVER"
        alt="暂无图片"
        class="ig-default-img"
      >
    </div>

    <!-- 👉 缩略图（多于 1 张时） -->
    <div
      v-if="hasImages && images.length > 1"
      class="ig-thumbs"
    >
      <button
        v-for="(img, i) in images"
        :key="i"
        type="button"
        class="ig-thumb"
        :class="{ active: i === active }"
        :aria-label="`第 ${i + 1} 张`"
        @click.prevent.stop="active = i"
      >
        <img
          :src="resolveImage(img, 'thumb')"
          alt=""
        >
      </button>
    </div>

    <!-- 👉 灯箱 -->
    <VDialog
      v-if="hasImages"
      v-model="zoomOpen"
      class="ig-lightbox"
      :fullscreen="smAndDown"
      max-width="92vw"
    >
      <div
        class="ig-zoom-wrap"
        @click="zoomOpen = false"
      >
        <img
          :src="resolveImage(images[zoomIndex], zoomVariant)"
          alt="放大预览"
          class="ig-zoom-img"
        >
        <button
          v-if="images.length > 1"
          class="ig-nav prev"
          type="button"
          aria-label="上一张"
          @click.prevent.stop="zoomStep(-1)"
        >
          <VIcon icon="ri-arrow-left-line" />
        </button>
        <button
          v-if="images.length > 1"
          class="ig-nav next"
          type="button"
          aria-label="下一张"
          @click.prevent.stop="zoomStep(1)"
        >
          <VIcon icon="ri-arrow-right-line" />
        </button>
        <VBtn
          class="ig-close"
          icon
          variant="flat"
          color="white"
          @click.stop="zoomOpen = false"
        >
          <VIcon icon="ri-close-line" />
        </VBtn>
      </div>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
// 图片区（封面 / 灯箱共用）：固定深色衬底，与详情页轮播保持一致
$backdrop: #312d4b;

.ig-cover {
  position: relative;
  cursor: zoom-in;
  background: $backdrop;
  overflow: hidden;

  .ig-cover-img :deep(img) {
    object-fit: contain;
    display: block;
  }

  .ig-cover-ph {
    width: 100%;
    height: 100%;
    background: $backdrop;
  }

  .ig-zoom-hint {
    position: absolute;
    right: 10px;
    bottom: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: rgb(0 0 0 / 50%);
    color: #fff;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  &:hover .ig-zoom-hint {
    opacity: 1;
  }
}

// 👉 无图默认占位：与真实封面同比例，平铺铺满
.ig-cover--default {
  cursor: default;

  .ig-default-img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
  }
}

.ig-thumbs {
  display: flex;
  gap: 6px;
  padding: 8px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  .ig-thumb {
    flex: 0 0 auto;
    width: 56px;
    height: 32px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 6px;
    overflow: hidden;
    background: $backdrop;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s ease, border-color 0.2s ease;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    &.active {
      opacity: 1;
      border-color: rgb(var(--v-theme-primary));
    }

    &:hover {
      opacity: 1;
    }
  }
}

.ig-zoom-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;

  .ig-zoom-img {
    max-width: 100%;
    max-height: 88vh;
    object-fit: contain;
    display: block;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgb(0 0 0 / 60%);
  }
}

.ig-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 999px;
  color: #fff;
  background: rgb(0 0 0 / 45%);
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgb(0 0 0 / 65%);
  }

  &.prev { left: clamp(6px, 2vw, 16px); }
  &.next { right: clamp(6px, 2vw, 16px); }
}

.ig-close {
  position: absolute !important;
  top: 16px;
  right: 16px;
  background: rgb(0 0 0 / 55%) !important;
  color: #fff !important;
}

// 👉 灯箱背景：与详情页一致的固定深色（覆盖 Vuetify 默认半透明 scrim，避免页面透出）
.ig-lightbox :deep(.v-overlay__scrim) {
  background: $backdrop !important;
  opacity: 1 !important;
}
</style>
