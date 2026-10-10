import { createApp } from 'vue'
import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import personal from '@/data/personal.json'

// Styles
import '@core/scss/template/index.scss'
import '@layouts/styles/index.scss'

// 浏览器标签页标题由 personal.json 的 site.title 驱动（改 JSON 即可，无需改 index.html）
if (personal.site?.title)
  document.title = personal.site.title

// 👉 图片加载完成标记：给已加载/失败的 <img> 所在的 .v-img 根节点设置 data-img-loaded 属性，
//    配合 @layouts/styles/_image-loading.scss —— shimmer 动画只在未加载时播放。
//    注意两点：
//    ① load/error 不冒泡，且传播路径不经过 window（到 document 为止），必须挂在 document 上；
//    ② 必须用 data-* 属性而不是 class——Vue 重渲染时会整体重写 VImg 根节点的 class，
//       手动加的类会被抹掉（动画复活）；data-* 属性 Vue 不管理，能稳定保留。
const markLoadedImg = e => {
  const img = e.target
  if (!(img instanceof HTMLImageElement)) return
  img.closest('.v-img')?.setAttribute('data-img-loaded', '')
}
document.addEventListener('load', markLoadedImg, true)
document.addEventListener('error', markLoadedImg, true)

// Create vue app
const app = createApp(App)


// Register plugins
registerPlugins(app)

// Mount vue app
app.mount('#app')
