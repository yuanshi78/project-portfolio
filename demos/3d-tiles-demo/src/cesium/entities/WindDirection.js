import * as Cesium from 'cesium'
import { MODEL_BASE, toColor } from './shared.js'

// ----------------------------- 风向 WindDirection ------------------------------
// ordos：glTF 箭头模型 + 绕 Z 旋转 direction（ordos 用已废弃的 Model.fromGltf，
// 这里改用 Cesium 1.146 的 Model.fromGltfAsync）
export function windDirectionMatrix(center, direction = 0, level = 0.15) {
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center)
  const rota = Cesium.Matrix4.fromRotationTranslation(
    Cesium.Matrix3.fromRotationZ(-Cesium.Math.toRadians(direction)),
    new Cesium.Cartesian3(0, 0, 0),
  )
  const scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(level, level, level / 2))
  Cesium.Matrix4.multiply(rota, scale, rota)
  return Cesium.Matrix4.multiply(enu, rota, new Cesium.Matrix4())
}

export async function createWindDirection(scene, opts = {}) {
  const { center, direction = 0, level = 0.15, color = toColor('#ff3b3b', 1.0) } = opts
  const model = await Cesium.Model.fromGltfAsync({
    url: MODEL_BASE + 'windDirection/direction.glb',
    modelMatrix: windDirectionMatrix(center, direction, level),
  })
  if (color) model.color = color
  scene.primitives.add(model)
  return model
}
