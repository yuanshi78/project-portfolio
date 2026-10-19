import * as Cesium from 'cesium'

// ---------------------------------------------------------------------------
// ordos 移植实体的共用部分：顶点着色器、颜色工具、圆柱骨架。
// 每个实体单独一个文件，这里只放它们共用的东西。
// ---------------------------------------------------------------------------

export const MODEL_BASE = import.meta.env.BASE_URL + 'data/model/'

// ordos 自定义实体的顶点着色器：把几何体局部坐标传给片元着色器，
// 用于生成波纹 / 雷达扫描 / 沿高度流动等动画。
// 注意：Cesium 1.146 走 WebGL2 / GLSL ES 3.00，必须写 in/out（不能写 attribute/varying），
// 片元输出用 out_FragColor（Cesium 检测到该标识符会自动补 layout(location=0) 声明）。
export const ORDOS_VERT = `
in vec3 position3DHigh;
in vec3 position3DLow;
in vec3 normal;
in vec3 tangent;
// batchId 不能省：Cesium 会把 main() 包装成 czm_non_pick_main()，
// 并生成 "v_pickColor = czm_batchTable_pickColor(batchId);"，缺少声明会编译失败。
in float batchId;

out vec3 v_pos;

void main()
{
    v_pos = position3DHigh + position3DLow;
    vec4 p = czm_computePosition();
    gl_Position = czm_modelViewProjectionRelativeToEye * p;
}`

export const rgb = (c) => `${c.red.toFixed(4)}, ${c.green.toFixed(4)}, ${c.blue.toFixed(4)}`
export const alp = (c) => c.alpha.toFixed(4)
export const toColor = (hex, a = 1) => Cesium.Color.fromCssColorString(hex).withAlpha(a)

// 圆柱 modelMatrix：ENU(地面点) → 抬高 height/2（让圆柱坐在地面上）→ 缩放(radius, radius, height)
export function cylinderMatrix(center, radius, height) {
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center)
  const lift = Cesium.Matrix4.fromTranslation(new Cesium.Cartesian3(0, 0, height / 2))
  const scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(radius, radius, height))
  const m = Cesium.Matrix4.multiply(enu, lift, new Cesium.Matrix4())
  return Cesium.Matrix4.multiply(m, scale, new Cesium.Matrix4())
}

// 单位圆柱 + 自定义片元着色器（CriticalZone / RadarCoverage 的共同骨架）
export function addCylinder(scene, { center, radius, height, color, fragmentShaderSource }) {
  const geometry = Cesium.CylinderGeometry.createGeometry(
    new Cesium.CylinderGeometry({ length: 1.0, topRadius: 1.0, bottomRadius: 1.0 }),
  )
  const primitive = new Cesium.Primitive({
    asynchronous: false,
    allowPicking: false,
    geometryInstances: new Cesium.GeometryInstance({
      geometry,
      attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.WHITE) },
    }),
    appearance: new Cesium.PerInstanceColorAppearance({
      closed: true,
      vertexShaderSource: ORDOS_VERT,
      fragmentShaderSource,
    }),
  })
  scene.primitives.add(primitive)
  primitive.modelMatrix = cylinderMatrix(center, radius, height)
  return primitive
}
