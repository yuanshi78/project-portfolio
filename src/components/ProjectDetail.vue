<script setup>
// 项目详情页：由 src/data/details/ 下按单位拆分的 json 驱动渲染。
// 路由 /project/:category/:slug 对应 JSON 中的一条记录。
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import details from '@/data/details'
import { getCompany } from '@/data/companies'
import { parseEmphasis } from '@/utils/emphasis'
import { visibleItems } from '@/utils/visibility'
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

// 章节可在详情 JSON 中标记 visibility: "hidden" 隐藏（完全不渲染）
const visibleSections = computed(() => visibleItems(detail.value?.sections ?? []))

// 点击轮播图片放大预览（灯箱）
const { smAndDown } = useDisplay()
const zoomSrc = ref('')
const zoomOpen = ref(false)
const zoomLoaded = ref(false)
const openZoom = img => {
  zoomSrc.value = resolveImage(img)
  zoomLoaded.value = false
  zoomOpen.value = true
}

// 👉 图集：3D 多面柱体轮播。面数 = 图片数，每面一张图，切换即把柱体旋转到对应面。
const activeIndex = ref(0)
const stageRef = ref(null)
const stageW = ref(0)
let ro = null

const faceCount = computed(() => detail.value?.images?.length ?? 0)
const anglePer = computed(() => (faceCount.value ? 360 / faceCount.value : 0))
// 柱体半径：让每张面刚好拼成闭合 N 棱柱（faceWidth/2 / tan(π/N)）。N<2 时无意义，半径取 0。
const radius = computed(() => {
  const n = faceCount.value
  if (n < 2)
    return 0
  return (stageW.value / 2) / Math.tan(Math.PI / n)
})
// 静态居中 wrapper：把柱体中心后移一个半径，让正面停在观察者平面（无过渡，避免过渡干扰旋转）
const wrapperTransform = computed(() => `translateZ(${-radius.value}px)`)
// 柱体旋转：只绕 Y 轴转到目标面（纯 rotateY）。
// 注意：在 preserve-3d 元素上用 CSS transition 旋转 3D 会因浏览器怪癖失效，
// 故用 requestAnimationFrame 自行插值，保证平滑且可靠。
const targetAngle = computed(() => -activeIndex.value * anglePer.value)
const currentAngle = ref(0)
let rafId = null

