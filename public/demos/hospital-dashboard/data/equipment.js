/**
 * 设备分布
 */
const equipDistrib = [
  {name: '门禁设备', value: 60},
  {name: '监控设备', value: 20},
  {name: '道闸设备', value: 40},
  {name: '消防设备', value: 50},
];

/**
 * 设备告警数
 */
const equipAlarms =  [
  {
    name: '网络设备',
    data: [40, 20, 70, 70, 40, 30, 100],
  },
  {
    name: '监控设备',
    data: [77, 80, 125, 25, 76, 88, 30],
  },
];

/**
 * 设备工单趋势
 */
const workOrdersStat =  [
  {
    name: '等待处理',
    data: [100, 50, 150, 70, 80, 60, 200],
  },
  {
    name: '已处里',
    data: [80, 35, 125, 50, 70, 40, 100],
  },
];

/**
 * 设备报修
 */
const equipRepairData =  [
  {
    id: '123',
    name: '监控',
    place: '新发热门诊1层',
    defect: '磨损',
    no: 'N1-8971H',
    state: '待处理',
  },
  {
    id: '124',
    name: '监控',
    place: '行政楼1层',
    defect: '磨损',
    no: 'N5-3451G',
    state: '已处理',
  },
  {
    id: '125',
    name: '监控',
    place: '住院楼2层',
    defect: '磨损',
    no: 'N1-5367G2',
    state: '待处理',
  },
  {
    id: '126',
    name: '监控',
    place: '行政楼2层',
    defect: '磨损',
    no: 'N1-53689J',
    state: '待处理',
  },
  {
    id: '127',
    name: '监控',
    place: '门诊楼2层',
    defect: '磨损',
    no: 'N1-9367GF2',
    state: '已处理',
  },
];

/**
 * 监控分布
 */
const controlDistribData = [
  {
    name: '设备分布',
    data: [105, 78, 22, 38, 7, 4, 5, 15, ],
    //'门诊楼', '住院楼', '新发热门诊', '院内外围', '人脸识别摄像机', '人脸识别门禁', '行政楼', '传染楼', '肝病楼',
  },
];


/**
 * 告警信息
 */
const alarmReportsData = [
  {
    id: '123',
    camera: '2层采血处',
    place: '门诊楼一层',
    alarm: '监控告警',
    reason: '断电',
  },
  {
    id: '124',
    camera: '1层北-西',
    place: '新发热门诊一层',
    alarm: '消防告警',
    reason: '烟雾',
  },
  {
    id: '125',
    camera: '二层档案室门口',
    place: '行政楼',
    alarm: '消防告警',
    reason: 'XX设备故障',
  },
  {
    id: '126',
    camera: '1层南通道西向中',
    place: '传染楼',
    alarm: '监控告警',
    reason: '摄像头故障',
  },
  {
    id: '127',
    camera: '五层北通道西',
    place: '住院楼',
    alarm: '消防告警',
    reason: '烟雾',
  },
  {
    id: '128',
    camera: '行政楼门口',
    place: '院内外围',
    alarm: '消防告警',
    reason: '高温',
  },
  {
    id: '129',
    camera: '七层西门',
    place: '住院楼',
    alarm: '监控告警',
    reason: '断电',
  },
  {
    id: '130',
    camera: '二层南北通道',
    place: '行政楼',
    alarm: '消防告警',
    reason: '烟雾',
  },
  {
    id: '131',
    camera: '南门口',
    place: '院内外围',
    alarm: '监控告警',
    reason: '入侵',
  },
];

/**
 * 报警数量
 */
const alarmReportsQnty = {
  fireControl: 2,  // 消防报警
  security: 8,   // 治安报警
};

/**
 * 设备报修统计
 */
const equipRepairStats = [
  {
    name: '交换机',
    data: [30, 35, 60, 40, 20, 25, 40, 36],
  },
  {
    name: '路由器',
    data: [10, 35, 0, 16, 13, 25, 0, 10],
  },
  {
    name: '负载均衡',
    data: [10, 15, 10, 6, 10, 15, 5, 25],
  },
  {
    name: '监控设备',
    data: [20, 30, 10, 40, 20, 15, 5, 25],
  },
  {
    name: '消防设备',
    data: [10, 15, 5, 20, 20, 30, 3, 30],
  },
];

/**
 * 工单完成统计
 */
const workOrderStateStats = [
  {
    name: '待处理',
    data: [10, 20, 10, 15, 20, 18, 16,],
  },
  {
    name: '处理中',
    data: [5, 10, 8, 20, 18, 12, 17,],
  },
  {
    name: '已处理',
    data: [20, 8, 10, 5, 6, 10, 5,],
  },
  {
    name: '已关闭',
    data: [20, 30, 10, 20, 15, 3, 6],
  },
];

/**
 * 告警分类比例
 */
const alarmTypes = [
  {name: '门禁', value: 20},
  {name: '网络状态', value: 15},
  {name: '磁盘', value: 30},
  {name: '处理器', value: 10},
  {name: '硬件内存', value: 15},
  {name: '容器', value: 20},
  {name: '应用监控', value: 18},
  {name: '操作系统', value: 2},
  {name: '基础组件', value: 15},
  {name: '其他', value: 15},
];

/**
 * 设备异常
 */
