<script setup>

import picture1 from '@images/pages/rainbow/smart-area/1.png'
import picture2 from '@images/pages/rainbow/smart-area/2.png'
import picture3 from '@images/pages/rainbow/smart-area/3.png'
import picture4 from '@images/pages/rainbow/smart-area/4.png'
import picture5 from '@images/pages/rainbow/smart-area/5.png'
</script>

<template>
  <v-row>
    <v-col cols="12">
      <div class="text-h3">智慧区域</div>
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12">
      <div class="text-default">2020/08 - 2023/04</div>
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12">
      <v-carousel>
        <v-carousel-item>
          <v-sheet height="100%">
            <v-img
              :src="picture1"
              height="100%"
            ></v-img>
          </v-sheet>
        </v-carousel-item>
        <v-carousel-item>
          <v-sheet height="100%">
            <v-img
              :src="picture2"
              height="100%"
            ></v-img>
          </v-sheet>
        </v-carousel-item>
        <v-carousel-item>
          <v-sheet height="100%">
            <v-img
              :src="picture3"
              height="100%"
            ></v-img>
          </v-sheet>
        </v-carousel-item>
        <v-carousel-item>
          <v-sheet height="100%">
            <v-img
              :src="picture4"
              height="100%"
            ></v-img>
          </v-sheet>
        </v-carousel-item>
        <v-carousel-item>
          <v-sheet height="100%">
            <v-img
              :src="picture5"
              height="100%"
            ></v-img>
          </v-sheet>
        </v-carousel-item>
      </v-carousel>
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12">
      <v-card>
        <v-card-text>
          <div class="text-h5">简介</div>
          <p>"智慧区域"由四个部分组成: 门禁管理 app (手机端), 智慧区域管理系统, 大屏系统 (PC端), 监控设备拓扑图工具.
            大屏系统包括三个大屏: 设备运维大屏, 综合态势大屏和智慧安防大屏. 每个大屏展示相关的数据. 大屏中间展示区域地图或监控设备拓扑图。
            地图上展示热力图, 摄像头.可以播放来自摄像头的视频. 拓扑图上展示监控设备结构,设备网络速率和状态.
            拓扑图工具用于创建监控设备拓扑图。</p>

          <div class="text-h5 mt-6">项目demo链接</div>
          <v-list>
            <v-list-item>
              <a
                href="https://8-hospital-datavis-demo-yuanshi-public-bbc282b11cf332f4ae1e0fd2.gitlab.io/#/screen2"
                target="_blank">
                可视化大屏
              </a>
            </v-list-item>
            <v-list-item>
              <a
                href="https://topo-tool-demo-yuanshi-public-5d3fd63e9725a30883c298fcc611f965b.gitlab.io/"
                target="_blank">
                拓扑图工具
              </a>
            </v-list-item>
          </v-list>

          <div class="text-h5 mt-6">功能</div>
          <p>主要功能是：</p>
          <v-list>
            <v-list-item>1. 通过可视化监控区域</v-list-item>
            <v-list-item>2. 通过可视化监督监控设备状态</v-list-item>
          </v-list>

          <div class="text-h5 mt-6">项目目标</div>
          <v-list>
            <v-list-item>1. "智慧区域"通过区域管理数字化提高区域管理的效率</v-list-item>
            <v-list-item>2. 门禁管理 app 提高门禁管理的效率</v-list-item>
            <v-list-item>3. 大屏系统通过数据展示,拓扑图展示,摄像头视频播放提高及时发现并解决监控设备问题的效率,
              提高区域的安全性,
              并使热力图能够预测在哪些地方可能出现问题
            </v-list-item>
          </v-list>

          <div class="text-h5 mt-6">技术</div>
          <p>Vue 2, JavaScript, echarts</p>

          <div class="text-h5 mt-6">成就</div>
          <v-list>
            <v-list-item>1. 研发了大屏系统</v-list-item>
            <v-list-item>2. 最初，我为了给每个客户在大屏上展示监控设备拓扑图必须每一次手动创建包含 JSON 格式的监控设备结构的文件.
              因为区域里的摄像头一般很多, 创建非常耗时, 而且只有我才能创建它. 所以我推荐了开发创建拓扑图的工具, 并开发了它.
              这个工具提高了创建监控设备拓扑图的速度,并且开发监控系统的工程师可以用它创建拓扑图
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>

</style>
