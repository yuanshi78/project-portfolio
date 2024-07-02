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
let isEProjectsOpen = ref(false)
let isIProjectsOpen = ref(false)
watchEffect(() => {
  const path = router.currentRoute.value.path
  switch (path) {
    case '/rainbow/all':
    case '/rainbow/cinema_hall':
    case '/rainbow/smart_operation':
    case '/rainbow/smart_area':
    case '/rainbow/topo_tool':
    case '/rainbow/pharmacy':
      isProjectsOpen.value = true
      isRProjectsOpen.value = true
      isJProjectsOpen.value = false
      isXProjectsOpen.value = false
      isEProjectsOpen.value = false
      isIProjectsOpen.value = false
      break

    case '/jinhe/all':
    case '/jinhe/chemical_plant':
      isProjectsOpen.value = true
      isJProjectsOpen.value = true
      isRProjectsOpen.value = false
      isXProjectsOpen.value = false
      isIProjectsOpen.value = false
      isEProjectsOpen.value = false
      break

    case '/shuzixinxi/all':
    case '/shuzixinxi/book_reader':
    case '/shuzixinxi/dinosaur':
      isProjectsOpen.value = true
      isJProjectsOpen.value = false
      isRProjectsOpen.value = false
      isXProjectsOpen.value = true
      isIProjectsOpen.value = false
      isEProjectsOpen.value = false
      break

    case '/eds/all':
    case '/eds/runway':
      isProjectsOpen.value = true
      isJProjectsOpen.value = false
      isRProjectsOpen.value = false
      isXProjectsOpen.value = false
      isIProjectsOpen.value = false
      isEProjectsOpen.value = true
      break

    case '/iba/all':
    case '/iba/planning_engine':
    case '/iba/adm':
    case '/iba/mie':
    case '/iba/urt':
      isProjectsOpen.value = true
      isJProjectsOpen.value = false
      isRProjectsOpen.value = false
      isXProjectsOpen.value = false
      isIProjectsOpen.value = true
      isEProjectsOpen.value = false
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

  <VerticalNavGroup
    :item="{
        title: 'EDS武汉',
      isOpen: isEProjectsOpen,
      }"
  >
    <VerticalNavLink
      :item="{
        title: '项目综合',
        to: '/eds/all',
      }"
    />
    <VerticalNavLink
      :item="{
        title: 'CO Runway, OnePass',
        to: '/eds/runway',
      }"
    />

  </VerticalNavGroup>

  <VerticalNavGroup
    :item="{
        title: 'IBA白俄罗斯',
      isOpen: isIProjectsOpen,
      }"
  >
    <VerticalNavLink
      :item="{
        title: '项目综合',
        to: '/iba/all',
      }"
    />
    <VerticalNavLink
      :item="{
        title: 'Central Planning Engine',
        to: '/iba/planning_engine',
      }"
    />
    <VerticalNavLink
      :item="{
        title: 'ADM France BA',
        to: '/iba/adm',
      }"
    />
    <VerticalNavLink
      :item="{
        title: 'MIE France',
        to: '/iba/mie',
      }"
    />
    <VerticalNavLink
      :item="{
        title: 'URT Extractors ISD',
        to: '/iba/urt',
      }"
    />
  </VerticalNavGroup>
</template>
