import project1 from '@images/pages/rainbow/project1.png'
import project2 from '@images/pages/rainbow/project2.png'
import project3 from '@images/pages/rainbow/project3.png'
import project4 from '@images/pages/rainbow/project4.png'

export const rainbow = [
  {
    name: '可视化运维系统',
    description: '---',
    to: '/rainbow/smart_operation',

    image: project4,
    tags: ['vue', 'JavaScript', 'DataEase'],
  }, {
    name: '票务管理系统',
    description: '该系统用于管理剧场票务信息, 订单信息, 票价信息, 票价规则信息, 票价规则明细信息等',
    to: '/rainbow/cinema_hall',

    image: project3,
    tags: ['vue', 'JavaScript'],
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
    tags: ['vue', 'JavaScript'],
  },
]
