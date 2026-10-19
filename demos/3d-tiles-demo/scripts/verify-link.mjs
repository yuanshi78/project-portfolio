// 复现：在主站(hash 模式)详情页点击 demo 外链，捕获最终落地 URL。
import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage()
const newUrls = []
browser.on('targetcreated', t => { try { newUrls.push(t.url()) } catch {} })

const PORT = process.env.PORT || 5173
await page.goto(`http://localhost:${PORT}/#/project/jinhe/chemistry_plant_3d`, { waitUntil: 'networkidle2', timeout: 90000 })
await new Promise(r => setTimeout(r, 4000))

const clicked = await page.evaluate(() => {
  const els = [...document.querySelectorAll('button, a')]
  const b = els.find(x => (x.textContent || '').includes('新窗口') || (x.textContent || '').includes('打开 3D'))
  if (b) { b.click(); return b.tagName + ' | href=' + b.getAttribute('href') + ' | target=' + b.getAttribute('target') + ' | text=' + b.textContent.trim().slice(0, 40) }
  return 'BUTTON_NOT_FOUND'
})
await new Promise(r => setTimeout(r, 4000))

console.log('CLICKED_TAG:', clicked)
console.log('NEW_TARGET_URLS:', JSON.stringify(newUrls, null, 2))
console.log('MAIN_PAGE_URL_AFTER:', page.url())
await browser.close()
