// 直接打开 demo 路径，确认它挂载的是 demo（而非主站 SPA），且加载后不产生多余 hash。
import puppeteer from 'puppeteer-core'
const PORT = process.env.PORT || 5173
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage()
const errs = []
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message))
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
await page.goto(`http://localhost:${PORT}/demos/3d-tiles-demo/index.html`, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 6000))
const info = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  hasCesiumContainer: !!document.querySelector('#cesiumContainer'),
  appHtmlLen: (document.querySelector('#app')?.innerHTML || '').length,
}))
console.log('FINAL_URL:', info.url)
console.log('TITLE:', info.title)
console.log('HAS_CESIUM_CONTAINER:', info.hasCesiumContainer)
console.log('APP_HTML_LEN:', info.appHtmlLen)
console.log('ERRORS(excl favicon):', JSON.stringify(errs.filter(e => !e.includes('favicon')).slice(0, 10)))
await browser.close()
