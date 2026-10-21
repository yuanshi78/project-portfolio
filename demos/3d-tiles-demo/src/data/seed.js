// 演示数据种子：化工厂示意。所有坐标均为「本地 ENU 米」（e=东, n=北, h=高），
// 在 cesiumApp 中经厂区中心点 (PLANT) 转为经纬度上图，与 3D Tiles 模型共用同一 ENU 坐标系。
// 注意：以下为演示示例数据，非真实监测/实测值。

// 实体坐标 JSON 配置（单一可信源）：在 cesiumApp 中以 ENU 上图。
import entitiesConfig from './entities-config.json'
// 厂区中心（高德 GCJ-02 坐标，直接使用）。
// 关键：底图是高德卫星瓦片，瓦片内容本身已按 GCJ-02 偏移（约 +490m 东 / +95m 北），
// 模型若用换算后的 WGS-84（109.474290, 39.079134），会落在真实位置、影像却是偏移过的，
// 两者错开约 500m（表现为模型在工厂西侧）。配高德底图时模型也用 GCJ-02，偏移相互抵消。
// ⚠ 若换成 WGS-84 底图（天地图/Esri/Cesium 自带离线图），这里必须换算回 109.474290, 39.079134。
// 精标定（2026-10-20，用「点击输出坐标」实测两点求差）：
//   工厂实测点 GCJ-02 109.479077, 39.091557（本地 e=-92.27  n=1277.20）
//   模型对应点 GCJ-02 109.479785, 39.080515（本地 e=-31.09  n=  51.42）
//   → 模型需 西移 61.18m / 北移 1225.78m，即 Δlon -0.00070799、Δlat +0.01101132。
//   再标定：重复上面两次点击，把新的「工厂本地 e/n − 模型本地 e/n」累加到 lon/lat 即可。
export const PLANT = { lon: 109.479436, lat: 39.091063, height: 0 }

// 模型尺寸标定（2026-10-20 用「点击输出坐标」实测，按点2 求比值）：
//   同一处实物：模型上 e=55.98，真实厂区 e=931.55 → MODEL_SCALE = 931.55 / 55.98 = 16.6408
//   校验：55.98 × 16.6408 = 931.55 ✓（放大后模型约 2356m × 3142m）
// 只改大小（乘在归一化缩放上），不动位置与朝向。
export const MODEL_SCALE = 10.9806 // 缩小 1/4：14.6408 × 0.75（若想「缩到 1/4」则填 3.6602）

// 模型垂直微调（单位：米，不受 MODEL_SCALE 影响）：负值往下压（贴地/入地），正值抬高。
// 悬浮就往下压（如 -20），陷进地里就往上抬（如 +20）。
export const MODEL_LIFT = -20

// 要素铺开系数：要素原本按 ±70m 布置，模型放大后（约 1555×2074m）全挤在中心一小块，
// 这里统一把要素的水平 e/n 放大（高度 h 保持原值），并同步放大危险区/围栏等的半径与高度。
// 8 → 要素铺开到约 1080m × 790m，约占厂区 70%。
export const FEATURE_SPREAD = 8

