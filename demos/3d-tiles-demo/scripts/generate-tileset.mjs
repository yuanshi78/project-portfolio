// 化工厂示意 3D Tiles 生成器
// ---------------------------------------------------------------------------
// 程序化生成一套可辨识的化工厂设施（厂房 / 储罐 / 塔器 / 管廊 / 管线 / 烟囱 /
// 装卸区 / 仓库 / 道路），输出 glTF(未带光照) → 包装为 b3dm → 生成 tileset.json。
// 坐标系：本地 ENU（x=东, y=北, z=上），单位为米。所有几何以 Y-up 的 glTF 交付，
// 由 tileset 的 transform 旋转回 Z-up，运行时再经 modelMatrix 放到真实经纬度。
//
// 用法：node scripts/generate-tileset.mjs
// 输出：public/data/plant/tileset.json 与 public/data/plant/0.b3dm
// ---------------------------------------------------------------------------
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../public/data/plant')
fs.mkdirSync(OUT_DIR, { recursive: true })

// 顶点 / 索引累积器
const positions = [] // [x,y,z] * N （本地 ENU，z 上）
const normals = []
const colors = [] // [r,g,b,a] * N
const indices = []
let vCount = 0

function pushVert(p, n, c) {
  positions.push(p[0], p[1], p[2])
  normals.push(n[0], n[1], n[2])
  colors.push(c[0], c[1], c[2], c[3] ?? 1)
  vCount++
  return vCount - 1
}

// 盒子（轴对齐，中心 cx,cy,cz，半尺寸 hx,hy,hz）
function addBox(cx, cy, cz, sx, sy, sz, color) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2
  const c = [
    [cx - hx, cy - hy, cz - hz], [cx + hx, cy - hy, cz - hz], [cx + hx, cy + hy, cz - hz], [cx - hx, cy + hy, cz - hz],
    [cx - hx, cy - hy, cz + hz], [cx + hx, cy - hy, cz + hz], [cx + hx, cy + hy, cz + hz], [cx - hx, cy + hy, cz + hz],
  ]
  const faces = [
    { idx: [0, 1, 2, 3], n: [0, 0, -1] },
    { idx: [4, 5, 6, 7], n: [0, 0, 1] },
    { idx: [0, 1, 5, 4], n: [0, -1, 0] },
    { idx: [2, 3, 7, 6], n: [0, 1, 0] },
    { idx: [1, 2, 6, 5], n: [1, 0, 0] },
    { idx: [0, 3, 7, 4], n: [-1, 0, 0] },
  ]
  for (const f of faces) {
    const base = vCount
    for (const i of f.idx) pushVert(c[i], f.n, color)
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
}

// 沿 Z 轴的圆柱（底 cz, 顶 cz+height），含侧壁 + 顶/底盖
function addCylinderZ(cx, cy, cz, radius, height, segments, color) {
  const top = cz + height
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2
    const a1 = ((i + 1) / segments) * Math.PI * 2
    const x0 = cx + radius * Math.cos(a0), y0 = cy + radius * Math.sin(a0)
    const x1 = cx + radius * Math.cos(a1), y1 = cy + radius * Math.sin(a1)
    const n0 = [Math.cos(a0), Math.sin(a0), 0], n1 = [Math.cos(a1), Math.sin(a1), 0]
    const b = vCount
    pushVert([x0, y0, cz], n0, color); pushVert([x1, y1, cz], n1, color)
    pushVert([x1, y1, top], n1, color); pushVert([x0, y0, top], n0, color)
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3)
  }
  // 顶盖
  let b = vCount
  const topC = pushVert([cx, cy, top], [0, 0, 1], color)
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2, a1 = ((i + 1) / segments) * Math.PI * 2
    const v0 = pushVert([cx + radius * Math.cos(a0), cy + radius * Math.sin(a0), top], [0, 0, 1], color)
    const v1 = pushVert([cx + radius * Math.cos(a1), cy + radius * Math.sin(a1), top], [0, 0, 1], color)
    indices.push(topC, v0, v1)
  }
  // 底盖
  b = vCount
  const botC = pushVert([cx, cy, cz], [0, 0, -1], color)
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2, a1 = ((i + 1) / segments) * Math.PI * 2
    const v0 = pushVert([cx + radius * Math.cos(a0), cy + radius * Math.sin(a0), cz], [0, 0, -1], color)
    const v1 = pushVert([cx + radius * Math.cos(a1), cy + radius * Math.sin(a1), cz], [0, 0, -1], color)
    indices.push(botC, v1, v0)
  }
}

