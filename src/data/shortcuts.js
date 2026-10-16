// 快捷入口 / 全局快捷键配置：纯内容在 src/data/shortcuts.json。
// 用 localize 包成「按当前语言自动解析 { zh, ru, en }」的代理。
import shortcutsData from '@/data/shortcuts.json'
import { localize } from '@/i18n'

export const shortcuts = localize(shortcutsData)
export default shortcuts