const animateTo = to => {
  cancelAnimationFrame(rafId)
  const from = currentAngle.value
  // 取最短旋转路径（≤180°），保证前后切换都朝自然方向转
  const diff = (((to - from) % 360) + 540) % 360 - 180
  const target = from + diff
  const dur = 900
  const start = performance.now()
  const easeOutCubic = t => 1 - (1 - t) ** 3
  const step = now => {
    const t = Math.min(1, (now - start) / dur)
    currentAngle.value = from + (target - from) * easeOutCubic(t)
    if (t < 1)
      rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
}

watch(targetAngle, v => animateTo(v))

const polyTransform = computed(() => `rotateY(${currentAngle.value}deg)`)
const faceStyle = i => ({
  transform: `rotateY(${i * anglePer.value}deg) translateZ(${radius.value}px)`,
})
const go = dir => {
  const n = faceCount.value
  if (!n)
    return
  activeIndex.value = (activeIndex.value + dir + n) % n
}

onMounted(() => {
  currentAngle.value = targetAngle.value
  const measure = () => {
    if (stageRef.value)
      stageW.value = stageRef.value.clientWidth
  }
  measure()
  if ('ResizeObserver' in window && stageRef.value) {
    ro = new ResizeObserver(measure)
    ro.observe(stageRef.value)
  }
})
onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  ro?.disconnect()
})
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

    <!-- 👉 图集：3D 多面柱体，面数 = 图片数，切换即旋转到对应面 -->
    <div
      v-if="detail.images && detail.images.length"
      class="detail-carousel rounded mb-8"
    >
      <div
        ref="stageRef"
        class="carousel-3d-stage"
        @click="openZoom(detail.images[activeIndex])"
      >
        <div
          class="carousel-3d-wrapper"
          :style="{ transform: wrapperTransform }"
        >
          <div
            class="carousel-3d-poly"
            :style="{ transform: polyTransform }"
          >
            <div
              v-for="(img, i) in detail.images"
              :key="i"
              class="carousel-3d-face"
              :style="faceStyle(i)"
              @click.stop="openZoom(img)"
          >
            <v-img
              :src="resolveImage(img)"
              height="100%"
              cover
            />
          </div>
        </div>
        </div>

        <!-- 左右切换 -->
        <button
          class="carousel-nav prev"
          type="button"
          aria-label="上一张"
          @click.stop="go(-1)"
        >
          <VIcon icon="ri-arrow-left-line" />
        </button>
        <button
          class="carousel-nav next"
          type="button"
          aria-label="下一张"
          @click.stop="go(1)"
        >
          <VIcon icon="ri-arrow-right-line" />
        </button>

        <!-- 指示点：PC 显示为缩略图，移动端显示为小圆点 -->
        <div class="carousel-dots">
          <button
            v-for="(img, i) in detail.images"
            :key="i"
            type="button"
            :class="{ active: i === activeIndex }"
            :aria-label="`第 ${i + 1} 张`"
            @click.stop="activeIndex = i"
          >
            <img
              :src="resolveImage(img)"
              alt=""
              class="carousel-dot-thumb"
            >
          </button>
        </div>

        <div class="zoom-hint">
          <VIcon
            icon="ri-zoom-in-line"
            size="16"
          />
          <span>点击放大</span>
        </div>
      </div>
    </div>

    <!-- 👉 章节（每节独立成卡） -->
    <section
      v-for="(sec, i) in visibleSections"
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
              <!-- 显式包裹一层，才能稳定控制字号（Vuetify 内部容器类名不保证） -->
              <span class="detail-list-text">
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
              </span>
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
        class="d-flex align-center justify-center position-relative"
        style="padding: 8px;"
        @click="zoomOpen = false"
      >
        <img
          :src="zoomSrc"
          alt="放大预览"
          style="max-width: 100%; max-height: 88vh; object-fit: contain; display: block; border-radius: 12px; box-shadow: 0 10px 40px rgb(0 0 0 / 60%);"
          @load="zoomLoaded = true"
        >
        <VProgressCircular
          v-if="!zoomLoaded"
          indeterminate
          color="primary"
          size="48"
          width="4"
          style="position: absolute;"
        />
        <VBtn
          class="zoom-close"
          icon
          variant="flat"
          color="white"
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

  // 👉 3D 多面柱体轮播：stage 提供透视，poly 在 3D 空间里旋转，每个 face 是一面（面数 = 图片数）。
  .carousel-3d-stage {
    position: relative;
    width: 100%;
    height: 100%;
    perspective: 1600px;
    cursor: zoom-in;

    // 静态居中层：仅把柱体中心后移一个半径，让正面停在观察者平面（无过渡，避免过渡干扰旋转）
    .carousel-3d-wrapper {
      position: absolute;
      inset: 0;
      transform-style: preserve-3d;
    }

    .carousel-3d-poly {
      position: absolute;
      inset: 0;
      transform-style: preserve-3d;
      // 旋转由 JS(rAF) 插值驱动，故不在此用 CSS transition（preserve-3d 下 transition 旋转会失效）
    }
  }

  .carousel-3d-face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    // 背对观察者的面（柱体背面）不渲染，避免穿透看到镜像图
    backface-visibility: hidden;
    overflow: hidden;
    background: rgb(var(--v-theme-surface));
    box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), var(--v-border-opacity));

    :deep(img) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      // 轻微推近，让画面更有呼吸感
      animation: kenburns 12s ease-out infinite alternate;
    }
  }

  @keyframes kenburns {
    from { transform: scale(1.02); }
    to   { transform: scale(1.1) translate(-1%, -1%); }
  }

  // 👉 左右切换按钮：还原最初 v-carousel 箭头的观感（悬停浮现的浅色圆钮 + 暗色衬底）
  .carousel-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 3;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    // 与最初 v-carousel 箭头一致的自适应尺寸
    inline-size: clamp(34px, 4.5vw, 48px);
    block-size: clamp(34px, 4.5vw, 48px);
    border: none;
    border-radius: 999px;
    color: #fff;
    background: rgb(0 0 0 / 45%);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.25s ease, background 0.2s ease, transform 0.2s ease;

    .v-icon {
      block-size: clamp(18px, 2.6vw, 26px);
      inline-size: clamp(18px, 2.6vw, 26px);
      font-size: clamp(18px, 2.6vw, 26px);
    }

    &:hover {
      background: rgb(0 0 0 / 65%);
    }

    &:active {
      transform: translateY(-50%) scale(0.94);
    }
  }

  .carousel-nav.prev { left: clamp(6px, 2vw, 16px); }
  .carousel-nav.next { right: clamp(6px, 2vw, 16px); }

  .carousel-3d-stage:hover .carousel-nav { opacity: 1; }

  // 👉 底部指示点：移动端为小圆点；PC 改为图片缩略图（见下方媒体查询）
  .carousel-dots {
    position: absolute;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    bottom: clamp(6px, 1.5vw, 14px);
    z-index: 3;
    width: fit-content;
    max-width: 92%;
    height: auto;
    display: flex;
    gap: clamp(5px, 1vw, 9px);
    padding: clamp(4px, 0.8vw, 7px) clamp(8px, 1.8vw, 14px);
    background: rgb(0 0 0 / 55%);
    border-radius: 999px;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    button {
      // 默认（移动端）：小圆点
      position: relative;
      inline-size: clamp(6px, 1.4vw, 10px);
      block-size: clamp(6px, 1.4vw, 10px);
      min-width: 0;
      min-height: 0;
      padding: 0;
      border: none;
      border-radius: 999px;
      background: #fff;
      opacity: 0.7;
      cursor: pointer;
      flex: 0 0 auto;
      transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease, outline-color 0.2s ease;

      .carousel-dot-thumb {
        display: none; // 移动端不显示缩略图
      }
    }

    button.active {
      background: rgb(var(--v-theme-primary));
      transform: scale(1.4);
      opacity: 1;
    }
  }

  // 👉 PC（≥960px）：指示点升级为图片缩略图，激活态加主题色描边
  @media (min-width: 960px) {
    .carousel-dots {
      gap: clamp(6px, 0.8vw, 10px);

      button {
        inline-size: 64px;
        block-size: 36px;
        border-radius: 6px;
        background: transparent;
        opacity: 0.55;
        overflow: hidden;
        outline: 2px solid transparent;
        outline-offset: 1px;

        .carousel-dot-thumb {
          display: block;
          inline-size: 100%;
          block-size: 100%;
          object-fit: cover;
          border-radius: 6px;
        }
      }

      button.active {
        opacity: 1;
        transform: none;
        outline-color: rgb(var(--v-theme-primary));
      }
    }
  }
}

.zoom-hint {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(0 0 0 / 50%);
  color: #fff;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.carousel-3d-stage:hover .zoom-hint {
  opacity: 1;
}

.zoom-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: rgb(0 0 0 / 55%) !important;
  color: #fff !important;
  opacity: 0.85;
  transition: opacity 0.2s ease, background 0.2s ease;

  &:hover {
    opacity: 1;
    background: rgb(0 0 0 / 75%) !important;
  }

  .v-icon {
    color: #fff !important;
  }
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

// 👉 基准 15px，乘 --content-font-scale（顶栏字号按钮控制，默认 1）
.section-paragraph {
  font-size: calc(0.9375rem * var(--content-font-scale, 1));
  line-height: 1.75;
}

// 👉 文本内局部强调（JSON 中用 **文字** 标记），紫色高亮
.detail-emphasis {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

// 👉 章节列表项文字：与正文统一 15px（与自我介绍页 item-text 一致）
.detail-list-text {
  display: block;
  font-size: calc(0.9375rem * var(--content-font-scale, 1));
  line-height: 1.6;
}
</style>
