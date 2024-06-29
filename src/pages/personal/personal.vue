<script setup>
import abs from '@images/pages/abstract.jpg'
import me from '@images/avatars/me.png'
import Profile from './profile.vue'
import Projects from './projects.vue'
import { ref, watch } from 'vue'

let selectedPage = ref('personal')
selectedPage.value = 0
watch(selectedPage, (value) => {
  console.log(value)
})
</script>

<template>
  <div class="">
    <VRow>
      <VCol
        cols="12"
        md="12"
        sm="12"
      >
        <VCard>
          <VImg :src="abs" cover style="max-height: 250px; min-height: 125px;" />

          <VCardText class="d-flex align-bottom flex-sm-row flex-column justify-left gap-x-6">
            <div class="d-flex h-0">
              <!-- User Avatar -->
              <VAvatar
                :image="me"
                class="avatar-center"
                size="150px"
              />
            </div>


            <!-- Title, Subtitle & Action Button -->
            <div class="user-profile-info w-100 mt-16 pt-6 pt-sm-0 mt-sm-0">
              <div class="me-2 mb-2">
                <VCardTitle class="text-h4 pa-0">
                  Aliaksandr Kuzmiankou 元实
                </VCardTitle>
                <v-list class="d-flex flex-wrap" density="compact">
                  <v-list-item
                    color="primary"
                    style="padding-left: 0"
                    value="1"
                  >
                    <template v-slot:prepend>
                      <v-icon icon="ri-computer-line"></v-icon>
                    </template>

                    <v-list-item-title>web前端工程师</v-list-item-title>
                  </v-list-item>

                  <v-list-item
                    color="primary"
                    value="1"
                  >
                    <template v-slot:prepend>
                      <v-icon icon="ri-user-location-line"></v-icon>
                    </template>

                    <v-list-item-title>西安</v-list-item-title>
                  </v-list-item>

                  <v-list-item
                    color="primary"
                    style="padding-left: 0"
                    value="1"
                  >
                    <template v-slot:prepend>
                      <v-icon icon="ri-global-line"></v-icon>
                    </template>

                    <v-list-item-title>白俄罗斯</v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
            </div>

          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <VCol
        cols="12"
        md="12"
        sm="12"
      >
        <v-slide-group v-model="selectedPage">
          <v-slide-group-item
            v-slot="{ isSelected, toggle }"
          >
            <v-btn
              :color="isSelected ? 'primary' : null"
              :variant="isSelected ? 'elevated' : 'test'"
              class="ma-2"
              prepend-icon="ri-user-fill"
              @click="toggle"
            >
              个人信息
            </v-btn>
          </v-slide-group-item>
          <v-slide-group-item
            v-slot="{ isSelected, toggle }"
          >
            <v-btn
              :color="isSelected ? 'primary' : null"
              :variant="isSelected ? 'elevated' : 'test'"
              class="ma-2"
              prepend-icon="ri-folders-fill"
              @click="toggle"
            >
              项目
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </VCol>
    </VRow>

    <Profile v-if="selectedPage === 0" />
    <Projects v-if="selectedPage === 1" />
  </div>
</template>

<style lang="scss" scoped>
.avatar-center {
  border-radius: 10px;
  border: 5px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-surface)) !important;
  inset-block-start: -3rem;
}
</style>
