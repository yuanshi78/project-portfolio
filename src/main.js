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

// Create vue app
const app = createApp(App)


// Register plugins
registerPlugins(app)

// Mount vue app
app.mount('#app')
