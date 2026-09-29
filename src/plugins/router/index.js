import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from './routes'

// 用 hash 模式：/#/project/:category/:slug 的 # 之后不会发给服务器，
// 因此在任意静态托管（GitHub Pages、Nginx 未配回退、直接打开 dist 等）下深层路由都不会 404。
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

export default function (app) {
  app.use(router)
}
export { router }