// 任意朝向的圆柱（用于管线），from/to 为本地坐标
function addPipe(from, to, radius, segments, color) {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2]
  const len = Math.hypot(dx, dy, dz)
  if (len < 1e-6) return
  const d = [dx / len, dy / len, dz / len]
  // 求与 d 垂直的两个基向量 u,w
  let up = Math.abs(d[2]) < 0.99 ? [0, 0, 1] : [0, 1, 0]
  const u = [
    d[1] * up[2] - d[2] * up[1],
    d[2] * up[0] - d[0] * up[2],
    d[0] * up[1] - d[1] * up[0],
  ]
  const ul = Math.hypot(...u); u[0] /= ul; u[1] /= ul; u[2] /= ul
  const w = [
    d[1] * u[2] - d[2] * u[1],
    d[2] * u[0] - d[0] * u[2],
    d[0] * u[1] - d[1] * u[0],
  ]
  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2, a1 = ((i + 1) / segments) * Math.PI * 2
    const c0 = [radius * Math.cos(a0), radius * Math.sin(a0), 0]
    const c1 = [radius * Math.cos(a1), radius * Math.sin(a1), 0]
    // 本地圆柱点 (c.xy 圆, z=±len/2) → 世界
    const t0 = localToWorld(c0[0], c0[1], -len / 2, mid, u, w, d)
    const t1 = localToWorld(c1[0], c1[1], -len / 2, mid, u, w, d)
    const t2 = localToWorld(c1[0], c1[1], len / 2, mid, u, w, d)
    const t3 = localToWorld(c0[0], c0[1], len / 2, mid, u, w, d)
    const n0 = norm([c0[0], c0[1], 0]); const n1 = norm([c1[0], c1[1], 0])
    const n0w = norm(toWorldDir(n0, u, w, d)); const n1w = norm(toWorldDir(n1, u, w, d))
    const b = vCount
    pushVert(t0, n0w, color); pushVert(t1, n1w, color)
    pushVert(t2, n1w, color); pushVert(t3, n0w, color)
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3)
  }
  function localToWorld(x, y, z, mid, u, w, d) {
    return [
      mid[0] + x * u[0] + y * w[0] + z * d[0],
      mid[1] + x * u[1] + y * w[1] + z * d[1],
      mid[2] + x * u[2] + y * w[2] + z * d[2],
    ]
  }
  function toWorldDir(n, u, w, d) {
    return [n[0] * u[0] + n[1] * w[0], n[0] * u[1] + n[1] * w[1], n[0] * u[2] + n[1] * w[2]]
  }
  function norm(v) { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l] }
}

// ----------------------------- 设施配色 -------------------------------------
const C = {
  pad: [0.36, 0.42, 0.40, 1],
  road: [0.18, 0.20, 0.22, 1],
  workshop: [0.30, 0.45, 0.55, 1],
  control: [0.55, 0.56, 0.58, 1],
  tank: [0.62, 0.66, 0.70, 1],
  tower: [0.70, 0.62, 0.45, 1],
  rack: [0.45, 0.45, 0.48, 1],
  pipe: [0.30, 0.55, 0.75, 1],
  chimney: [0.50, 0.50, 0.52, 1],
  band: [0.80, 0.25, 0.20, 1],
  dock: [0.40, 0.38, 0.36, 1],
  truck: [0.75, 0.55, 0.20, 1],
  warehouse: [0.45, 0.50, 0.40, 1],
  pump: [0.55, 0.55, 0.58, 1],
}

// ----------------------------- 厂区布局 -------------------------------------
// 厂区地坪
addBox(0, 0, -0.3, 320, 240, 0.6, C.pad)

// 道路（主干 + 环路），薄板
addBox(0, 0, 0.05, 260, 14, 0.2, C.road)
addBox(0, 0, 0.05, 14, 200, 0.2, C.road)
addBox(-110, 0, 0.05, 10, 200, 0.2, C.road)

// 生产厂房 A / B
addBox(-60, -40, 7, 42, 30, 14, C.workshop)
addBox(-60, 35, 7, 42, 30, 14, C.workshop)

// 控制室
addBox(60, 70, 4, 26, 18, 8, C.control)

// 储罐区（6 个储罐，网格排布）
const tankPos = [[-95, 60], [-70, 60], [-45, 60], [-95, 85], [-70, 85], [-45, 85]]
for (const [x, y] of tankPos) addCylinderZ(x, y, 0, 7, 13, 18, C.tank)

