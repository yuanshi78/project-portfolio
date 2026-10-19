import fs from 'node:fs';
import path from 'node:path';

const [sourceArg, outputArg = 'public/data/imported-model'] = process.argv.slice(2)
if (!sourceArg) {
  console.error('Usage: npm run convert-glb-tiles -- <source.glb> [output-directory]')
  process.exit(1)
}

const sourcePath = path.resolve(sourceArg)
const outputDir = path.resolve(outputArg)
const glb = fs.readFileSync(sourcePath)
if (glb.toString('ascii', 0, 4) !== 'glTF' || glb.readUInt32LE(4) !== 2 || glb.readUInt32LE(8) !== glb.length) {
  throw new Error('Source must be a valid GLB 2.0 file')
}

let gltf
for (let offset = 12; offset + 8 <= glb.length;) {
  const chunkLength = glb.readUInt32LE(offset)
  const chunkType = glb.readUInt32LE(offset + 4)
  if (chunkType === 0x4E4F534A) {
    gltf = JSON.parse(glb.toString('utf8', offset + 8, offset + 8 + chunkLength))
    break
  }
  offset += 8 + chunkLength
}
if (!gltf) throw new Error('GLB is missing its JSON chunk')

function multiplyMatrices(left, right) {
  const result = new Array(16).fill(0)
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let index = 0; index < 4; index++) {
        result[column * 4 + row] += left[index * 4 + row] * right[column * 4 + index]
      }
    }
  }
  return result
}

function nodeMatrix(node) {
  if (node.matrix) return node.matrix
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1]
  const [sx, sy, sz] = node.scale || [1, 1, 1]
  const [tx, ty, tz] = node.translation || [0, 0, 0]
  return [
    (1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + z * w)) * sx, (2 * (x * z - y * w)) * sx, 0,
    (2 * (x * y - z * w)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + x * w)) * sy, 0,
    (2 * (x * z + y * w)) * sz, (2 * (y * z - x * w)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    tx, ty, tz, 1,
  ]
}

const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
function includeNodeBounds(nodeIndex, parentMatrix) {
  const node = gltf.nodes[nodeIndex]
  const transform = multiplyMatrices(parentMatrix, nodeMatrix(node))
  if (node.mesh !== undefined) {
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      const position = gltf.accessors[primitive.attributes.POSITION]
      if (!position.min || !position.max) throw new Error('POSITION accessor must include min/max bounds')
      for (const x of [position.min[0], position.max[0]]) {
        for (const y of [position.min[1], position.max[1]]) {
          for (const z of [position.min[2], position.max[2]]) {
            const point = [
              transform[0] * x + transform[4] * y + transform[8] * z + transform[12],
              transform[1] * x + transform[5] * y + transform[9] * z + transform[13],
              transform[2] * x + transform[6] * y + transform[10] * z + transform[14],
            ]
            for (let axis = 0; axis < 3; axis++) {
              bounds.min[axis] = Math.min(bounds.min[axis], point[axis])
              bounds.max[axis] = Math.max(bounds.max[axis], point[axis])
            }
          }
        }
      }
    }
  }
  for (const child of node.children || []) includeNodeBounds(child, transform)
}

const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
const scene = gltf.scenes?.[gltf.scene || 0]
if (!scene?.nodes?.length) throw new Error('GLB scene has no nodes')
for (const node of scene.nodes) includeNodeBounds(node, identity)
const center = bounds.min.map((value, axis) => (value + bounds.max[axis]) / 2)
const halfAxes = bounds.min.map((value, axis) => Math.max((bounds.max[axis] - value) / 2, 0.01) * 1.02)

function align8(buffer, offset) {
  const padding = (8 - (offset + buffer.length) % 8) % 8
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, 0x20)]) : buffer
}

const featureTable = align8(Buffer.from('{"BATCH_LENGTH":0}'), 28)
const batchTable = align8(Buffer.from('{}'), 28 + featureTable.length)
const header = Buffer.alloc(28)
header.write('b3dm', 0, 'ascii')
header.writeUInt32LE(1, 4)
header.writeUInt32LE(28 + featureTable.length + batchTable.length + glb.length, 8)
header.writeUInt32LE(featureTable.length, 12)
header.writeUInt32LE(0, 16)
header.writeUInt32LE(batchTable.length, 20)
header.writeUInt32LE(0, 24)

const tileset = {
  asset: { version: '1.1' },
  geometricError: 1,
  root: {
    boundingVolume: { box: [center[0], center[1], center[2], halfAxes[0], 0, 0, 0, halfAxes[1], 0, 0, 0, halfAxes[2]] },
    geometricError: 0,
    refine: 'ADD',
    transform: [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1],
    content: { uri: '0.b3dm' },
  },
}

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(path.join(outputDir, '0.b3dm'), Buffer.concat([header, featureTable, batchTable, glb]))
fs.writeFileSync(path.join(outputDir, 'tileset.json'), JSON.stringify(tileset, null, 2))
console.log(`Wrote ${path.join(outputDir, 'tileset.json')} and 0.b3dm (${glb.length} GLB bytes)`)
