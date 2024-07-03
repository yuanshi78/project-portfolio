<script setup>
import picture1 from '@images/pages/rainbow/smart-oper/6.png'
import picture2 from '@images/pages/rainbow/smart-oper/4.png'
import picture3 from '@images/pages/rainbow/smart-oper/5.png'
import picture4 from '@images/pages/rainbow/smart-oper/可视化运维系统设备台长.png'
import picture5 from '@images/pages/rainbow/smart-oper/可视化运维系统保养任务管理.png'
import picture6 from '@images/pages/rainbow/smart-oper/7.png'
</script>

<template>
  <v-row>
    <v-col cols="12">
      <div class="text-h3">可视化运维系统</div>
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12">
      <div class="text-default">2024/03 - 2024/07</div>
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
        <v-carousel-item>
          <v-sheet height="100%">
            <v-img
              :src="picture6"
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
          <p>区域电，水，气系统可视化运维系统。</p>

          <div class="text-h5 mt-6">功能</div>
          <p>主要功能是：</p>
          <v-list>
            <v-list-item>1. 用数据可视化分析电水气的使用情况</v-list-item>
            <v-list-item>2. 电，水，气系统设备的巡检（线上和线下），保养和维修</v-list-item>
          </v-list>

          <div class="text-h5 mt-6">项目目标</div>
          <v-list>
            <v-list-item>1. 通过电，水，气系统管理数字化优化电，水，气的使用</v-list-item>
            <v-list-item>2. 保证电，水，气系统设备正常运行</v-list-item>
          </v-list>

          <div class="text-h5  mt-6">技术</div>
          <p>Vue 2, diboot, ant-design-vue, echarts, DataEase，Fuxa</p>
          <div class="text-h5">成就</div>
          <v-list>
            <v-list-item>1. 开发了diboot无法生产的功能</v-list-item>
            <v-list-item>2. 开发了能流图</v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>

</style>
