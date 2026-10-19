// 单进程内启动 Vite 子进程，等就绪后用真实浏览器对比两条路径：
//   A) /demos/3d-tiles-demo/            (旧写法，目录)
//   B) /demos/3d-tiles-demo/index.html  (新写法，显式文件，与其他 demo 一致)
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const CODE = '/home/yuanshi/Work/projects-presentation/code'
const PORT = 5177
const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: CODE,
  stdio: ['ignore', 'pipe', 'pipe'],
})
vite.stderr.on('data', d => process.stderr.write('[vite] ' + String(d)))

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://localhost:${PORT}/`)).ok) return true } catch {}
    await new Promise(r => setTimeout(r, 1000))
  }
  return false
}
const ready = await waitReady()

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

async function probe(path) {
  const page = await browser.newPage()
  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 5000))
  const info = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    demoMounted: !!document.querySelector('#cesiumContainer'),
  }))
  await page.close()
  return info
}

const dirPath = await probe('/demos/3d-tiles-demo/')
const htmlPath = await probe('/demos/3d-tiles-demo/index.html')

console.log('VITE_READY:', ready)
console.log('A_DIR   /demos/3d-tiles-demo/            =>', JSON.stringify(dirPath))
console.log('B_HTML  /demos/3d-tiles-demo/index.html  =>', JSON.stringify(htmlPath))

await browser.close()
vite.kill('SIGKILL')
process.exit(0)
