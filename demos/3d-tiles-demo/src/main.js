import { createApp } from 'vue'
import App from './App.vue'
import './styles/theme.css'

// 注入 ordos 原始样式（public/css、public/fonts，目录与 ordos 一致，CSS 内 url(../data/img) 等相对路径照常解析）。
// 用 BASE_URL 拼绝对路径，保证独立 dev 与主站子路径 /demos/3d-tiles-demo/ 下都正确。
const BASE = import.meta.env.BASE_URL
;[
  'css/nav.css',
  'fonts/iconfont.css',
  'css/default.css',
  'css/global.css',
].forEach((p) => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = BASE + p
  document.head.appendChild(link)
})

// ordos 将 .whiteColor/.blueColor 等写在 index.html 的内联 <style> 中，a 的去下划线由 bootstrap 提供。
// 这里一并补上，否则底部菜单文字会变成浏览器默认的蓝色下划线链接样式。
const inline = document.createElement('style')
inline.textContent = `
  a { text-decoration: none; }
  .whiteColor { color: #fff; }
  .blueColor { color: #ffbb01 !important; }
  .alarmList { font-size: 20px; color: #fff; }
`
document.head.appendChild(inline)

createApp(App).mount('#app')
