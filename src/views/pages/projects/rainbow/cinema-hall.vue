<script setup>

import picture1 from '@images/pages/rainbow/tickets/1.png'
import picture2 from '@images/pages/rainbow/tickets/2.png'
import picture3 from '@images/pages/rainbow/tickets/3.png'
import picture4 from '@images/pages/rainbow/tickets/4.png'
import picture5 from '@images/pages/rainbow/tickets/5.png'
import picture6 from '@images/pages/rainbow/tickets/6.png'
import picture7 from '@images/pages/rainbow/tickets/7.png'

</script>

<template>
  <v-row>
    <v-col cols="12">
      <div class="text-h3">票务管理系统</div>
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12">
      <div class="text-default">2024/03 - 2024/06</div>
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
        <v-carousel-item>
          <v-sheet height="100%">
            <v-img
              :src="picture7"
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
          <p>该系统致力于为用户提供便捷、高效、安全的票务预订服务，涵盖了票务查询、预订、支付、出票等全流程功能</p>

          <div class="text-h5 mt-6">功能</div>
          <p>主要功能是：</p>
          <v-list>
            <v-list-item>1.剧场管理：配置剧场座位</v-list-item>
            <v-list-item>2.配置演出信息，配置演出场次</v-list-item>
            <v-list-item>3.配置座位价格</v-list-item>
            <v-list-item>4.展示订单信息</v-list-item>
            <v-list-item>5.订单和销售报表</v-list-item>
          </v-list>

          <div class="text-h5 mt-6">项目目标</div>
          <v-list>
            <v-list-item>1. 票务数字化</v-list-item>
          </v-list>


          <div class="text-h5 mt-6">技术</div>
          <p>Vue 2, diboot, antv-design, svg</p>
          <div class="text-h5">成就</div>
          <v-list>
            <v-list-item>1. 开发了diboot无法生产的功能</v-list-item>
            <v-list-item>2. 用svg技术绘制了座位图</v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>

</style>
