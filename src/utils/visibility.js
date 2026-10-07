// JSON 驱动的显隐控制：给某条内容加上 visibility: "hidden"（或 hidden: true）即可临时下线。
// 隐藏后该条目完全不渲染（从 DOM 移除，不占位置、不留空白），配置仍保留在 JSON 中，随时可恢复。
//
// 支持位置：
//   - personal.json      的 profile.left[].items / skills.items / rightBottom[].items（个人信息条目）
//   - personal.json      的 experience.items（工作经历条目）
//   - companies.json     的 projects（项目卡片，含侧边导航与「项目综合」列表）
//   - 详情 JSON（src/data/details/*.json） 的 sections（详情页章节）
//
// 用法示例：
//   { "icon": "ri-phone-line", "text": "手机号：...", "visibility": "hidden" }
export const isHidden = item => item?.visibility === 'hidden' || item?.hidden === true

// 过滤掉被标记为隐藏的条目，返回仅保留可见项的新数组
export const visibleItems = (items = []) => items.filter(item => !isHidden(item))
