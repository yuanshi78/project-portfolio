// 预生成图片变体（ImageMagick）
//
// 扫描 src/data 下被项目卡片 / 轮播引用的图片，按角色分目录生成多尺寸变体：
//   public/images/variants/<role>/<原相对路径>
// 角色：card-pc / card-mobile / carousel-pc / carousel-mobile / zoom-pc / zoom-mobile / thumb
// 目标尺寸见 VARIANTS（均为 16:9，居中裁剪避免拉伸）。已存在的变体文件会跳过（可重复运行）。
//
// 运行：node scripts/gen-image-variants.mjs
import { readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pagesDir = join(root, 'public', 'images', 'pages')
const variantsDir = join(root, 'public', 'images', 'variants')

const VARIANTS = {
  'card-pc': [800, 450],
  'card-mobile': [480, 270],
  'carousel-pc': [1280, 720],
  'carousel-mobile': [720, 405],
  'zoom-pc': [1600, 900],
  'zoom-mobile': [900, 506],
  'thumb': [200, 112],
}

// 从数据文件中收集被引用的图片路径（引号内、以 png/jpg 结尾的相对路径）
const refs = new Set()
const collectFrom = fp => {
  if (!existsSync(fp)) return
  const text = readFileSync(fp, 'utf8')
  const re = /["']([^"']*\.(?:png|jpe?g))["']/g
  let m

  while ((m = re.exec(text)))
    refs.add(m[1])
}

for (const f of readdirSync(join(root, 'src', 'data', 'details'))) {
  if (f.endsWith('.json'))
    collectFrom(join(root, 'src', 'data', 'details', f))
}
collectFrom(join(root, 'src', 'data', 'companies.js'))
collectFrom(join(root, 'src', 'data', 'companies.json'))

// 仅保留真实存在的源文件
const sources = [...refs].filter(img => existsSync(join(pagesDir, img)))

console.log(`found ${sources.length} referenced source images`)

let count = 0

// 读取源图原始尺寸
const dimsOf = src => {
  const [w, h] = execFileSync('identify', ['-format', '%w %h', src]).toString().trim().split(' ').map(Number)

  return { w, h }
}

let portraitCount = 0

for (const img of sources) {
  const src = join(pagesDir, img)
  const { w: sw, h: sh } = dimsOf(src)
  // 竖图（移动端页面截图）：不能裁成 16:9，否则只剩中间一条；保持比例、按高适配
  const isPortrait = sw / sh < 1

  for (const [variant, [w, h]] of Object.entries(VARIANTS)) {
    // 变体按角色分目录，保持原文件名 / 相对路径
    const out = join(variantsDir, variant, img)

    if (existsSync(out)) continue
    mkdirSync(dirname(out), { recursive: true })

    try {
      const args = isPortrait
        // 竖图：按目标高度等比缩放（宽度自适应），完整保留整屏
        ? [src, '-resize', `x${h}`, '-strip', out]
        // 横图：缩放到铺满（`^`）再居中裁剪到目标比例，保证铺满、无白边
        : [src, '-resize', `${w}x${h}^`, '-gravity', 'center', '-extent', `${w}x${h}`, '-strip', out]

      execFileSync('magick', args)
      count++
      if (isPortrait)
        portraitCount++
    } catch (e) {
      console.error('FAIL', img, variant, e.message)
    }
  }
}

console.log(`generated ${count} variant files (${portraitCount} portrait/mobile)`)
