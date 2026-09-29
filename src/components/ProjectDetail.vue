<script setup>
// 项目详情页：完全由 src/data/details.json 驱动渲染。
// 路由 /project/:category/:slug 对应 JSON 中的一条记录。
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import details from '@/data/details.json'
import { getCompany } from '@/data/companies'
import { parseEmphasis } from '@/utils/emphasis'
import { useDisplay } from 'vuetify'

const route = useRoute()

// 用 computed：在多个详情页之间跳转时复用同一组件实例，需随路由参数变化重新查数据
const detail = computed(
  () => details.find(
    d => d.category === route.params.category && d.slug === route.params.slug,
  ),
)

// 所属企业信息（用于返回「项目综合」入口与标签）
const company = computed(() => getCompany(route.params.category))
const project = computed(() => company.value?.projects.find(p => p.slug === route.params.slug))
const tags = computed(() => project.value?.tags ?? [])

// 图片放在 public/images/pages/ 下，JSON 中只存相对路径
const resolveImage = img => `/images/pages/${img}`

// 点击轮播图片放大预览（灯箱）
const { smAndDown } = useDisplay()
const zoomSrc = ref('')
const zoomOpen = ref(false)
const openZoom = img => {
  zoomSrc.value = resolveImage(img)
  zoomOpen.value = true
}
</script>

<template>
  <div
    v-if="detail"
    class="detail-content mx-auto"
  >
    <!-- 👉 返回所属企业的「项目综合」 -->
    <RouterLink
      v-if="company"
      :to="`/${company.category}/all`"
      class="text-decoration-none d-inline-flex align-center mb-4 text-medium-emphasis back-link"
    >
      <VIcon
        icon="ri-arrow-left-line"
        class="me-1"
      />
      <span>返回 {{ company.company }} 项目综合</span>
    </RouterLink>

    <!-- 👉 Hero 信息卡 -->
    <VCard
      class="hero-card mb-6"
      rounded="xl"
      elevation="2"
    >
      <VCardText>
        <div class="d-flex flex-wrap align-center mb-3">
          <VChip
            v-if="company"
            size="small"
            color="primary"
            variant="tonal"
            prepend-icon="ri-building-2-line"
            class="me-2 mb-1"
          >
            {{ company.company }}
          </VChip>
          <VChip
            v-for="(t, ti) in tags"
            :key="ti"
            size="small"
            variant="tonal"
            class="me-1 mb-1"
          >
            {{ t }}
          </VChip>
        </div>

        <h1 class="text-h4 text-lg-h3 font-weight-bold hero-title">
          {{ detail.title }}
        </h1>

        <div class="d-flex align-center text-medium-emphasis mt-3">
          <VIcon
            icon="ri-calendar-line"
            class="me-1"
            size="18"
          />
          <span>{{ detail.date }}</span>
        </div>
      </VCardText>
    </VCard>

    <!-- 👉 图集 -->
    <div
      v-if="detail.images && detail.images.length"
      class="detail-carousel rounded mb-8"
    >
      <v-carousel
        height="100%"
        hide-delimiter-background
        show-arrows="hover"
      >
        <v-carousel-item
          v-for="(img, i) in detail.images"
          :key="i"
        >
          <div
            class="carousel-item-wrap"
            @click="openZoom(img)"
          >
            <v-img
              :src="resolveImage(img)"
              height="100%"
              cover
            />
            <div class="zoom-hint">
              <VIcon
                icon="ri-zoom-in-line"
                size="16"
              />
              <span>点击放大</span>
            </div>
          </div>
        </v-carousel-item>
      </v-carousel>
    </div>

    <!-- 👉 章节（每节独立成卡） -->
    <section
      v-for="(sec, i) in detail.sections"
      :key="i"
      class="section-block mb-6"
    >
      <div class="section-head text-h5 font-weight-bold mb-3">
        {{ sec.heading }}
      </div>

      <VCard
        class="section-card"
        rounded="lg"
        elevation="1"
      >
        <VCardText>
          <p
            v-for="(p, pi) in (sec.paragraphs || [])"
            :key="`p-${pi}`"
            class="section-paragraph mb-3"
          >
            <template
              v-for="(seg, si) in parseEmphasis(p)"
              :key="si"
            >
              <strong
                v-if="seg.strong"
                class="detail-emphasis"
              >{{ seg.text }}</strong>
              <template v-else>{{ seg.text }}</template>
            </template>
          </p>

          <v-list
            v-if="sec.list && sec.list.length"
            class="pa-0 mb-2"
            density="comfortable"
          >
            <v-list-item
              v-for="(li, lii) in sec.list"
              :key="`l-${lii}`"
              prepend-icon="ri-check-line"
              class="px-0"
            >
              <template
                v-for="(seg, si) in parseEmphasis(li)"
                :key="si"
              >
                <strong
                  v-if="seg.strong"
                  class="detail-emphasis"
                >{{ seg.text }}</strong>
                <template v-else>{{ seg.text }}</template>
              </template>
            </v-list-item>
          </v-list>

          <div
            v-if="sec.links && sec.links.length"
            class="d-flex flex-wrap mt-2"
          >
            <VBtn
              v-for="(lk, lki) in sec.links"
              :key="`lk-${lki}`"
              :href="lk.href"
              target="_blank"
              size="small"
              variant="tonal"
              prepend-icon="ri-external-link-line"
              class="me-2 mb-2"
            >
              {{ lk.text }}
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </section>

    <!-- 👉 图片放大预览（灯箱） -->
    <VDialog
      v-model="zoomOpen"
      :fullscreen="smAndDown"
      max-width="92vw"
      scrim="black"
    >
      <div
        class="d-flex align-center justify-center"
        style="padding: 8px;"
        @click="zoomOpen = false"
      >
        <img
          :src="zoomSrc"
          alt="放大预览"
          style="max-width: 100%; max-height: 88vh; object-fit: contain; display: block; border-radius: 12px; box-shadow: 0 10px 40px rgb(0 0 0 / 60%);"
        >
        <VBtn
          icon
          variant="tonal"
          color="white"
          style="position: fixed; top: 16px; right: 16px; z-index: 10;"
          @click.stop="zoomOpen = false"
        >
          <VIcon icon="ri-close-line" />
        </VBtn>
      </div>
    </VDialog>
  </div>

  <div v-else>
    <p class="text-h5">
      未找到该项目详情
    </p>
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

