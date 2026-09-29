<script setup>
import VerticalNavGroup from '@layouts/components/VerticalNavGroup.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'
import { reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { companies } from '@/data/companies'

const router = useRouter()

// 各组展开状态：初始按当前路由展开；导航时自动展开目标分类，
// 但不强制收起其它组，从而允许手动保持多组同时展开。
const openMap = reactive({})
companies.forEach(c => { openMap[c.category] = false })

const categoryOf = path => {
  if (path.startsWith('/project/')) return path.split('/')[2]
  if (path.startsWith('/') && path !== '/') return path.split('/')[1]
  return null
}

const initCat = categoryOf(router.currentRoute.value.path)
if (initCat) openMap[initCat] = true

watch(
  () => router.currentRoute.value.path,
  path => {
    const cat = categoryOf(path)
    if (cat) openMap[cat] = true
  },
)
</script>

<template>
  <VerticalNavLink
    :item="{
      title: '自我介绍',
      to: '/person',
      icon: 'ri-home-smile-line'
    }"
  />
  <VerticalNavGroup
    v-for="c in companies"
    :key="c.category"
    :item="{ title: c.company, icon: c.icon, isOpen: openMap[c.category] }"
  >
    <VerticalNavLink
      :item="{ title: '项目综合', to: `/${c.category}/all`, icon: 'ri-apps-2-line' }"
    />
    <VerticalNavLink
      v-for="p in c.projects"
      :key="p.slug"
      :item="{ title: p.name, to: p.to }"
    />
  </VerticalNavGroup>
</template>