// 要素类型定义：图标(复用 ordos data/img) + 颜色 + 所属图层分组
export const TYPE_DEFS = {
  camera:    { label: '摄像头',   group: '安全监测', color: '#34d399', icon: 'icon_camera.png' },
  gas:       { label: '气体监测', group: '安全监测', color: '#fbbf24', icon: 'icon-Gas.png' },
  env:       { label: '环境监测', group: '安全监测', color: '#22d3ee', icon: 'icon_monitoring.png' },
  fire:      { label: '消防设施', group: '消防',     color: '#f87171', icon: 'icon_fire.png' },
  hydrant:   { label: '消防栓',   group: '消防',     color: '#fb923c', icon: 'fire.png' },
  pipe:      { label: '消防管线', group: '消防',     color: '#f97316', icon: 'icon_fence.png' },
  device:    { label: '生产设备', group: '生产',     color: '#60a5fa', icon: 'icon_equip.png' },
  area:      { label: '标识区域', group: '区域',     color: '#a78bfa', icon: 'icon_region.png' },
  warehouse: { label: '物资仓库', group: '物资',     color: '#facc15', icon: 'icon_building.png' },
  access:    { label: '门禁',     group: '安防',     color: '#94a3b8', icon: 'icon_rke.png' },
  alarm:     { label: '报警点',   group: '报警',     color: '#ef4444', icon: 'icon_alarm.png' },
  poison:    { label: '毒气监测', group: '安全监测', color: '#84cc16', icon: 'icon_gasmask.png' },
  person:    { label: '人员',     group: '人员',     color: '#38bdf8', icon: 'icon_person.png' },
  // —— 移植自 ordos 的实体 ——
  radar:     { label: '雷达监测', group: '安全监测', color: '#31ff94', icon: 'icon_radar.png' },
  wind:      { label: '风向',     group: '安全监测', color: '#f472b6', icon: 'icon_monitoring.png' },
  fence:     { label: '电子围栏', group: '安防',     color: '#facc15', icon: 'icon_fence.png' },
  danger:    { label: '危险区',   group: '区域',     color: '#b91c1c', icon: 'icon_alarm.png' },
  smoke:     { label: '烟雾扩散', group: '区域',     color: '#ef4444', icon: 'icon_alarm.png' },
}

export const GROUP_ORDER = ['安全监测', '消防', '生产', '区域', '物资', '安防', '报警', '人员']

let _id = 1
const uid = (p) => `${p}-${(_id++).toString().padStart(3, '0')}`

// 坐标收缩系数：模型真实占地约 141×188m（e 半宽 ~70、n 半宽 ~94），
// 下面的演示网格原本按 ±150m 铺开，会大量浮在模型外的空地上，故统一收缩到模型内。
const S = 0.45
// 折线/轨迹点收缩：[e, n, h] 数组逐点乘 S
const sc = (pts) => pts.map(([e, n, h]) => [e * S, n * S, h])

function f(type, name, e, n, h = 2, extra = {}) {
  return { id: uid(type), type, name, e: e * S, n: n * S, h, status: '正常', ...extra }
}

// 人员轨迹：在厂区内绕行一圈的采样点（带时间戳），用于轨迹回放
function makeTrail(startE, startN) {
  const pts = []
  const t0 = Date.now() - 1000 * 60 * 30
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const r = (90 + 20 * Math.sin(a * 3)) * S
    pts.push({
      t: t0 + i * 60000,
      e: startE * S + r * Math.cos(a),
      n: startN * S + r * Math.sin(a),
      h: 1.6,
    })
  }
  return pts
}

// 实体坐标统一由 JSON 配置驱动（单一可信源，见 src/data/entities-config.json）。
// 修改配置后重新构建即可生效；要恢复原始硬编码演示数据可改回 `return seedFeaturesDemo()`。
export function seedFeatures() {
  const cfg = (entitiesConfig && entitiesConfig.features) || []
  return cfg.map((x) => ({
    id: x.id || uid(x.type),
    type: x.type,
    name: x.name,
    e: x.e,
    n: x.n,
    h: x.h ?? 2,
    status: x.status ?? '正常',
    ...x,
  }))
}

