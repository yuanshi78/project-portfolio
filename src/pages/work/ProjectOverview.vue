<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { getCompany, getProjects } from '@/data/companies'
import ProjectList from '@/components/ProjectList.vue'

const route = useRoute()
const { smAndDown } = useDisplay()
const category = computed(() => route.params.category)
const companyInfo = computed(() => getCompany(category.value))
const company = computed(() => companyInfo.value?.company ?? '')
const projects = computed(() => getProjects(category.value))
</script>

<template>
  <div class="overview-page">
    <!-- 👉 企业头部：包进卡片，与详情页 / 个人页的 hero 卡节奏保持一致 -->
    <VCard
      class="overview-card mb-8"
      rounded="xl"
    >
      <VCardText>
        <div class="overview-header d-flex align-center flex-wrap">
          <VAvatar
            :icon="companyInfo?.icon || 'ri-building-line'"
            color="primary"
            variant="tonal"
            :size="smAndDown ? 48 : 64"
            rounded="lg"
            class="me-4"
          />
          <div class="me-auto overview-heading">
            <p class="text-overline text-medium-emphasis mb-1 ls-1">
              项目综合
            </p>
            <h1 class="text-h6 text-sm-h5 text-md-h4 text-lg-h3 font-weight-bold overview-title">
              {{ company }}
            </h1>
          </div>
          <!-- 手机上强制 chip 另起一行，头像与标题保持同一行 -->
          <div class="w-100 d-sm-none" />
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
      </VCardText>
    </VCard>

    <ProjectList :projects="projects" />
  </div>
</template>

<style lang="scss" scoped>
// 头像阴影由全局新拟态规则（.v-avatar）统一提供，此处不再重复设置
.overview-heading {
  // basis 0：让标题与头像同处一行（否则 flex-wrap 会把整块挤到下一行）
  flex: 1 1 0;
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
