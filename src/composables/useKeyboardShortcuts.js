// 全局键盘快捷键：组合键 → 路由（配置见 src/data/shortcuts.json）
//
// combo 写法：修饰键 + 主键，用 "+" 连接，大小写不敏感。
//   修饰键：Ctrl / Control / Alt / Shift / Cmd / Win / Meta
//   主键  ：单个字母 A-Z、单个数字 0-9，或 Tab/Enter/ArrowRight/F1 等特殊键
//   例    ： "Alt+A"  "Ctrl+Alt+K"  "Alt+ArrowRight"
//
// 注意：Alt+Tab、Ctrl+W/T/R/L/N、F5/F11/F12、Ctrl+F/P 等被浏览器/系统占用，
//       无法（或不应）被页面拦截，请改用其它组合。
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import config from '@/data/shortcuts.json'

const shortcuts = config?.shortcuts ?? []

// 修饰键别名 → KeyboardEvent 上的布尔属性名
const MOD = {
  CTRL: 'ctrlKey',
  CONTROL: 'ctrlKey',
  ALT: 'altKey',
  SHIFT: 'shiftKey',
  CMD: 'metaKey',
  META: 'metaKey',
  WIN: 'metaKey',
}

const KEY_ALIAS = {
  SPACE: ' ',
  ESC: 'Escape',
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  RETURN: 'Enter',
  TAB: 'Tab',
  DEL: 'Delete',
  DELETE: 'Delete',
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
}

const parseCombo = str => {
  const parts = String(str).split('+').map(s => s.trim().toUpperCase())
  const mods = []
  let key = null

  for (const p of parts) {
    if (MOD[p])
      mods.push(p)
    else
      key = p
  }

  return { mods: new Set(mods), key }
}

const eventMatches = (e, parsed) => {
  // 修饰键必须完全匹配（多按 / 少按都不触发）
  const need = { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false }

  for (const m of parsed.mods)
    need[MOD[m]] = true

  if (e.ctrlKey !== need.ctrlKey) return false
  if (e.altKey !== need.altKey) return false
  if (e.shiftKey !== need.shiftKey) return false
  if (e.metaKey !== need.metaKey) return false

  const k = parsed.key

  // 单字母 / 单数字用物理键 code，兼容 Mac 上 Alt 组合出特殊字符的情况
  if (/^[A-Z]$/.test(k))
    return e.code === `Key${k}`
  if (/^[0-9]$/.test(k))
    return e.code === `Digit${k}`

  const target = KEY_ALIAS[k] ?? k

  return e.key.toUpperCase() === target.toUpperCase()
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const parsed = shortcuts.map(s => ({ ...s, _p: parseCombo(s.combo) }))

  const handler = e => {
    // 在输入框 / 可编辑区域时不触发，避免干扰正常输入
    const t = e.target

    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))
      return

    for (const s of parsed) {
      if (!eventMatches(e, s._p))
        continue

      e.preventDefault()

      if (e.repeat)
        return

      router.push(s.to)

      if (import.meta.env.DEV)
        console.info(`[快捷键] ${s.combo} → ${s.to}（${s.label ?? ''}）`)

      break
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onUnmounted(() => window.removeEventListener('keydown', handler))
}
