// 企业-项目目录：菜单与“项目综合”列表都由它驱动。
// 纯内容在 src/data/companies.json，图片变体放在 public/images/variants/ 下。
// JSON 中 image 字段填写相对路径（如 "rainbow/project2.png"）。
// 编辑展示内容只需改 companies.json：
//   - 新增企业：在数组里加一项（含 category / company / projects）
//   - 新增项目：在对应企业的 projects 里加一条（slug / name / image / description / tags）
// 详情正文仍在 src/data/details/ 下按单位拆分的 json（按 slug 关联），不要在这里配置。
import companiesData from '@/data/companies.json';
import { visibleItems } from '@/utils/visibility';
import { localize } from '@/i18n';

// 项目可在 JSON 中标记 visibility: "hidden" 临时下线：
// 过滤后侧边导航与「项目综合」列表都不会再出现该项目（完全不渲染，不留空白）。
const companiesMapped = companiesData.map(c => ({
  ...c,
  projects: visibleItems(c.projects).map(p => ({
    ...p,
    to: `/project/${c.category}/${p.slug}`,
    image: p.image,
  })),
}))

// 包成「按当前语言自动解析 { zh, ru, en }」的代理
export const companies = localize(companiesMapped)

export const getProjects = category => companies.find(c => c.category === category)?.projects ?? []

export const getCompany = category => companies.find(c => c.category === category)