const equipMalfunctionData = [
  {
    id: '123',
    name: '监控',
    place: 'A栋1层',
    defect: '磨损',
    no: 'N1-8971H',
    time: '2022-03-09 11:03:10',
  },
  {
    id: '124',
    name: '监控',
    place: 'B栋1层',
    defect: '磨损',
    no: 'N5-3451G',
    time: '2022-03-08 10:20:06',
  },
  {
    id: '125',
    name: '监控',
    place: 'C栋2层',
    defect: '磨损',
    no: 'N1-5367G2',
    time: '2022-03-07 22:10:12',
  },
  {
    id: '126',
    name: '监控',
    place: 'C栋2层',
    defect: '磨损',
    no: 'N1-5367G2',
    time: '2022-03-07 17:40:05',
  },
  {
    id: '127',
    name: '监控',
    place: 'C栋2层',
    defect: '磨损',
    no: 'N1-5367G2',
    time: '2022-03-07 03:26:30',
  },
];

/**
 * 设备健康数据
 */
const equipmentHealthData = [
  {
    value: [50, 67, 10, 7, 3,],   // 健康、正常、故障早期、故障中期、故障晚期
    name: '交换机',
  },
  {
    value: [60, 78, 5, 2, 1,],
    name: '路由器',
  },
  {
    value: [10, 5, 2, 2, 1,],
    name: '负载均衡',
  },
  {
    value: [100, 60, 8, 1, 0,],
    name: '监控设备',
  },
  {
    value: [60, 56, 5, 1, 0,],
    name: '消防设备',
  },
];

/**
 * 摄像头
 */
const cameraList = {
  'cf210d9476114da3a1a94b9dbb0e155e': [
    {
      "infoId": "123",
      "sipuserId": "1111",
      "tongdaoId": "11111",
      "ip": "1.123.35.100",
      "areaname": "1层",
      "state": 1,
      "name": "123456",

    },
    {
      "id": "124",
      "sipuserId": "11111",
      "tongdaoId": "11111",
      "ip": "1.123.35.101",
      "state": 1,
      "name": "123457",
      "areaname": "2层",
    },
  ],

  'cf210d9476114da3a1a94b9dbb0e155a': [
    {
      "infoId": "123",
      "sipuserId": "1111",
      "tongdaoId": "11111",
      "ip": "1.123.35.100",
      "areaname": "1层",
      "state": 1,
      "name": "123456",

    },
    {
      "id": "124",
      "sipuserId": "11111",
      "tongdaoId": "11111",
      "ip": "1.123.35.101",
      "state": 1,
      "name": "123457",
      "areaname": "2层",
    },
  ],

  'cf210d9476114da3a1a94b9dbb0e155d': [
    {
      "infoId": "123",
      "sipuserId": "1111",
      "tongdaoId": "11111",
      "ip": "1.123.35.100",
      "areaname": "1层",
      "state": 1,
      "name": "123456",

    },
    {
      "id": "124",
      "sipuserId": "11111",
      "tongdaoId": "11111",
      "ip": "1.123.35.101",
      "state": 1,
      "name": "123457",
      "areaname": "2层",
    },
  ],

  'cf210d9476114da3a1a94b9dbb0e155e': [
    {
      "infoId": "123",
      "sipuserId": "1111",
      "tongdaoId": "11111",
      "ip": "1.123.35.100",
      "areaname": "1层",
      "state": 1,
      "name": "123456",

    },
    {
      "id": "124",
      "sipuserId": "11111",
      "tongdaoId": "11111",
      "ip": "1.123.35.101",
      "state": 1,
      "name": "123457",
      "areaname": "2层",
    },
  ],

  'cf210d9476114da3a1a94b9dbb0e155g': [
    {
      "infoId": "123",
      "sipuserId": "1111",
      "tongdaoId": "11111",
      "ip": "1.123.35.100",
      "areaname": "1层",
      "state": 1,
      "name": "123456",

    },
    {
      "id": "124",
      "sipuserId": "11111",
      "tongdaoId": "11111",
      "ip": "1.123.35.101",
      "state": 1,
      "name": "123457",
      "areaname": "2层",
    },
  ],

  'cf210d9476114da3a1a94b9dbb0e155f': [
    {
      "infoId": "123",
      "sipuserId": "1111",
      "tongdaoId": "11111",
      "ip": "1.123.35.100",
      "areaname": "1层",
      "state": 1,
      "name": "123456",

    },
    {
      "id": "124",
      "sipuserId": "11111",
      "tongdaoId": "11111",
      "ip": "1.123.35.101",
      "state": 1,
      "name": "123457",
      "areaname": "2层",
    },
  ],

  'cf210d9476114da3a1a94b9dbb0e155h': [
    {
      "infoId": "123",
      "sipuserId": "1111",
      "tongdaoId": "11111",
      "ip": "1.123.35.100",
      "areaname": "1层",
      "state": 1,
      "name": "123456",

    },
    {
      "id": "124",
      "sipuserId": "11111",
      "tongdaoId": "11111",
      "ip": "1.123.35.101",
      "state": 1,
      "name": "123457",
      "areaname": "2层",
    },
  ],

  'cf210d9476114da3a1a94b9dbb0e155b': [
    {
      "infoId": "123",
      "sipuserId": "1111",
      "tongdaoId": "11111",
      "ip": "1.123.35.100",
      "areaname": "1层",
      "state": 1,
      "name": "123456",

    },
    {
      "id": "124",
      "sipuserId": "11111",
      "tongdaoId": "11111",
      "ip": "1.123.35.101",
      "state": 1,
      "name": "123457",
      "areaname": "2层",
    },
  ],
};