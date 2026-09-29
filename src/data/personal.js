// 自我介绍页内容配置：菜单/个人信息/爱好/技能/评价/想法/工作经历都由它驱动。
// 纯内容在 src/data/personal.json，编辑展示内容只需改该 JSON：
//   - 修改文案/图标：直接改对应条目的 text / icon
//   - 新增板块：在 profile.left / profile.rightBottom 数组里加一项 { title, items }
//   - 新增工作经历：在 experience.items 里加一条 { subtitle, title, text, to? }
// 头像(me.png)与封面(abstract.jpg)为图片资源，封面路径在 JSON 的 cover 字段；
// 头像为构建资源，保留在 personal.vue 中引用。
import personalData from '@/data/personal.json'

export const personal = personalData
