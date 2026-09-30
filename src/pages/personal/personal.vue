<script setup>
import me from '@images/avatars/me.png'
import Profile from './profile.vue'
import Projects from './projects.vue'
import { ref, computed } from 'vue'
import { personal } from '@/data/personal'
import { parseEmphasis } from '@/utils/emphasis'

const data = personal
const selectedPage = ref(0)
const meta = data.meta
const tabs = data.tabs

// 👉 顶部叙述性自我介绍（非列表）：支持多段 \n 与 **强调**
const aboutSegments = computed(() => parseEmphasis(data.about ?? ''))
</script>

<template>
  <div class="detail-content mx-auto">
    <!-- 👉 Hero 个人卡 -->
    <VCard
      class="hero-card mb-6"
      rounded="xl"
      elevation="2"
    >
      <VImg
        :src="data.cover"
        aspect-ratio="3"
        cover
        max-height="200"
      />

      <VCardText class="text-center pt-0">
        <VAvatar
          :image="me"
          class="avatar-center"
          size="120"
        />

        <VCardTitle class="text-h4 text-lg-h3 font-weight-bold pa-0 hero-title mt-2">
          {{ data.name }}
        </VCardTitle>

        <div class="d-flex flex-wrap justify-center mt-3">
          <VChip
            v-for="(m, i) in meta"
            :key="i"
            size="small"
            variant="tonal"
            :prepend-icon="m.icon"
            class="me-1 mb-1"
          >
            {{ m.text }}
          </VChip>
        </div>

      </VCardText>
    </VCard>

    <!-- 👉 关于我（叙述性自我介绍，非列表格式） -->
    <VCard
      v-if="data.about"
      class="mb-6"
      rounded="lg"
      elevation="1"
    >
      <VCardText>
        <div class="section-head text-h5 font-weight-bold mb-2">
          关于我
        </div>
        <p class="about-text">
          <template
            v-for="(seg, si) in aboutSegments"
            :key="si"
          >
            <strong
              v-if="seg.strong"
              class="about-emphasis"
            >{{ seg.text }}</strong>
            <template v-else>{{ seg.text }}</template>
          </template>
        </p>
      </VCardText>
    </VCard>

    <!-- 👉 切换：个人信息 / 项目 -->
    <div class="d-flex flex-wrap mb-6">
      <VBtn
        v-for="t in tabs"
        :key="t.key"
        :color="selectedPage === t.key ? 'primary' : undefined"
        :variant="selectedPage === t.key ? 'flat' : 'tonal'"
        :prepend-icon="t.icon"
        class="me-2"
        @click="selectedPage = t.key"
      >
        {{ t.label }}
      </VBtn>
    </div>

    <Profile v-if="selectedPage === 0" :data="data.profile" :birthday="data.birthday" />
    <Projects v-if="selectedPage === 1" :data="data.experience" />
  </div>
</template>

<style lang="scss" scoped>
.detail-content {
  max-width: 960px;
}

.hero-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.hero-title {
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.avatar-center {
  margin-top: -60px;
  border: 4px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-surface));
  position: relative;
  z-index: 1;
}

.about-text {
  white-space: pre-line;
  line-height: 1.8;
  font-size: 0.95rem;
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.about-emphasis {
  font-weight: 600;
  color: rgb(var(--v-theme-warning));
}
</style>
