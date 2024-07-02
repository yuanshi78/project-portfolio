<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import avatar2 from '@images/avatars/avatar-2.png'
import avatar3 from '@images/avatars/avatar-3.png'
import avatar4 from '@images/avatars/avatar-4.png'

import { eds } from './projects.js'

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
    <VCol
      v-for="prj in eds"
      cols="12"
      md="4"
      sm="6"
    >
      <VHover>
        <template #default="{ isHovering, props }">
          <VCard :target="prj.isNewWindow ? '_blank' : ''" :to="prj.to" v-bind="props">
            <VImg
              :src="prj.image"
              class="projects_image"
              cover
            />

            <VCardItem>
              <div class="d-flex justify-lg-space-between justify-center flex-wrap">
                <VCardTitle>{{ prj.name }}</VCardTitle>
                <div class="tags v-col-12 v-col-lg-6 ml-lg-3 d-flex justify-center justify-lg-start flex-wrap">
                  <VBadge
                    v-for="(tag, i) in prj.tags"
                    :key="i"
                    :content="tag"
                    class="mb-2"
                    color="primary"
                    inline
                    rounded="pill"
                  />
                </div>
              </div>


            </VCardItem>

            <VExpandTransition>
              <div v-show="isHovering">
                <VDivider />
                <VCardText>
                  {{ prj.description }}
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
:deep(.v-badge span) {
  font-size: .6rem !important;
}

.tags {
  margin-top: -.3rem;
}

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

.projects {
  &_image {
    height: 26vh;
  }
}
</style>
