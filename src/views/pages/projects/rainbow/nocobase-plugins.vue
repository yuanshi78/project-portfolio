<script setup>

import picture1 from '@images/pages/rainbow/nocobase/echars-plugin.png'

</script>

<template>
  <v-row>
    <v-col cols="12">
      <div class="text-h3">Nocobase插件</div>
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12">
      <div class="text-default">2024/11 - 现在</div>
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
<!--        <v-carousel-item>-->
<!--          <v-sheet height="100%">-->
<!--            <v-img-->
<!--              :src="picture2"-->
<!--              height="100%"-->
<!--            ></v-img>-->
<!--          </v-sheet>-->
<!--        </v-carousel-item>-->
<!--        <v-carousel-item>-->
<!--          <v-sheet height="100%">-->
<!--            <v-img-->
<!--              :src="picture3"-->
<!--              height="100%"-->
<!--            ></v-img>-->
<!--          </v-sheet>-->
<!--        </v-carousel-item>-->
      </v-carousel>
    </v-col>
  </v-row>


  <v-row>
    <v-col cols="12">
      <v-card>
        <v-card-text>
          <div class="text-h5">简介</div>
          <p></p>

          <div class="text-h5 mt-6">项目demo链接</div>
          <v-list>
            <v-list-item>
<!--              <a-->
<!--                href="https://topo-tool-demo-yuanshi-public-5d3fd63e9725a30883c298fcc611f965b.gitlab.io/"-->
<!--                target="_blank">-->
<!--                拓扑图工具-->
<!--              </a>-->
            </v-list-item>
          </v-list>

          <div class="text-h5 mt-6">功能</div>
          <p>主要功能是：</p>
<!--          <v-list>-->
<!--            <v-list-item>1. 创建监控设备拓扑图</v-list-item>-->
<!--          </v-list>-->

          <div class="text-h5 mt-6">项目目标</div>
<!--          <v-list>-->
<!--            <v-list-item>1. 简化监控拓扑图的创建</v-list-item>-->
<!--            <v-list-item>2. 其他人能轻松地创建拓扑图</v-list-item>-->
<!--          </v-list>-->


          <div class="text-h5 mt-6">技术</div>
          <p>React, TypeScript, ant-design</p>

          <div class="text-h5 mt-6">成就</div>
<!--          <v-list>-->
<!--            <v-list-item>1. 最初，我为了给每个客户在大屏上展示监控设备拓扑图必须每一次手动创建包含 JSON 格式的监控设备结构的文件.-->
<!--              因为区域里的摄像头一般很多, 创建非常耗时, 而且只有我才能创建它. 所以我推荐了开发创建拓扑图的工具, 并开发了它.-->
<!--              这个工具提高了创建监控设备拓扑图的速度,并且开发监控系统的工程师可以用它创建拓扑图-->
<!--            </v-list-item>-->
<!--          </v-list>-->
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>

</style>