// —— 原始演示实体数据（保留以便恢复，不要删除）——
export function seedFeaturesDemo() {
  _id = 1
  const list = []

  // 摄像头（厂区周界与重点部位）
  const cams = [[-140, -100], [140, -100], [-140, 100], [140, 100], [0, -95], [60, 95]]
  cams.forEach(([e, n], i) => list.push(f('camera', `摄像头 #${i + 1}`, e, n, 6, { online: true })))

  // 气体监测（有毒/可燃）
  const gasDefs = [
    ['可燃', 'CH₄', '%LEL', 12, 25],
    ['有毒', 'H₂S', 'ppm', 3, 10],
    ['可燃', 'C₂H₄', '%LEL', 8, 25],
    ['有毒', 'CO', 'ppm', 18, 50],
    ['可燃', 'NH₃', '%LEL', 5, 25],
  ]
  gasDefs.forEach(([kind, gas, unit, val, th], i) => list.push(
    f('gas', `气体监测 #${i + 1}`, -80 + i * 35, 60 - i * 5, 3, { kind, gas, unit, value: val, threshold: th })
  ))

  // 环境监测
  const envDefs = [['温度', '℃', 28], ['湿度', '%', 46], ['风速', 'm/s', 3.2], ['风向', '°', 210], ['噪声', 'dB', 62]]
  envDefs.forEach(([pn, unit, val], i) => list.push(
    f('env', `环境监测 #${i + 1}`, -60 + i * 30, -70, 3, { paramName: pn, unit, value: val })
  ))

  // 消防设施（灭火器站等）
  const firePos = [[-120, -40], [120, -40], [-120, 40], [120, 40], [0, 40], [0, -40], [-40, 0], [40, 0]]
  firePos.forEach(([e, n], i) => list.push(f('fire', `消防设备 #${i + 1}`, e, n, 1.5, { pressure: 0.8 + i * 0.02 })))

  // 消防栓
  const hydPos = [[-100, -20], [100, -20], [-100, 20], [100, 20], [20, -60], [-20, 60]]
  hydPos.forEach(([e, n], i) => list.push(f('hydrant', `消防栓 #${i + 1}`, e, n, 0.6, { pressure: 0.62 })))

  // 消防管线（折线）
  list.push(f('pipe', '消防主管线 A', 0, 0, 0, {
    path: sc([[-140, -10, 0.5], [-40, -10, 0.5], [40, -10, 0.5], [140, -10, 0.5]]),
    flow: '常压',
  }))
  list.push(f('pipe', '消防管线 B', 0, 0, 0, {
    path: sc([[-40, -90, 0.5], [-40, 0, 0.5], [-40, 90, 0.5]]),
    flow: '常压',
  }))
  list.push(f('pipe', '消防环线 C', 0, 0, 0, {
    path: sc([[-100, -80, 0.5], [100, -80, 0.5], [100, 80, 0.5], [-100, 80, 0.5], [-100, -80, 0.5]]),
    flow: '常压',
  }))
  list.push(f('pipe', '消防支线 D', 0, 0, 0, {
    path: sc([[40, -10, 0.5], [45, -70, 0.5]]),
    flow: '常压',
  }))

  // 生产设备（反应釜 / 泵 / 压缩机）
  const devDefs = [
    ['反应釜 R-101', '温度', '℃', 142, '运行'],
    ['反应釜 R-102', '温度', '℃', 138, '运行'],
    ['进料泵 P-201', '流量', 'm³/h', 22, '运行'],
    ['压缩机 C-301', '振动', 'mm/s', 2.1, '运行'],
    ['精馏塔 T-401', '液位', '%', 67, '运行'],
    ['换热器 E-501', '温差', '℃', 35, '运行'],
    ['离心机 M-601', '转速', 'rpm', 2950, '停机'],
  ]
  const devPos = [[-60, -40], [-60, 35], [10, -60], [28, -60], [19, -78], [60, -78], [-20, 20]]
  devDefs.forEach(([name, pn, unit, val, st], i) => {
    const [e, n] = devPos[i]
    list.push(f('device', name, e, n, 1.5, { paramName: pn, unit, value: val, status: st }))
  })

  // 标识区域
  const areaDefs = [['储罐区', -70, 72], ['装卸区', 95, -50], ['生产装置区', -60, 0], ['中控办公区', 60, 70]]
  areaDefs.forEach(([name, e, n]) => list.push(f('area', name, e, n, 0, { areaType: name })))

  // 物资仓库
  const whDefs = [
    ['危化品仓库', [['防毒面具', 20], ['防护服', 15], ['应急药箱', 5]]],
    ['消防器材库', [['灭火器', 40], ['水带', 30], ['破拆工具', 8]]],
    ['通用物资库', [['沙袋', 200], ['警戒带', 50], ['照明灯', 12]]],
  ]
  whDefs.forEach(([name, items], i) => list.push(
    f('warehouse', name, -150 + i * 10, 60 + i * 10, 1, { items })
  ))

  // 门禁
  const accPos = [[-150, 0], [150, 0], [0, -110], [0, 110]]
  accPos.forEach(([e, n], i) => list.push(f('access', `门禁 #${i + 1}`, e, n, 1.5, { open: i % 2 === 0 })))

  // 人员（带轨迹）
  const persons = [
    ['张伟', '运行一班', '班长'],
    ['李娜', '安全科', '安全员'],
    ['王强', '维修班', '维修工'],
    ['赵敏', '中控室', '操作工'],
    ['刘洋', '消防队', '消防员'],
    ['陈静', '仓储', '保管员'],
  ]
  persons.forEach(([name, dept, role], i) => list.push(
    f('person', name, -40 + i * 18, -30 + (i % 2) * 40, 1.6, {
      dept, role, status: '在岗', trail: makeTrail(-40 + i * 18, -30 + (i % 2) * 40),
    })
  ))

  // —— 移植自 ordos 的实体示例数据 ——
  // 雷达监测（ordos RadarCoverage：扇形扫描圆柱）
  list.push(f('radar', '周界雷达 #1', 0, 0, 0, { radius: 40, height: 12 }))
  list.push(f('radar', '罐区雷达 #2', -70, 72, 0, { radius: 26, height: 10 }))

  // 风向（ordos WindDirection：glTF 箭头模型）
  // level 是模型缩放系数：direction.glb 原始尺寸约 102.6 x 10 x 40，
  // 0.15 → 箭头约 15m 长（厂区约 141x188m），比例合适
  list.push(f('wind', '风向标', 30, 40, 14, { direction: 135, level: 0.15 }))

  // 电子围栏（ordos Fence：沿高度流动的光带墙面）
  list.push(f('fence', '储罐区围栏', 0, 0, 0, {
    path: sc([[-115, 40, 0.5], [-30, 40, 0.5], [-30, 105, 0.5], [-115, 105, 0.5], [-115, 40, 0.5]]),
    height: 4,
  }))

  // 危险区（ordos CriticalZone：由中心向外扩散的同心波纹圆柱）
  list.push(f('danger', '储罐区危险区', -70, 72, 0, { radius: 24, height: 10 }))

  // 初始报警（1 条）
  list.push({
    id: uid('alarm'), type: 'alarm', name: '可燃气体报警', e: -80 * S, n: 60 * S, h: 3,
    level: '高', message: '储罐区 CH₄ 浓度 28%LEL，超过阈值 25%LEL', status: 'active',
    time: new Date().toISOString(),
  })

  return list
}

export function seedDrills() {
  return [
    {
      id: uid('drill'), name: '储罐区泄漏应急演练', date: '2026-03-12', status: 'done',
      desc: '模拟储罐区 CH₄ 泄漏，演练疏散、堵漏与消防救援联动。',
      steps: ['报警接报', '人员疏散', '现场警戒', '堵漏处置', '环境监测', '解除警报'],
    },
    {
      id: uid('drill'), name: '火灾应急响应桌面推演', date: '2026-05-20', status: 'ongoing',
      desc: '中控室联动消防、医疗与环保，完成火灾扑救与污染防控流程。',
      steps: ['火情确认', '启动预案', '力量调集', '灭火救援', '后期处置'],
    },
    {
      id: uid('drill'), name: '防汛防台专项演练', date: '2026-07-08', status: 'planned',
      desc: '针对极端天气的厂区排涝、断电与人员安置预案。',
      steps: ['预警发布', '隐患排查', '物资前置', '人员安置', '恢复生产'],
    },
  ]
}
