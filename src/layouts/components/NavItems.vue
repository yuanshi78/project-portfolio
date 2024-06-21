<script setup>
import VerticalNavGroup from '@layouts/components/VerticalNavGroup.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'
import { ref, watchEffect, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
let isProjectsOpen = ref(false)
watchEffect(() => {
  const path = router.currentRoute.value.path
  switch (path) {
    case '/rainbow/all':
      isProjectsOpen.value = true
      break
    case '/rainbow/cinema_hall':
      isProjectsOpen.value = true
      break
    case '/rainbow/smart_operation':
      isProjectsOpen.value = true
      break
    case '/rainbow/smart_area':
      isProjectsOpen.value = true
      break
    case '/rainbow/topo_tool':
      isProjectsOpen.value = true
      break
    default:
      isProjectsOpen.value = false
  }
})
</script>

<template>
  <VerticalNavLink
    :item="{
        title: '自我介绍',
        to: '/person',
        icon: 'ri-home-smile-line'
      }"
  />
  <!-- 👉 Dashboards -->
  <VerticalNavGroup
    :item="{
      title: '项目',
      icon: 'ri-folder-line',
      isOpen: isProjectsOpen,
    }"
  >
    <VerticalNavGroup
      :item="{
        title: '西安睿博智能股份有限公司',
      isOpen: isProjectsOpen,
      }"
    >
      <VerticalNavLink
        :item="{
        title: '所有项目',
        to: '/rainbow/all',
      }"
      />
      <VerticalNavLink
        :item="{
        title: '可视化运维系统',
        to: '/rainbow/smart_operation',
      }"
      />
      <VerticalNavLink
        :item="{
        title: '票务管理系统',
        to: '/rainbow/cinema_hall',
      }"
      />
      <VerticalNavLink
        :item="{
        title: '智慧区域',
        to: '/rainbow/smart_area',
      }"
      />
      <VerticalNavLink
        :item="{
        title: '拓扑图工具',
        to: '/rainbow/topo_tool',
      }"
      />


    </VerticalNavGroup>
  </VerticalNavGroup>
</template>
