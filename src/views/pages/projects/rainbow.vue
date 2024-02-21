<script setup>
import avatar1 from '@images/avatars/avatar-1.png';
import avatar2 from '@images/avatars/avatar-2.png';
import avatar3 from '@images/avatars/avatar-3.png';
import avatar4 from '@images/avatars/avatar-4.png';

import project1 from '@images/pages/rainbow/project1.png';
import project2 from '@images/pages/rainbow/project2.png';

const avatars = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
]

const isCardDetailsVisible = ref(false)
</script>

<template>
  <VRow>
    <!-- 👉 监控设备大屏 -->
    <VCol
      cols="12"
      sm="6"
      md="4"
    >
      <VHover>
        <template #default="{ isHovering, props }">
          <VCard v-bind="props" href="https://8-hospital-datavis-demo-yuanshi-public-bbc282b11cf332f4ae1e0fd2.gitlab.io/#/screen1" target="_blank">
            <VImg
              :src="project1"
              cover
            />

            <VCardItem>
              <VCardTitle>监控设备大屏</VCardTitle>
            </VCardItem>
         
            <VExpandTransition>
              <div v-show="isHovering">
                <VDivider />
                <VCardText>
                  大屏系统包括三个大屏: 设备运维大屏, 综合态势大屏和智慧安防大屏. 每个大屏展示相关的数据. 大屏中间展示区域地图或监控设备拓扑图 . 地图上展示热力图, 摄像头.可以播放来自摄像头的视频. 拓扑图上展示监控设备结构,设备网络速率和状态. 拓扑图工具用于创建监控设备拓扑图      
                </VCardText>
              </div>
            </VExpandTransition>
          </VCard>
        </template>
      </VHover>
    </VCol>

    <!-- 👉 大屏工具 -->
    <VCol
      cols="12"
      sm="6"
      md="4"
    >
      <VHover>
        <template #default="{ isHovering, props }">
          <VCard v-bind="props" href="https://topo-tool-demo-yuanshi-public-5d3fd63e9725a30883c298fcc611f965b.gitlab.io" target="_blank">
              <VImg
                :src="project2"
                cover
              />

              <VCardItem>
                <VCardTitle>拓扑图工具</VCardTitle>
              </VCardItem>

              <VExpandTransition>
              <div v-show="isHovering">
                <VDivider />
                <VCardText>
                  创建监控设备拓扑图的应用
                </VCardText>
              </div>
            </VExpandTransition>
            </VCard>
        </template>
      </VHover>
    </VCol>   
  </VRow>
</template>

<style lang="scss" scoped>
.avatar-center {
  position: absolute;
  border: 3px solid rgb(var(--v-theme-surface));
  inset-block-start: -2rem;
  inset-inline-start: 1rem;
}

// membership pricing
.member-pricing-bg {
  position: relative;
  background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}

.membership-pricing {
  sup {
    inset-block-start: 9px;
  }
}
</style>
