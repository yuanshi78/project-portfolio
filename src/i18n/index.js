// 👉 轻量国际化核心（无第三方依赖）
//   - locale：当前语言（响应式 ref，持久化到 localStorage）
//   - locales：可选语言列表（含国旗 emoji + 名称）
//   - t(key, fallback?)：取 UI 文案（站点自带标题等，见 src/lang/*.json）
//   - L(value)：解析数据字段——若字段是 { zh, ru, en } 对象则取当前语言，否则原样返回
//   - localize(node)：把整棵数据树包成「按当前语言自动解析」的代理（数组会转成代理元素的普通数组）

import { ref } from 'vue'
import zh from '@/lang/zh.json'
import ru from '@/lang/ru.json'
import en from '@/lang/en.json'
import be from '@/lang/be.json'

const messages = { zh, ru, en, be }
const STORAGE_KEY = 'site-locale'

export const locales = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'be', label: 'Беларуская', flag: '🇧🇾' },
]

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
export const locale = ref(messages[saved] ? saved : 'zh')

export function setLocale(code) {
  if (!messages[code]) return
  locale.value = code
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, code)
  if (typeof document !== 'undefined') document.documentElement.lang = code
}

// 初始化 <html lang>
if (typeof document !== 'undefined') document.documentElement.lang = locale.value

// 👉 俄语 / 白俄语复数索引：返回 0(one) / 1(few) / 2(many)
// 规则：n%10=1 且 n%100≠11 → one；n%10∈2..4 且 n%100∉12..14 → few；其它 → many
const pluralIndex = n => {
  const a = Math.abs(n) % 100
  if (a >= 11 && a <= 14) return 2
  const b = a % 10
  if (b === 1) return 0
  if (b >= 2 && b <= 4) return 1
  return 2
}

// 👉 UI 文案
// 第二个参数支持两种用法：
//   - 对象：占位符插值（与 vue-i18n 一致），如 t('projectsCount', { n: 5 }) → "5 个项目"
//   - 字符串 / 其它：旧版 fallback 兜底
//
// 俄/白俄复数：当 locale 为 ru/be 且字符串为 "one|few|many" 三段、且 n 是数字时，
// 按 n 自动取形（如 t('projectsCount', { n: 1 }) → "1 проект" / "1 праект"）
export function t(key, paramsOrFallback) {
  const dict = messages[locale.value] ?? messages.zh
  const fallback = typeof paramsOrFallback === 'string' ? paramsOrFallback : undefined
  const params = paramsOrFallback && typeof paramsOrFallback === 'object' && !Array.isArray(paramsOrFallback)
    ? paramsOrFallback
    : null
  let str = dict[key] ?? messages.zh[key] ?? (fallback ?? key)
  if (params && typeof params.n === 'number' && (locale.value === 'ru' || locale.value === 'be') && str.includes('|')) {
    const parts = str.split('|')
    if (parts.length === 3) str = parts[pluralIndex(params.n)]
  }
  if (params) {
    str = str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`))
  }
  return str
}

// 👉 数据字段解析：{ zh, ru, en } → 当前语言；其它原样返回
export function L(value) {
  if (
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && ('zh' in value || 'ru' in value || 'en' in value)
  ) {
    // 白俄罗斯语（be）若缺失，回退到俄语（ru）—— 俄白互通，对白俄读者可读
    return value[locale.value] ?? value.ru ?? value.en ?? value.zh ?? ''
  }
  return value
}

// 👉 把整棵数据树包成代理：访问 { zh, ru, en } 字段时自动按 locale 解析（响应式，切换语言即更新）
export function localize(node, cache = new WeakMap()) {
  if (node === null || typeof node !== 'object') return node
  if (cache.has(node)) return cache.get(node)

  // 数组：转成「每个元素都已 localize」的普通数组（native forEach/map 会绕过代理直接取元素，
  // 故这里提前把元素包好，保证 v-for / forEach 拿到的是已解析代理）
  if (Array.isArray(node)) {
    const arr = node.map(el => localize(el, cache))
    cache.set(node, arr)
    return arr
  }

  // 已是 { zh, ru, en } 叶子：不包代理，直接返回（由上层 get 解析）
  if ('zh' in node || 'ru' in node || 'en' in node) return node

  const proxy = new Proxy(node, {
    get(target, key, receiver) {
      // 避免 Vue / 工具链误判代理为 thenable / 迭代器
      if (typeof key === 'symbol') return Reflect.get(target, key, receiver)

      const val = Reflect.get(target, key, receiver)

      // 函数（如数组方法、vue 内部）原样返回
      if (typeof val === 'function') return val

      // 本地化叶子
      if (
        val
        && typeof val === 'object'
        && !Array.isArray(val)
        && ('zh' in val || 'ru' in val || 'en' in val)
      ) {
        // 白俄罗斯语（be）若缺失，回退到俄语（ru）—— 俄白互通，对白俄读者可读
        return val[locale.value] ?? val.ru ?? val.en ?? val.zh ?? ''
      }

      // 嵌套对象 / 数组：递归包代理
      if (val && typeof val === 'object') return localize(val, cache)

      return val
    },
    has(target, key) {
      return Reflect.has(target, key)
    },
    ownKeys(target) {
      return Reflect.ownKeys(target)
    },
    getOwnPropertyDescriptor(target, key) {
      return Reflect.getOwnPropertyDescriptor(target, key)
    },
  })
  cache.set(node, proxy)
  return proxy
}

export function useI18n() {
  return { locale, locales, setLocale, t, L, localize }
}
