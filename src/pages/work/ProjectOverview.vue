<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getCompany, getProjects } from '@/data/companies'
import ProjectList from '@/components/ProjectList.vue'

const route = useRoute()
const category = computed(() => route.params.category)
const companyInfo = computed(() => getCompany(category.value))
const company = computed(() => companyInfo.value?.company ?? '')
const projects = computed(() => getProjects(category.value))
</script>

<template>
  <div class="overview-page">
    <!-- 👉 企业头部 -->
    <div class="overview-header d-flex align-center flex-wrap mb-8">
      <VAvatar
        :icon="companyInfo?.icon || 'ri-building-line'"
        color="primary"
        variant="tonal"
        size="64"
        rounded="lg"
        class="me-4 overview-avatar"
      />
      <div class="me-auto overview-heading">
        <p class="text-overline text-medium-emphasis mb-1 ls-1">
          项目综合
        </p>
        <h1 class="text-h4 text-lg-h3 font-weight-bold overview-title">
          {{ company }}
        </h1>
      </div>
      <VChip
        v-if="projects.length"
        size="small"
        variant="tonal"
        prepend-icon="ri-folders-line"
        class="overview-count mt-1"
      >
        {{ projects.length }} 个项目
      </VChip>
    </div>

    <ProjectList :projects="projects" />
  </div>
</template>

<style lang="scss" scoped>
.overview-avatar {
  box-shadow: 0 10px 24px -10px rgba(0, 0, 0, 0.45);
}

.overview-heading {
  min-width: 0;
}

.overview-title {
  line-height: 1.15;
  letter-spacing: -0.5px;
}

.ls-1 {
  letter-spacing: 1px;
}

.overview-count {
  align-self: flex-start;
}
</style>
