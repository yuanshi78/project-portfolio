import { computed, ref } from 'vue'

// 👉 内容正文字号调节：放大 / 放小 两个独立按钮，三档之间步进，写入 localStorage，刷新后保留。
//
// 只影响「内容正文」类样式——这些样式用 calc(基准 * var(--content-font-scale, 1))，
// 菜单、标题、卡片等不使用该变量，因此放大时不会破坏布局。

const STORAGE_KEY = 'content-font-scale'

export const FONT_LEVELS = [
  { value: 1, label: '标准' },
  { value: 1.15, label: '大' },
  { value: 1.3, label: '特大' },
]

const readIndex = () => {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY))
    const i = FONT_LEVELS.findIndex(l => l.value === saved)

    return i === -1 ? 0 : i
  } catch {
    return 0
  }
}

const index = ref(readIndex())

const apply = () => {
  document.documentElement.style.setProperty('--content-font-scale', String(FONT_LEVELS[index.value].value))
}

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, String(FONT_LEVELS[index.value].value))
  } catch {
    // localStorage 不可用时忽略，仅本次会话生效
  }
}

// 模块加载即应用，避免首屏闪烁（纯客户端渲染，document 一定存在）
apply()

export function useFontScale() {
  const increase = () => {
    if (index.value >= FONT_LEVELS.length - 1)
      return
    index.value++
    persist()
    apply()
  }

  const decrease = () => {
    if (index.value <= 0)
      return
    index.value--
    persist()
    apply()
  }

  return {
    index,
    current: computed(() => FONT_LEVELS[index.value]),
    canIncrease: computed(() => index.value < FONT_LEVELS.length - 1),
    canDecrease: computed(() => index.value > 0),
    increase,
    decrease,
  }
}
