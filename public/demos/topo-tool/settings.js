/**
 * 拓扑图上的元素的类型
 */
const topoElementTypes = [
  {
    value: 'default',
    label: '默认节点',
    icon: 'topo_icons/default.png',
  },
  {
    value: 'switch',
    label: '交换机',
    icon: 'topo_icons/switch.png',
    brands: ['华三', '海康威视', '大华', '宇视'],
  },
  {
    value: 'camera-semisph',
    label: '半球摄像机',
    icon: 'topo_icons/camera-semisph.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    value: 'camera-semisph-snd',
    label: '半球摄像机+外拾音',
    icon: 'topo_icons/camera-semisph-snd.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    value: 'camera-semisph-snd1',
    label: '半球摄像机+内拾音',
    icon: 'topo_icons/camera-semisph-snd1.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    value: 'camera-sph',
    label: '球型摄像机',
    icon: 'topo_icons/camera-sph.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    value: 'camera-qx',
    label: '枪型摄像机',
    icon: 'topo_icons/camera-qx.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    value: 'face-recognition',
    label: '人脸识别摄像机',
    icon: 'topo_icons/face-recognition.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    value: 'carno-recognition',
    label: '车牌识别摄像机',
    icon: 'topo_icons/carno-recognition.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    value: 'storage',
    label: '存储',
    icon: 'topo_icons/storage.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    value: 'server',
    label: '服务器',
    icon: 'topo_icons/server.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    label: '电脑',
    value: 'computer',
    icon: 'topo_icons/computer.png',
    brand: ['联想', 'IBM', '戴尔'],
  },
  {
    label: '云',
    value: 'cloud',
    icon: 'topo_icons/cloud.png',
  },
  {
    label: '路由器',
    value: 'router',
    icon: 'topo_icons/router.png',
    brand: ['锐捷', '华为', '华三'],
  },
  {
    label: '防火墙',
    value: 'firewall',
    icon: 'topo_icons/firewall.png',
    brand: ['锐捷', '华为', '华三'],
  },
  {
    label: 'LAN',
    value: 'LAN',
  },
  {
    label: '解码器',
    value: 'decoder',
    icon: 'topo_icons/decoder.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    label: '电视墙',
    value: 'tv-wall',
    icon: 'topo_icons/tv-wall.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    label: '网络道闸',
    value: 'net-gate',
    icon: 'topo_icons/net-gate.png',
    brands: ['捷顺', '中控'],
  },
  {
    label: '门禁一体机',
    value: 'entrance-app',
    icon: 'topo_icons/entrance.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    label: '网络语音对讲',
    value: 'intercom',
    icon: 'topo_icons/intercom.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    label: '网络一键报警',
    value: 'quick-report',
    icon: 'topo_icons/quick-report.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    label: '网络硬盘录像机',
    value: 'nvr',
    icon: 'topo_icons/nvr.png',
    brands: ['海康威视', '大华', '宇视'],
  },
  {
    label: '液晶监视器',
    value: 'monitor',
    icon: 'topo_icons/monitor.png',
    brands: ['慧联', '海康威视', '大华', '宇视'],
  },
];

/**
 * 设备品牌
 */
//const equipBrands = ['海康威视', '华三', '慧联'];

const apiBaseURL = 'http://192.168.1.150:10015/equipment';
const defaultProjectId = 'fortesting';
