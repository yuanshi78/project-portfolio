import { addCylinder, alp, rgb, toColor } from './shared.js'

// --------------------------- 危险区 CriticalZone --------------------------------
// ordos：圆柱 + 由中心向外扩散的同心波纹
export function createCriticalZone(scene, opts = {}) {
  const {
    center,
    radius = 24,
    height = 10,
    color = toColor('#770000', 1.0),
  } = opts
  return addCylinder(scene, {
    center, radius, height, color,
    fragmentShaderSource: `
in vec3 v_pos;
void main(){
    float time = float(czm_frameNumber) * 0.02;
    out_FragColor = vec4(${rgb(color)}, float(${alp(color)}) * abs(sin((-time + length(v_pos.xy) / 0.15) / 2.0)));
}`,
  })
}
