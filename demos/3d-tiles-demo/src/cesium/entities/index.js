// ordos 移植实体统一出口（一个类型一个文件，新增实体只需在这里加一行）
export { createCriticalZone } from './CriticalZone.js'
export { createFence } from './Fence.js'
export { createFire } from './Fire.js'
export { createRadarCoverage } from './RadarCoverage.js'
export { createWindDirection, windDirectionMatrix } from './WindDirection.js'
export { createSmokeLocal } from './SmokeLocal.js'
export { createFireVehicle } from './FireVehicle.js'
export { cylinderMatrix, toColor } from './shared.js'
