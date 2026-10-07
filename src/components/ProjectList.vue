<script setup>
// 项目卡片网格：由数据驱动渲染，内容统一来自 @/data/companies.js（企业-项目目录配置）
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { parseEmphasis } from '@/utils/emphasis'

defineProps({
  projects: {
    type: Array,
    required: true,
  },
})

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

// 👉 无截图项目的占位配色：按 slug 哈希从柔和色板中取色。
// 用 RGB 三元组（而非 hex）是为了能用 rgba() 控制浓度；
// 刻意避开 error/warning 等语义色，避免占位块被误读成“出错 / 警告”。
const placeholderPalette = [
  '140, 87, 255',  // 紫（品牌主色 #8C57FF）
  '77, 138, 255',  // 蓝
  '0, 184, 217',   // 青
  '86, 202, 0',    // 绿
  '255, 159, 67',  // 琥珀
  '255, 107, 157', // 玫红
]

// 稳定哈希：同一项目每次渲染都取到同一颜色（不能用 Math.random，否则刷新就变）
const hashString = str => {
  let h = 0

  for (let i = 0; i < str.length; i++)
    h = (h * 31 + str.charCodeAt(i)) >>> 0

  return h
}

const placeholderStyle = prj => {
  const rgb = placeholderPalette[hashString(prj.slug ?? prj.name ?? '') % placeholderPalette.length]

  return {
    '--ph-rgb': rgb,

    // 深底上需要更高不透明度才看得见
    '--ph-alpha': isDark.value ? 0.14 : 0.07,
  }
}

// 首字：优先取第一个拉丁字母（Aethera → A、URT → U），没有则取第一个字符（产运销 → 产）
const placeholderInitial = prj => {
  const name = (prj.name ?? '').trim()
  const latin = name.match(/[A-Za-z]/)

  return (latin ? latin[0] : name.charAt(0)).toUpperCase()
}
</script>

<template>
  <VRow v-if="projects.length" align="stretch">
    <VCol
      v-for="(prj, i) in projects"
      :key="prj.to || prj.name || i"
      cols="12"
      md="4"
      sm="6"
    >
      <VHover>
        <template #default="{ isHovering, props }">
          <VCard
            :target="prj.isNewWindow ? '_blank' : ''"
            :to="prj.to"
            :elevation="isHovering ? 10 : 2"
            rounded="xl"
            class="h-100 d-flex flex-column project-card"
            v-bind="props"
          >
            <div class="project-media">
              <VImg
                v-if="prj.image"
                :src="prj.image"
                class="projects_image"
                aspect-ratio="1.7778"
                cover
              />

              <!-- 👉 无可用截图的项目：彩色占位块，避免出现空白或破图 -->
              <div
                v-else
                class="project-no-image"
                :style="placeholderStyle(prj)"
              >
                <!-- 大号首字 + 淡色底已足够表达占位含义，无需额外说明文字 -->
                <div class="pni-initial">
                  {{ placeholderInitial(prj) }}
                </div>
              </div>

              <div
                class="project-media__overlay"
                :class="{ 'is-visible': isHovering }"
              >
                <span class="d-inline-flex align-center text-caption font-weight-medium">
                  <VIcon
                    icon="ri-arrow-right-line"
                    size="18"
                    class="me-1"
                  />查看详情
                </span>
              </div>
            </div>

            <VCardItem>
              <VCardTitle class="text-h6 project-title">{{ prj.name }}</VCardTitle>
              <div class="d-flex flex-wrap mt-2">
                <VChip
                  v-for="(tag, ti) in prj.tags"
                  :key="ti"
                  size="small"
                  variant="tonal"
                  label
                  class="me-1 mb-1"
                >
                  {{ tag }}
                </VChip>
              </div>
            </VCardItem>

            <VCardText class="project-desc flex-grow-1">
              <template
                v-for="(seg, si) in parseEmphasis(prj.description)"
                :key="si"
              >
                <strong
                  v-if="seg.strong"
                  class="detail-emphasis"
                >{{ seg.text }}</strong>
                <template v-else>{{ seg.text }}</template>
              </template>
            </VCardText>
          </VCard>
        </template>
      </VHover>
    </VCol>
  </VRow>

  <div
    v-else
    class="text-center text-medium-emphasis py-10"
  >
    <VIcon
      icon="ri-inbox-line"
      size="48"
      class="mb-2"
    />
    <p>暂无项目</p>
  </div>
</template>

<style lang="scss" scoped>
.project-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(var(--v-border-color), 1);
  }
}

.project-media {
  position: relative;
  overflow: hidden;

  // 设为尺寸容器，使占位字号可用 cqi 随「卡片宽度」自适应
  // （卡片在不同断点下是 12/6/4 栏，宽度差别很大，写死 px/rem 会不协调）
  container-type: inline-size;

  .projects_image {
    transition: transform 0.45s ease;
  }

  // 👉 无截图占位：与图片保持同一 16:9 比例，保证卡片高度一致。
  // 浓度刻意压得很低（--ph-alpha），避免占位块比真实截图更抢眼。
  .project-no-image {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    inline-size: 100%;
    aspect-ratio: 1.7778;
    background-color: rgba(var(--ph-rgb), var(--ph-alpha));
    color: rgba(var(--ph-rgb), 0.9);

    // 字号随卡片宽度自适应：18cqi = 卡片宽度的 18%；clamp 兜住极端宽度。
    .pni-initial {
      font-size: clamp(2.5rem, 18cqi, 6rem);
      font-weight: 700;
      line-height: 1;
    }
  }

  &__overlay {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    display: flex;
    justify-content: flex-end;
    padding: 10px 14px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
    color: #fff;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  &__overlay.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.project-card:hover .projects_image {
  transform: scale(1.06);
}

.project-desc {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.875rem;
  line-height: 1.5;
}

// 👉 项目名（JSON 的 name 字段）加粗，层级高于卡片描述
.project-title {
  font-weight: 700;
}

// 👉 文本内局部强调（JSON 中用 **文字** 标记），紫色高亮
.detail-emphasis {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}
</style>
