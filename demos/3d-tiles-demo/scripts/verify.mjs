import puppeteer from 'puppeteer-core';

const URL = 'http://localhost:5174/demos/3d-tiles-demo/'
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage()
const W = +(process.env.W || 1400)
const H = +(process.env.H || 900)
await page.setViewport({ width: W, height: H })

const errors = []
const tileReqs = []
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
page.on('requestfinished', (r) => {
  const u = r.url()
  if (u.includes('/data/imported-model/')) tileReqs.push(u.split('/').pop().split('?')[0] + ' -> ' + (r.response() && r.response().status()))
})
page.on('requestfailed', (r) => {
  const u = r.url()
  if (u.includes('/data/imported-model/')) tileReqs.push(u.split('/').pop().split('?')[0] + ' -> FAILED: ' + r.failure()?.errorText)
})

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => errors.push('GOTO: ' + e.message))
await page.waitForSelector('.cesium-viewer canvas', { timeout: 30000 }).catch((e) => errors.push('CESIUM VIEWER: ' + e.message))
await new Promise((r) => setTimeout(r, 10000))

console.log('=== /data/imported-model REQUESTS ===')
console.log(JSON.stringify(tileReqs, null, 2))
console.log('=== B3DM REQUESTED ===')
console.log(tileReqs.some((request) => request.startsWith('0.b3dm -> 200')))
console.log('=== CONSOLE/PAGE ERRORS (excl. favicon) ===')
console.log(JSON.stringify(errors.slice(0, 20), null, 2))
await browser.close()
