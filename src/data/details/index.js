// 项目数据：按「单位 / 公司」拆分存放，本文件自动汇总整个目录。
// 每个 json 文件是该单位全部项目的数组；条目同时含概览字段（name / image / description / tags）
// 与详情字段（title / date / images / sections），一个单位 = 一个文件。
//
// 👉 新增一个单位只需两步，不需改本文件：
//   1. 在 src/data/companies.json 里加一行公司注册表（category / company / icon）
//   2. 在 src/data/details/ 下新建 <单位>.json，每条目带齐概览 + 详情字段
//
// category 字段可写可不写：没写时自动取文件名，保证与 companies.json 的单位标识一致。

import { localize } from '@/i18n'

const modules = import.meta.glob('./*.json', { eager: true })

// 原始（未本地化）数据：供 companies.js 按 category 派生「公司 + 项目」目录使用。
const rawList = Object.keys(modules)
  .sort()
  .flatMap(file => {
    // 文件名即单位标识（如 rainbow.json → category: "rainbow"）
    const category = file.replace(/^\.\//, '').replace(/\.json$/, '')
    const mod = modules[file]
    const list = mod.default ?? mod

    return (Array.isArray(list) ? list : []).map(entry => ({
      ...entry,
      category: entry.category ?? category,
    }))
  })

export const detailsRaw = rawList

// 本地化版本：详情页 / 路由守卫直接消费。
export const details = localize(rawList)

export default details
