// 将文本中的 **强调** 解析为片段数组，供模板按片段渲染（安全，不使用 v-html）
// 用法：在 JSON 的 text / description / list / paragraphs 等字段中用 **文字** 包裹需强调部分
export const parseEmphasis = text => {
  if (!text) return []

  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map(p => {
      const m = p.match(/^\*\*([^*]+)\*\*$/)

      return { text: m ? m[1] : p, strong: !!m }
    })
}

export default parseEmphasis
