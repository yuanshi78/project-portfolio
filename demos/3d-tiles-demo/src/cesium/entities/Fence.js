import * as Cesium from 'cesium'
import { alp, ORDOS_VERT, rgb, toColor } from './shared.js'

// ---------------------------- 电子围栏 Fence -----------------------------------
// ordos：按输入点生成「底点 + 抬高点」两排顶点并三角化成墙面，
// 着色器沿高度流动形成光带（原 ordos 用 preRender 注入 time uniform，
// 这里改用内置 czm_frameNumber，等价且更稳）。
export function createFence(scene, opts = {}) {
  const { worldPoints, height = 4, color = toColor('#ffff00', 0.6) } = opts
  if (!Array.isArray(worldPoints) || worldPoints.length < 2) return null

  const first = worldPoints[0]
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(first)
  const world2Local = Cesium.Matrix4.inverse(modelMatrix, new Cesium.Matrix4())

  const pos = []
  for (const p of worldPoints) {
    const lp = Cesium.Matrix4.multiplyByPoint(world2Local, p, new Cesium.Cartesian3())
    pos.push(lp.x, lp.y, lp.z)
    const top = Cesium.Cartesian3.add(lp, new Cesium.Cartesian3(0, 0, height), new Cesium.Cartesian3())
    pos.push(top.x, top.y, top.z)
  }

  const vertexCount = pos.length / 3
  const ind = []
  for (let i = 2; i < vertexCount; i += 2) {
    ind.push(i - 1, i - 2, i)
    ind.push(i - 1, i, i + 1)
  }
  // 首尾闭合
  const last = (pos.length / 6 - 1) * 2
  ind.push(last, 0, last + 1)
  ind.push(last + 1, 0, 1)

  let geometry = new Cesium.Geometry({
    attributes: new Cesium.GeometryAttributes({
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: new Float64Array(pos),
      }),
    }),
    indices: new Uint16Array(ind),
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: new Cesium.BoundingSphere(new Cesium.Cartesian3(0, 0, 0), 999990),
  })
  geometry = Cesium.GeometryPipeline.computeNormal(geometry)

  const primitive = new Cesium.Primitive({
    asynchronous: false,
    allowPicking: false,
    geometryInstances: new Cesium.GeometryInstance({
      geometry,
      modelMatrix,
      attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.WHITE) },
    }),
    appearance: new Cesium.Appearance({
      translucent: true,
      closed: false,
      renderState: {
        blending: Cesium.BlendingState.PRE_MULTIPLIED_ALPHA_BLEND,
        depthTest: { enabled: true },
        depthMask: false,
      },
      vertexShaderSource: ORDOS_VERT,
      fragmentShaderSource: `
in vec3 v_pos;
void main(){
    float time = float(czm_frameNumber) * 0.15;
    out_FragColor = vec4(${rgb(color)}, float(${alp(color)}) * abs(sin((time + v_pos.z) / 2.0)));
}`,
    }),
  })
  scene.primitives.add(primitive)
  return primitive
}
