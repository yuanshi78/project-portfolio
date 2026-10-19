// 离线生成要素图标（彩色圆盘 + 字母），无需任何外部图片资源。
const cache = {}

export function makeIcon(color, letter) {
  const key = color + letter
  if (cache[key]) return cache[key]
  const size = 48
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 26px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, size / 2, size / 2 + 1)
  const url = canvas.toDataURL()
  cache[key] = url
  return url
}
