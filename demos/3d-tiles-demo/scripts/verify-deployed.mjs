// 验证“已部署”的 demo：以主站 public/ 为静态根，加载 /demos/3d-tiles-demo/index.html，
// 确认 Cesium 挂载、ordos 图标 PNG 均 200、底部菜单/顶部工具渲染、且无控制台/页面错误。
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../../public')
const PORT = 5189

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.b3dm': 'application/octet-stream',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
  '.jpg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon', '.ttf': 'font/ttf',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.eot': 'application/vnd.ms-fontobject',
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0])
  let filePath = path.join(ROOT, urlPath)
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end() }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const idx = path.join(filePath, 'index.html')
    filePath = fs.existsSync(idx) ? idx : filePath
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); return res.end('404')
  }
  const ext = path.extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  fs.createReadStream(filePath).pipe(res)
})

await new Promise(r => server.listen(PORT, r))

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage()
const errors = []
const imgReqs = []
const texReqs = []
const cssReqs = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))
await page.evaluateOnNewDocument(() => {
  window.__errs = []
  window.addEventListener('error', (e) => {
    const s = (e.error && e.error.stack) ? e.error.stack.split('\n').slice(0, 4).join(' | ') : ('' + e.message)
    window.__errs.push(s)
  })
})
page.on('response', r => {
  const u = r.url()
  if (u.includes('/demos/3d-tiles-demo/data/img/'))
    imgReqs.push(u.split('/data/img/')[1] + ' -> ' + r.status())
  if (u.includes('/demos/3d-tiles-demo/data/texture/'))
    texReqs.push(u.split('/data/texture/')[1] + ' -> ' + r.status())
  if (u.includes('/demos/3d-tiles-demo/css/'))
    cssReqs.push(u.split('/css/')[1] + ' -> ' + r.status())
})

await page.goto(`http://localhost:${PORT}/demos/3d-tiles-demo/index.html`, { waitUntil: 'networkidle2', timeout: 60000 })
  .catch(e => errors.push('GOTO: ' + e.message))
await new Promise(r => setTimeout(r, 9000))

const dom = await page.evaluate(() => ({
  title: document.title,
  cesiumContainer: !!document.querySelector('#cesiumContainer'),
  canvas: !!document.querySelector('canvas'),
  menuItems: document.querySelectorAll('#menu-ul > li').length,
  addButtons: document.querySelectorAll('.topbar .addbtn').length,
  layerGroups: document.querySelectorAll('#layers-categ-ul > li').length,
  checkboxes: document.querySelectorAll('#layers-categ .check-box').length,
}))

console.log('DOM:', JSON.stringify(dom))
console.log('CSS_REQUESTS:', JSON.stringify([...new Set(cssReqs)]))
console.log('IMG_REQUESTS (' + imgReqs.length + '):', JSON.stringify([...new Set(imgReqs)].slice(0, 20)))
console.log('TEXTURE_REQUESTS:', JSON.stringify([...new Set(texReqs)]))
console.log('ERRORS(excl favicon):', JSON.stringify(errors.filter(e => !e.includes('favicon')).slice(0, 15)))
const winErrs = await page.evaluate(() => window.__errs || [])
console.log('WINDOW_ERRORS:', JSON.stringify(winErrs.slice(0, 6), null, 2))

await browser.close()
server.close()
