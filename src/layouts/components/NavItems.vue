<script setup>
import VerticalNavGroup from '@layouts/components/VerticalNavGroup.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'
import { ref, watchEffect, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
let isProjectsOpen = ref(false)
let isRProjectsOpen = ref(false)
let isJProjectsOpen = ref(false)
let isXProjectsOpen = ref(false)
watchEffect(() => {
  const path = router.currentRoute.value.path
  switch (path) {
    case '/rainbow/all':
      isProjectsOpen.value = true
      isRProjectsOpen.value = true
      isJProjectsOpen.value = false
      isXProjectsOpen.value = false
      break
    case '/rainbow/cinema_hall':
      isProjectsOpen.value = true
      isRProjectsOpen.value = true
      isJProjectsOpen.value = false
      isXProjectsOpen.value = false
      break
    case '/rainbow/smart_operation':
      isProjectsOpen.value = true
      isRProjectsOpen.value = true
      isJProjectsOpen.value = false
      isXProjectsOpen.value = false
      break
    case '/rainbow/smart_area':
      isProjectsOpen.value = true
      isRProjectsOpen.value = true
      isJProjectsOpen.value = false
      isXProjectsOpen.value = false
      break
    case '/rainbow/topo_tool':
      isProjectsOpen.value = true
      isRProjectsOpen.value = true
      isJProjectsOpen.value = false
      isXProjectsOpen.value = false
      break
    case '/rainbow/pharmacy':
      isProjectsOpen.value = true
      isRProjectsOpen.value = true
      isJProjectsOpen.value = false
      isXProjectsOpen.value = false
      break
    case '/jinhe/all':
      isProjectsOpen.value = true
      isJProjectsOpen.value = true
      isRProjectsOpen.value = false
      isXProjectsOpen.value = false
      break
    case '/jinhe/chemical_plant':
      isProjectsOpen.value = true
      isJProjectsOpen.value = true
      isRProjectsOpen.value = false
      isXProjectsOpen.value = false
      break
    case '/shuzixinxi/all':
      isProjectsOpen.value = true
      isJProjectsOpen.value = false
      isRProjectsOpen.value = false
      isXProjectsOpen.value = true
      break
    case '/shuzixinxi/book_reader':
      isProjectsOpen.value = true
      isJProjectsOpen.value = false
      isRProjectsOpen.value = false
      isXProjectsOpen.value = true
      break
    case '/shuzixinxi/dinosaur':
      isProjectsOpen.value = true
      isJProjectsOpen.value = false
      isRProjectsOpen.value = false
      isXProjectsOpen.value = true
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
  <VerticalNavGroup
    :item="{
        title: '西安睿博智能股份有限公司',
      isOpen: isRProjectsOpen,
      }"
  >
    <VerticalNavLink
      :item="{
        title: '项目综合',
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
        title: '兆益生物生产管理系统',
        to: '/rainbow/pharmacy',
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

  <VerticalNavGroup
    :item="{
        title: '陕西金合信息科技股份有限公司',
      isOpen: isJProjectsOpen,
      }"
  >
    <VerticalNavLink
      :item="{
        title: '项目综合',
        to: '/jinhe/all',
      }"
    />
    <VerticalNavLink
      :item="{
        title: '中煤陕西应急指挥系统',
        to: '/jinhe/chemistry_plant',
      }"
    />
    <VerticalNavLink
      :item="{
        title: '瑞德宝尔智慧矿山',
        to: '/jinhe/ruidebaoer',
      }"
    />
  </VerticalNavGroup>

  <VerticalNavGroup
    :item="{
        title: '陕西数字信息技术有限公司',
      isOpen: isXProjectsOpen,
      }"
  >
    <VerticalNavLink
      :item="{
        title: '项目综合',
        to: '/shuzixinxi/all',
      }"
    />
    <VerticalNavLink
      :item="{
        title: '谷堆书城',
        to: '/shuzixinxi/book_reader',
      }"
    />
    <VerticalNavLink
      :item="{
        title: '魔幻恐龙',
        to: '/shuzixinxi/dinosaur',
      }"
    />
  </VerticalNavGroup>
</template>