// 塔器（3 座高塔）
const towerPos = [[10, -60], [28, -60], [19, -78]]
for (const [x, y] of towerPos) addCylinderZ(x, y, 0, 3, 30, 16, C.tower)

// 管廊（高架横梁 + 立柱 + 顶部管线）
for (let x = -90; x <= 90; x += 30) addBox(x, -10, 9, 30, 4, 2, C.rack)
for (let x = -90; x <= 90; x += 45) addBox(x, -10, 1.5, 3, 3, 3, C.rack)
// 顶部管线（沿 x 方向数根）
for (let k = 0; k < 4; k++) addPipe([-90, -10, 10.5 + k * 0.9], [90, -10, 10.5 + k * 0.9], 0.6, 12, C.pipe)

// 连接厂房与管廊的管线
addPipe([-40, -25, 2], [-40, -10, 10.5], 0.5, 10, C.pipe)
addPipe([10, -45, 2], [10, -10, 10.5], 0.5, 10, C.pipe)

// 烟囱（高塔 + 顶部红色警示环）
addCylinderZ(45, -70, 0, 1.7, 50, 14, C.chimney)
addCylinderZ(45, -70, 44, 2.1, 4, 14, C.band)

// 装卸区（平台 + 槽车）
addBox(95, -50, 1, 34, 22, 2, C.dock)
addBox(95, -55, 3.5, 16, 7, 5, C.truck)

// 仓库
addBox(95, 50, 5, 32, 22, 10, C.warehouse)

// 若干泵（小圆柱）
for (const [x, y] of [[-40, 0], [20, 0], [60, 0], [-20, 20]]) addCylinderZ(x, y, 0, 1.6, 2.4, 12, C.pump)

// 边界立柱（示意围墙角点）
for (const [x, y] of [[-150, -110], [150, -110], [-150, 110], [150, 110]]) addCylinderZ(x, y, 0, 1.2, 4, 10, C.rack)

// ----------------------------- 包围盒 ---------------------------------------
let minX = Infinity, minY = Infinity, minZ = Infinity
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
for (let i = 0; i < positions.length; i += 3) {
  const x = positions[i], y = positions[i + 1], z = positions[i + 2]
  if (x < minX) minX = x; if (x > maxX) maxX = x
  if (y < minY) minY = y; if (y > maxY) maxY = y
  if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
}
const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2
const hx = (maxX - minX) / 2, hy = (maxY - minY) / 2, hz = (maxZ - minZ) / 2

// ----------------------------- glTF / GLB ----------------------------------
// 节点矩阵：把本地 Z-up 几何旋转为 glTF Y-up（矩阵 = R 的转置，列主序）
const nodeMatrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
// tileset 根 transform：把 glTF Y-up 旋转回 Z-up（列主序）
const tileTransform = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]

const posArray = new Float32Array(positions)
const norArray = new Float32Array(normals)
const colArray = new Float32Array(colors)
const idxArray = new Uint32Array(indices)

const posBuf = Buffer.from(posArray.buffer)
const norBuf = Buffer.from(norArray.buffer)
const colBuf = Buffer.from(colArray.buffer)
const idxBuf = Buffer.from(idxArray.buffer)

const align4 = (b) => (b.length % 4 === 0 ? b : Buffer.concat([b, Buffer.alloc(4 - (b.length % 4))]))
const posA = align4(posBuf), norA = align4(norBuf), colA = align4(colBuf), idxA = align4(idxBuf)
const bin = Buffer.concat([posA, norA, colA, idxA])
const offPos = 0
const offNor = posA.length
const offCol = offNor + norA.length
const offIdx = offCol + colA.length

