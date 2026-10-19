// 用系统 Chromium 直接截图：当前 demo 与原始 ordos。无需 puppeteer。
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

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

function shot(url, out, budget) {
  return new Promise((resolve) => {
    const args = [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader',
      '--enable-webgl', '--ignore-gpu-blocklist', '--hide-scrollbars',
      '--window-size=1440,900', `--virtual-time-budget=${budget}`,
      `--screenshot=${out}`, url,
    ]
    const p = spawn('/usr/bin/chromium', args, { stdio: 'ignore' })
    p.on('close', () => resolve())
  })
}

await shot('http://localhost:8100/demos/3d-tiles-demo/index.html', '/tmp/shot-demo.png', 14000)
console.log('saved /tmp/shot-demo.png')
await shot('http://localhost:8101/index.html', '/tmp/shot-ordos.png', 6000)
console.log('saved /tmp/shot-ordos.png')

s1.close(); s2.close()
process.exit(0)
