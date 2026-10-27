// 企业注册表 + 项目目录：菜单与“项目综合”列表都由它驱动。
// 内容按「单位」聚合到单个文件，结构更清楚：
//   - src/data/companies.json        只放公司元信息（category / company / icon），即「单位注册表」
//   - src/data/details/<单位>.json   放该单位全部项目；每个条目同时含
//        概览字段（name / image / description / tags）与详情字段（title / date / images / sections）
//     一个单位 = 一个文件；新增单位只需在 companies.json 加一行 + 在 details/ 加一个文件。
// 本文件把两者合并：company.projects 由 detailsRaw 按 category 派生，整棵树本地化一次。
import companiesData from '@/data/companies.json';
import { detailsRaw } from '@/data/details'
import { visibleItems } from '@/utils/visibility';
import { localize } from '@/i18n';

// 项目可在 JSON 中标记 visibility: "hidden" 临时下线：
// 过滤后侧边导航与「项目综合」列表都不会再出现该项目（完全不渲染，不留空白）。
const companiesMapped = companiesData.map(c => ({
  ...c,
  projects: visibleItems(
    detailsRaw.filter(d => d.category === c.category),
  ).map(p => ({
    ...p,
    to: `/project/${c.category}/${p.slug}`,
  })),
}))

// 整棵树包成「按当前语言自动解析 { zh, ru, en, be }」的代理（仅本地化一次）
export const companies = localize(companiesMapped)

export const getProjects = category => companies.find(c => c.category === category)?.projects ?? []

export const getCompany = category => companies.find(c => c.category === category)