const gltf = {
  asset: { version: '2.0', generator: 'plant-tileset-generator' },
  extensionsUsed: ['KHR_materials_unlit'],
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, matrix: nodeMatrix }],
  meshes: [{
    primitives: [{
      attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 },
      indices: 3,
      material: 0,
      mode: 4,
    }],
  }],
  materials: [{
    name: 'plant',
    extensions: { KHR_materials_unlit: {} },
    pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 },
  }],
  accessors: [
    {
      bufferView: 0, componentType: 5126, count: vCount, type: 'VEC3',
      min: [minX, minY, minZ], max: [maxX, maxY, maxZ],
    },
    { bufferView: 1, componentType: 5126, count: vCount, type: 'VEC3' },
    { bufferView: 2, componentType: 5126, count: vCount, type: 'VEC4' },
    { bufferView: 3, componentType: 5125, count: indices.length, type: 'SCALAR' },
  ],
  bufferViews: [
    { buffer: 0, byteOffset: offPos, byteLength: posA.length, target: 34962 },
    { buffer: 0, byteOffset: offNor, byteLength: norA.length, target: 34962 },
    { buffer: 0, byteOffset: offCol, byteLength: colA.length, target: 34962 },
    { buffer: 0, byteOffset: offIdx, byteLength: idxA.length, target: 34963 },
  ],
  buffers: [{ byteLength: bin.length }],
}

function chunk(type, buf) {
  // glTF 规范：JSON chunk 用空格(0x20)填充，BIN chunk 用 0x00 填充
  const padByte = type === 0x4E4F534A ? 0x20 : 0x00
  const pad = (4 - (buf.length % 4)) % 4
  const body = pad ? Buffer.concat([buf, Buffer.alloc(pad, padByte)]) : buf
  const header = Buffer.alloc(8)
  header.writeUInt32LE(body.length, 0)
  header.writeUInt32LE(type, 4) // type: 0x4E4F534A JSON / 0x004E4942 BIN
  return Buffer.concat([header, body])
}
const jsonStr = JSON.stringify(gltf)
const jsonBuf = Buffer.from(jsonStr, 'utf8')
const glbHeader = Buffer.alloc(12)
glbHeader.writeUInt32LE(0x46546C67, 0) // glTF
glbHeader.writeUInt32LE(2, 4)
const glbLen = 12 + 8 + jsonBuf.length + (4 - (jsonBuf.length % 4)) % 4 + 8 + idxA.length + (4 - (idxA.length % 4)) % 4
// 重新精确计算 glb 总字节
const jsonChunk = chunk(0x4E4F534A, jsonBuf)
const binChunk = chunk(0x004E4942, bin)
const glb = Buffer.concat([glbHeader, jsonChunk, binChunk])
glb.writeUInt32LE(glb.length, 8) // 长度字段必须写入实际 glb 缓冲（concat 之后）

// ----------------------------- b3dm ----------------------------------------
const featureTableJSON = JSON.stringify({ BATCH_LENGTH: 0 })
const featureTableBuf = Buffer.from(featureTableJSON, 'utf8')
const batchTableBuf = Buffer.from('{}', 'utf8')
// b3dm 规范：feature / batch table 的 JSON 必须以空格(0x20)填充到 8 字节边界
function align8(b) { const p = (8 - (b.length % 8)) % 8; return p ? Buffer.concat([b, Buffer.alloc(p, 0x20)]) : b }
const ftA = align8(featureTableBuf)
const btA = align8(batchTableBuf)
const header = Buffer.alloc(28)
header.writeUInt32LE(0x6D643362, 0) // b3dm ('b3dm' 小端)
header.writeUInt32LE(1, 4)
const byteLength = 28 + ftA.length + btA.length + glb.length
header.writeUInt32LE(byteLength, 8)
header.writeUInt32LE(ftA.length, 12)
header.writeUInt32LE(0, 16)
header.writeUInt32LE(btA.length, 20)
header.writeUInt32LE(0, 24)
const b3dm = Buffer.concat([header, ftA, btA, glb])

// ----------------------------- tileset.json ---------------------------------
const tileset = {
  asset: { version: '1.1', tilesetVersion: '1' },
  geometricError: 512,
  root: {
    boundingVolume: {
      box: [cx, cy, cz, hx, 0, 0, 0, hy, 0, 0, 0, hz],
    },
    geometricError: 0,
    refine: 'REPLACE',
    transform: tileTransform,
    content: { uri: '0.b3dm' },
  },
}

fs.writeFileSync(path.join(OUT_DIR, '0.b3dm'), b3dm)
fs.writeFileSync(path.join(OUT_DIR, 'tileset.json'), JSON.stringify(tileset, null, 2))

console.log('已生成 3D Tiles：')
console.log('  vertices =', vCount, ' triangles =', indices.length / 3)
console.log('  b3dm 字节 =', b3dm.length)
console.log('  包围盒 center =', [cx, cy, cz].map(n => n.toFixed(1)), ' half =', [hx, hy, hz].map(n => n.toFixed(1)))
console.log('  输出目录 =', OUT_DIR)
