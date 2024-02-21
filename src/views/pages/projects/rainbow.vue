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
      <VCard href="https://8-hospital-datavis-demo-yuanshi-public-bbc282b11cf332f4ae1e0fd2.gitlab.io/#/screen1" target="_blank">
        <VImg
          :src="project1"
          cover
        />

        <VCardItem>
          <VCardTitle>监控设备大屏</VCardTitle>
        </VCardItem>

        <VCardText>
          
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Robert Meyer -->
    <VCol
      cols="12"
      sm="6"
      md="4"
    >
    <VCard href="https://topo-tool-demo-yuanshi-public-5d3fd63e9725a30883c298fcc611f965b.gitlab.io" target="_blank">
        <VImg
          :src="project2"
          cover
        />

        <VCardItem>
          <VCardTitle>拓扑图工具</VCardTitle>
        </VCardItem>

        <VCardText>
          
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Popular Uses Of The Internet -->
    <!-- <VCol
      cols="12"
      md="4"
      sm="6"
    >
      <VCard>
        <VImg :src="pages3" />

        <VCardItem>
          <VCardTitle>Popular Uses Of The Internet</VCardTitle>
        </VCardItem>

        <VCardText>
          Although cards can support multiple actions, UI controls, and an overflow menu.
        </VCardText>

        <VCardActions>
          <VBtn @click="isCardDetailsVisible = !isCardDetailsVisible">
            Details
          </VBtn>

          <VSpacer />

          <VBtn
            icon
            size="small"
            @click="isCardDetailsVisible = !isCardDetailsVisible"
          >
            <VIcon :icon="isCardDetailsVisible ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'" />
          </VBtn>
        </VCardActions>

        <VExpandTransition>
          <div v-show="isCardDetailsVisible">
            <VDivider />
            <VCardText>
              I'm a thing. But, like most politicians, he promised more than he could deliver. You won't have time for sleeping, soldier, not with all the bed making you'll be doing. Then we'll go with that data file! Hey, you add a one and two zeros to that or we walk! You're going to do his laundry? I've got to find a way to escape.
            </VCardText>
          </div>
        </VExpandTransition>
      </VCard>
    </VCol> -->
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
