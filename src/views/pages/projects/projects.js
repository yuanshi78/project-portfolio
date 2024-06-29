import project1 from '@images/pages/rainbow/project1.png'
import project2 from '@images/pages/rainbow/project2.png'
import project3 from '@images/pages/rainbow/project3.png'
import project4 from '@images/pages/rainbow/project4.png'
import project5 from '@images/pages/rainbow/pharmacy/1.png'
import general from '@images/pages/it_general.jpg'

export const rainbow = [
  {
    name: '可视化运维系统',
    description: '区域电，水，气系统运维管理平台',
    to: '/rainbow/smart_operation',

    image: project4,
    tags: ['vue', 'JavaScript', 'DataEase', 'echarts', 'diboot', 'ant-design-vue'],
  }, {
    name: '票务管理系统',
    description: '该系统用于管理剧场票务信息, 订单信息, 票价信息, 票价规则信息, 票价规则明细信息等',
    to: '/rainbow/cinema_hall',

    image: project3,
    tags: ['vue', 'JavaScript', 'diboot', 'ant-design-vue', 'svg'],
  },
  {
    name: '兆益生物生产管理系统',
    description: '管理生产兽药的系统',
    to: '/rainbow/pharmacy',

    image: project5,
    tags: ['vue', 'JavaScript', 'diboot', 'ant-design-vue', 'Colaiven', 'echarts'],
  },
  {
    name: '智慧区域',
    description: '大屏系统包括三个大屏: 设备运维大屏, 综合态势大屏和智慧安防大屏. 每个大屏展示相关的数据. 大屏中间展示区域地图或监控设备拓扑图 . 地图上展示热力图, 摄像头.可以播放来自摄像头的视频. 拓扑图上展示监控设备结构,设备网络速率和状态. 拓扑图工具用于创建监控设备拓扑图',
    // url: 'https://8-hospital-datavis-demo-yuanshi-public-bbc282b11cf332f4ae1e0fd2.gitlab.io/#/screen1',
    to: '/rainbow/smart_area',
    image: project1,
    tags: ['vue', 'JavaScript', 'echarts'],
  },
  {
    name: '拓扑图工具',
    description: '创建监控设备拓扑图的应用',
    to: '/rainbow/topo_tool',
    //url: 'https://topo-tool-demo-yuanshi-public-5d3fd63e9725a30883c298fcc611f965b.gitlab.io',
    image: project2,
    tags: ['vue', 'JavaScript', 'twave js'],
  },
]

export const jinhe = [
  {
    name: '中煤陕西应急指挥系统',
    description: '项目是为中煤鄂尔多斯一家化工厂开发的一款预警监控系统',
    to: '/jinhe/chemistry_plant',

    image: general,
    tags: ['vue 2', 'JavaScript', 'Cesium js'],
  },
  {
    name: '瑞德宝尔智慧矿山',
    description: '陕西瑞德宝尔投资有限公司安全，生产，运营管理系统',
    to: '/jinhe/ruidebaoer',

    image: general,
    tags: ['vue 2', 'JavaScript'],
  },
]

export const shuzixinxi = [
  {
    name: '谷堆书城',
    description: '提供在线阅读电子书的服务的平台',
    to: 'shuzixinxi/book_reader',

    image: general,
    tags: ['HTML', 'CSS', 'JavaScript'],
  },
  {
    name: '魔幻恐龙',
    description: '小游戏',
    to: '/shuzixinxi/dinosaur',

    image: general,
    tags: ['HTML5', 'CSS', 'JavaScript', 'LayaAir'],
  },
]
