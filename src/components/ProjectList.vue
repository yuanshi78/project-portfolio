<script setup>
// 项目卡片网格：由数据驱动渲染，内容统一来自 @/data/companies.js（企业-项目目录配置）
import { parseEmphasis } from '@/utils/emphasis'

defineProps({
  projects: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <VRow v-if="projects.length" align="stretch">
    <VCol
      v-for="(prj, i) in projects"
      :key="prj.to || prj.name || i"
      cols="12"
      md="4"
      sm="6"
    >
      <VHover>
        <template #default="{ isHovering, props }">
          <VCard
            :target="prj.isNewWindow ? '_blank' : ''"
            :to="prj.to"
            :elevation="isHovering ? 10 : 2"
            rounded="xl"
            class="h-100 d-flex flex-column project-card"
            v-bind="props"
          >
            <div class="project-media">
              <VImg
                :src="prj.image"
                class="projects_image"
                cover
              />
              <div
                class="project-media__overlay"
                :class="{ 'is-visible': isHovering }"
              >
                <span class="d-inline-flex align-center text-caption font-weight-medium">
                  <VIcon
                    icon="ri-arrow-right-line"
                    size="18"
                    class="me-1"
                  />查看详情
                </span>
              </div>
            </div>

            <VCardItem>
              <VCardTitle class="text-h6 project-title">{{ prj.name }}</VCardTitle>
              <div class="d-flex flex-wrap mt-2">
                <VChip
                  v-for="(tag, ti) in prj.tags"
                  :key="ti"
                  size="small"
                  variant="tonal"
                  label
                  class="me-1 mb-1"
                >
                  {{ tag }}
                </VChip>
              </div>
            </VCardItem>

            <VCardText class="project-desc flex-grow-1">
              <template
                v-for="(seg, si) in parseEmphasis(prj.description)"
                :key="si"
              >
                <strong
                  v-if="seg.strong"
                  class="detail-emphasis"
                >{{ seg.text }}</strong>
                <template v-else>{{ seg.text }}</template>
              </template>
            </VCardText>
          </VCard>
        </template>
      </VHover>
    </VCol>
  </VRow>

  <div
    v-else
    class="text-center text-medium-emphasis py-10"
  >
    <VIcon
      icon="ri-inbox-line"
      size="48"
      class="mb-2"
    />
    <p>暂无项目</p>
  </div>
</template>

<style lang="scss" scoped>
.project-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(var(--v-border-color), 1);
  }
}

.project-media {
  position: relative;
  overflow: hidden;

  .projects_image {
    transition: transform 0.45s ease;
  }

  &__overlay {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    display: flex;
    justify-content: flex-end;
    padding: 10px 14px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
    color: #fff;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  &__overlay.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.project-card:hover .projects_image {
  transform: scale(1.06);
}

.project-desc {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.875rem;
  line-height: 1.5;
}

// 👉 项目名（JSON 的 name 字段）加粗，层级高于卡片描述
.project-title {
  font-weight: 700;
}

// 👉 文本内局部强调（JSON 中用 **文字** 标记），紫色高亮
.detail-emphasis {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}
</style>
