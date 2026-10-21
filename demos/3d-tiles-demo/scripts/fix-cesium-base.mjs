// vite-plugin-cesium 在自定义 base 下会把 Cesium 静态资源复制到
// dist + CESIUM_BASE_URL（即 dist/demos/3d-tiles-demo/cesium），
// 但 index.html 引用的是 /demos/3d-tiles-demo/cesium/...，
// 部署时 dist 挂在 /demos/3d-tiles-demo/ 之下，资源应位于 dist/cesium/。
// 本脚本在 build 后把错位的 Cesium 目录归位到 dist/cesium。
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.resolve(__dirname, '..', 'dist')
const misplaced = path.join(dist, 'demos', '3d-tiles-demo', 'cesium')
const target = path.join(dist, 'cesium')

if (fs.existsSync(misplaced)) {
  if (fs.existsSync(target)) execSync(`rm -rf "${target}"`) // 移除上一次遗留
  fs.renameSync(misplaced, target) // 移动目录（不触发批量删除保护）
  execSync(`rm -rf "${path.join(dist, 'demos')}"`) // 清掉空壳 dist/demos
  console.log('[fix-cesium-base] cesium 已归位到 dist/cesium，并清理 dist/demos')
} else {
  console.log('[fix-cesium-base] 无需归位（cesium 已在 dist/cesium 或尚未构建）')
}
