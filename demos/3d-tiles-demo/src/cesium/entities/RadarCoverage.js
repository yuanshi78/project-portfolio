import { addCylinder, alp, rgb, toColor } from './shared.js'

// ------------------------ 监测区域 RadarCoverage -------------------------------
// ordos：圆柱 + 雷达扇形扫描（注：ordos 原色 alpha=0 会全透明，这里修正为可见）
export function createRadarCoverage(scene, opts = {}) {
  const {
    center,
    radius = 32,
    height = 12,
    color = toColor('#31ff94', 0.9),
  } = opts
  return addCylinder(scene, {
    center, radius, height, color,
    fragmentShaderSource: `
in vec3 v_pos;

#define PI 3.1415926535898
const float PI_2 = PI / 2.0;

float arctan2(float y, float x){
    if (x > 0.0) return atan(y / x);
    else if (x < 0.0 && y >= 0.0) return atan(y / x) + PI;
    else if (x < 0.0 && y < 0.0) return atan(y / x) - PI;
    else if (x == 0.0 && y > 0.0) return PI_2;
    else if (x == 0.0 && y < 0.0) return -PI_2;
    else return 0.0;
}

void main(){
    float time = float(czm_frameNumber) * 0.02;
    float angle = arctan2(v_pos.y, v_pos.x);
    angle = mod(-time + angle, PI * 2.0);
    float a = 0.0;
    if (angle >= PI) a = (angle - PI) / PI;
    // 扫描网格：ordos 的屏幕扫描线
    if (mod(gl_FragCoord.s, 3.0) < 1.0 || mod(gl_FragCoord.t, 3.0) < 1.0) a = 0.0;
    out_FragColor = vec4(${rgb(color)}, float(${alp(color)}) * a);
}`,
  })
}
