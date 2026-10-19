// 同时渲染「当前 demo」与「原始 ordos」，各截一张桌面图，便于人工比对样式布局。
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = '/home/yuanshi/Work/projects-presentation/code'
const ORDOS = '/home/yuanshi/Work/projects-presentation/projects/金合/中煤蒙达/Code/static/ordos'

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary',
  '.b3dm': 'application/octet-stream', '.pnts': 'application/octet-stream', '.i3dm': 'application/octet-stream',
  '.geom': 'application/octet-stream', '.bat': 'application/octet-stream', '.wav': 'audio/wav',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon',
}

function serve(rootDir, port) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0].split('#')[0])
    if (p === '/') p = '/index.html'
    const fp = path.join(rootDir, p)
    if (!fp.startsWith(rootDir)) { res.writeHead(403); return res.end() }
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); return res.end('404') }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' })
      res.end(data)
    })
  })
  server.listen(port)
  return server
}

const s1 = serve(path.join(ROOT, 'public'), 8100)
const s2 = serve(ORDOS, 8101)

const wait = (ms) => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })

// 1) 当前 demo（主站 public 下）
await page.goto('http://localhost:8100/demos/3d-tiles-demo/index.html', { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => console.log('demo goto err', e.message))
await wait(7000)
await page.screenshot({ path: '/tmp/shot-demo.png', fullPage: false })
console.log('saved /tmp/shot-demo.png')

// 2) 原始 ordos（其自身目录为根；Cesium 地图需后端数据，这里只看外壳布局）
await page.goto('http://localhost:8101/index.html', { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => console.log('ordos goto err', e.message))
await wait(4000)
await page.screenshot({ path: '/tmp/shot-ordos.png', fullPage: false })
console.log('saved /tmp/shot-ordos.png')

await browser.close()
s1.close(); s2.close()
