// 项目详情数据：按「单位 / 公司」拆分存放，本文件自动汇总整个目录。
//
// 👉 新增一个单位只需要两步，不需要改本文件：
//   1. 在 src/data/companies.json 里加公司 + 项目卡片（category 即单位标识）
//   2. 在 src/data/details/ 下新建 <单位>.json，内容为该单位的项目数组
//
// 每个 json 文件是一个数组，条目结构与原来的单文件 details.json 一致。
// category 字段可写可不写：没写时自动取文件名，保证与 companies.json 的单位标识一致。

const modules = import.meta.glob('./*.json', { eager: true })

export const details = Object.keys(modules)
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

export default details
