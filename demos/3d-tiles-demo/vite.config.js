import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

// 独立子项目：自带 CesiumJS、3D Tiles、离线底图，不依赖原 Ordos 项目。
export default defineConfig({
  plugins: [vue(), cesium()],
  // 主站以子路径 /demos/3d-tiles-demo/ 托管本 demo 的构建产物，
  // 故 base 必须对齐，否则 index.html 资源与 Cesium 资源会解析到站点根而 404。
  base: '/demos/3d-tiles-demo/',
  server: { host: true, port: 5174 },
  build: { outDir: 'dist', emptyOutDir: true },
})