.detail-carousel {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 12px 32px -12px rgb(0 0 0 / 35%);

  // 图片悬停轻微放大，增加层次感
  :deep(.v-carousel-item img) {
    transition: transform 0.6s ease;
  }

  &:hover :deep(.v-carousel-item img) {
    transform: scale(1.04);
  }

  // 底部控制点：实心暗色圆角胶囊衬底，底部居中
  :deep(.v-carousel__controls) {
    background: rgb(0 0 0 / 60%);
    border-radius: 999px;
    padding: 6px 14px;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    bottom: 14px !important;
    width: fit-content !important;
    max-width: 90% !important;
  }

  // 非激活点：纯白 + 微光晕，更亮更醒目
  :deep(.v-carousel__controls .v-btn--icon) {
    color: #fff;
  }

  :deep(.v-carousel__controls .v-btn__content .v-icon) {
    block-size: 10px !important;
    inline-size: 10px !important;
    filter: drop-shadow(0 0 3px rgb(255 255 255 / 75%));
  }

  // 激活点：主题 primary 色 + 放大 + 更强白光晕，更亮
  :deep(.v-carousel__controls .v-btn--active) {
    color: rgb(var(--v-theme-primary));
  }

  :deep(.v-carousel__controls .v-btn--active .v-btn__content .v-icon) {
    block-size: 15px !important;
    inline-size: 15px !important;
    filter: brightness(1.3) drop-shadow(0 0 6px rgb(255 255 255 / 95%));
  }
}

.carousel-item-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}

.zoom-hint {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(0 0 0 / 50%);
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.carousel-item-wrap:hover .zoom-hint {
  opacity: 1;
}

.section-head {
  position: relative;
  padding-left: 14px;

  // 用主题自带的 primary 作主色点缀（未改动主题色值）
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 4px;
    border-radius: 4px;
    background: rgb(var(--v-theme-primary));
  }
}

.section-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: box-shadow 0.25s ease, transform 0.25s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.section-paragraph {
  font-size: 0.875rem;
  line-height: 1.75;
}

// 👉 文本内局部强调（JSON 中用 **文字** 标记），紫色高亮
.detail-emphasis {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

// 👉 章节正文与列表项统一 14px（与自我介绍页 item-text 一致）
.section-card :deep(.v-list-item__title) {
  font-size: 0.875rem;
  line-height: 1.6;
}
</style>
