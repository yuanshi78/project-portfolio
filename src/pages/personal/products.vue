<script setup>
// 产品卡片：内容来自 @/data/personal.json 的 products 字段。
// 与「项目」（各公司经历）区分：这里只放自己研发 / 主导的产品。
// 每个产品可在 JSON 中配置 images（相对路径数组），卡片顶部展示封面 + 缩略图 + 灯箱。
import ImageGallery from '@/components/ImageGallery.vue'
import { visibleItems } from '@/utils/visibility'

defineProps({
  data: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div>
    <div class="section-head text-h5 font-weight-bold mb-3">
      {{ data.title }}
    </div>
    <VRow>
      <VCol
        v-for="(item, i) in visibleItems(data.items)"
        :key="item.to || i"
        class="d-flex"
        cols="12"
        lg="4"
        md="4"
      >
        <VCard
          class="flex-1-1 product-card"
          rounded="lg"
          elevation="1"
        >
          <ImageGallery :images="item.images" />
          <VCardItem>
            <VCardTitle>
              <RouterLink
                :to="item.to"
                class="text-decoration-none"
              >{{ item.title }}</RouterLink>
            </VCardTitle>
            <VCardSubtitle v-if="item.subtitle">{{ item.subtitle }}</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VChip
              v-if="item.status"
              size="small"
              variant="tonal"
              label
              :color="item.statusColor"
              class="mb-2"
            >
              {{ item.status }}
            </VChip>
            <div class="product-text">
              {{ item.text }}
            </div>
            <RouterLink
              :to="item.to"
              class="text-decoration-none d-inline-flex align-center mt-2 text-primary"
            >
              <span>查看详情</span>
              <VIcon
                icon="ri-arrow-right-line"
                size="18"
                class="ms-1"
              />
            </RouterLink>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style lang="scss" scoped>
.section-head {
  position: relative;
  padding-left: 14px;
  font-weight: 700;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 4px;
    border-radius: 4px;
    background: rgb(var(--v-theme-primary));
  }
}

.product-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

// 👉 基准 14px，乘 --content-font-scale（顶栏字号按钮控制，默认 1）
.product-text {
  font-size: calc(0.875rem * var(--content-font-scale, 1));
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.85);
}
</style>
