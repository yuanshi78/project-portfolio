<script setup>
import { useRouter } from 'vue-router'
import ImageGallery from '@/components/ImageGallery.vue'
import { visibleItems } from '@/utils/visibility'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

// 👉 卡片整体可点击进入详情（点击图片不再放大，而是跳转到对应路由）
const router = useRouter()
const goTo = to => { if (to) router.push(to) }
</script>

<template>
  <div>
    <div class="section-head text-h5 font-weight-bold mb-3">
      {{ data.title }}
    </div>
    <VRow>
      <VCol
        v-for="(job, i) in visibleItems(data.items)"
        :key="i"
        class="d-flex"
        cols="12"
        lg="4"
        md="4"
      >
        <VCard
          class="flex-1-1 work-card"
          rounded="lg"
          elevation="1"
          @click="goTo(job.to)"
        >
          <ImageGallery
            :images="job.images"
            :navigate-to="job.to"
          />
          <VCardItem>
            <VCardTitle>
              <RouterLink
                :to="job.to"
                class="text-decoration-none"
              >{{ job.title }}</RouterLink>
            </VCardTitle>
            <div
              v-if="job.subtitle"
              class="d-flex flex-wrap align-center mt-1"
            >
              <span class="text-medium-emphasis text-body-2 me-2">{{ job.subtitle.split(/[，,]/)[0].trim() }}</span>
              <VChip
                v-if="/[，,]/.test(job.subtitle)"
                size="x-small"
                variant="tonal"
                label
                class="location-chip"
              >
                {{ job.subtitle.split(/[，,]/).slice(1).join('，').trim() }}
              </VChip>
            </div>
          </VCardItem>
          <VCardText class="project-text">
            {{ job.text }}
            <RouterLink
              :to="job.to"
              class="text-decoration-none d-inline-flex align-center mt-2 text-primary"
            >
              <span>{{ $t('viewDetail') }}</span>
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

.work-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 28px -14px rgba(0, 0, 0, 0.45);
  }
}

// 👉 基准 15px，乘 --content-font-scale（顶栏字号按钮控制，默认 1）
.project-text {
  font-size: calc(0.9375rem * var(--content-font-scale, 1));
  line-height: 1.7;
}

// 👉 公司名等标题允许换行，避免长名被单行省略截断
.work-card :deep(.v-card-title) {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  line-height: 1.4;
}
</style>
