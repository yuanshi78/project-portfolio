# 化工厂应急指挥 · 3D Tiles 演示

一个**独立、离线可运行**的 CesiumJS 3D Tiles 演示，复刻“中煤蒙达（鄂尔多斯）化工厂应急指挥 GIS 系统”的核心交互。
所有数据、底图、3D 模型均在本地生成或随包发布，**不依赖任何内网服务（10.103.100.x 后端/视频/WebSocket）与任何外部 CDN / Cesium ion**。

## 技术栈

- **Vue 3** + **Vite 5**
- **CesiumJS 1.119**（通过 `vite-plugin-cesium` 外置到 `dist/cesium`，离线可用）
- **3D Tiles (b3dm)**：由 Node 脚本从 glTF 字节级构造，无需 Blender / 任何建模软件
- **离线底图**：Cesium 自带 Natural Earth II（`Assets/Textures/NaturalEarthII`）
- **持久化**：`localStorage`，支持“恢复初始数据”
- **图标**：运行时 Canvas 生成，无图片资源依赖

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. （可选）重新生成程序化工厂 3D Tiles
npm run generate

# Convert a GLB to b3dm + tileset.json (the demo loads this output)
npm run convert-glb-tiles -- /absolute/path/to/model.glb

# 3. 启动开发服务器
npm run dev
# 打开 http://localhost:5174/

# 4. 生产构建（产物自带 cesium / Workers / NaturalEarthII / data）
npm run build
npm run preview
```

> 构建产物 `dist/` 可直接拷贝到任意静态服务器或离线环境运行。

## 目录结构

```
├── index.html
├── vite.config.js
├── scripts/
│   ├── generate-tileset.mjs     # 程序化生成 b3dm + tileset.json
│   ├── convert-glb-to-tiles.mjs # GLB 转 b3dm + tileset.json
│   └── verify.mjs               # Headless browser verification
├── public/data/
│   ├── imported-model/          # Converted GLB tileset loaded by the demo
│   └── plant/                   # Procedural factory tileset
└── src/
    ├── cesium/                  # Cesium viewer, ENU transforms, and entities
    ├── components/
    ├── data/
    ├── App.vue
    └── main.js
```

## 3D Tiles 模型说明

`scripts/generate-tileset.mjs` 从零构造一个**结构合法、可识别的化工厂模型**：

1. 以工厂中心经纬度为原点，建立局部 **ENU（East-North-Up）坐标系**
2. 程序化生成建筑/罐区/装置/管线等几何体的 glTF 网格
3. 写入 GLB（`glTF` JSON chunk + `BIN` chunk，分别按 0x20 / 0x00 补齐 4 字节对齐）
4. 打包为 **b3dm**（header + featureTable + batchTable + glb），featureTable 按空格补齐 8 字节对齐
5. 输出 `tileset.json`，其 `root.transform` 与前端 Viewer 的 `modelMatrix` 共用同一 ENU 矩阵

这保证了“模型”与“要素”（独立 entity 点）在地理上严格对齐，可双向定位。

## 功能一览

| 模块 | 说明 |
| --- | --- |
| 图层控制 | 按分组（视频/消防/气体/装置/环境/区域/报警/仓储/门禁/人员/管线）开关显隐，带类型图例与计数 |
| 搜索 | 按名称/类型过滤，一键定位飞行 |
| 要素增删改 | 顶栏“＋新增” → 点击地图落点；信息窗可编辑名称/坐标/状态/数值，可删除 |
| 报警处置 | 模拟报警 → 响应 → 清除（含 Toast 反馈，状态联动建筑高亮） |
| 应急演练 | 新增演练任务并设置状态（计划中/进行中/已完成） |
| 人员定位 | 选择人员，播放/暂停/拖动时间轴回放历史轨迹（trail） |
| 物资 | 仓储/区域物资概览 |
| 视频 | 离线演示占位（不连接真实视频流） |
| 测量 | 测距、测面、清除 |
| 复位视角 | 一键飞回工厂全景 |
| 数据持久化 | 所有改动写入 `localStorage`；“恢复初始数据”可重置为种子状态 |

## 离线 / 隐私

- 已设置 `Cesium.Ion.defaultAccessToken = ''`，不发起任何 ion 请求
- 底图、Worker、字体、3D Tiles 全部本地提供
- 无任何外部网络请求（验证脚本确认桌面/移动端 viewport 下资源均 200、控制台无报错）

## 验证

```bash
npm run dev          # 先启动服务
npm run verify       # 默认 1400x900
W=390 H=844 npm run verify   # 移动端视口
```

`scripts/verify.mjs` 使用系统 Chromium（swiftshader）做 headless 校验：确认 `tileset.json` 与 `0.b3dm` 返回 200、3D Tiles 内容渲染就绪（rootContentReady）、要素实体加载、且**无任何控制台/页面错误**（favicon 404 已通过内联 SVG 消除）。

## 已知边界

- 模型为**程序化生成的几何示意**，用于演示 3D Tiles 管线与工作流，非真实 BIM/倾斜摄影数据
- “视频”页为演示占位，不接入真实视频流
- 移动端为响应式窄屏布局，交互以点击/拖拽为主
