<script setup>

import picture1 from '@images/pages/rainbow/pharmacy/1.png'
import picture2 from '@images/pages/rainbow/pharmacy/1_1.png'
import picture3 from '@images/pages/rainbow/pharmacy/2.png'
import picture4 from '@images/pages/rainbow/pharmacy/4.png'
import picture5 from '@images/pages/rainbow/pharmacy/5.png'

</script>

<template>
  <v-row>
    <v-col cols="12">
      <div class="text-h3">兆益生物生产管理系统</div>
    </v-col>
  </v-row>


  <v-row>
    <v-col cols="12">
      <div class="text-default">2023/01 - 2024/03</div>
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
          <p>
            管理生产兽药的系统。管理采购、生产、销售流程。包括采购计划、采购订单、采购库存、产品计划、产品库存、销售计划、销售库存、年度统计、月度统计、日度统计等。。</p>

          <div class="text-h5 mt-6">功能</div>
          <p>主要功能是：</p>
          <v-list>
            <v-list-item>1. 管理兽药的采购、生产、销售流程</v-list-item>
            <v-list-item>2. 通过可视化统计数据, 帮助用户了解产品生产情况</v-list-item>
          </v-list>

          <div class="text-h5 mt-6">项目目标</div>
          <v-list>
            <v-list-item>1. 此生产管理系统使采购、生产、销售流程数字化，并合在一起。通过这个第一，提高人员的工作效率,
              第二，使采购、生产、销售数据合在一起。数据集中化让更有效并全面地控制生产兽药的流程，并通过不同的统计提高采购、生产、销售计划准确度，因此提高兆益生物有限公司的利润。
            </v-list-item>
          </v-list>

          <div class="text-h5 mt-6">技术</div>
          <p>Vue 2, JavaScript, diboot, Colaiven, echarts</p>
          <div class="text-h5 mt-6">成就</div>
          <v-list>
            <v-list-item>1. 虽然这个项目开始的时候，我没参加它，我开发了很多模块儿的前端，也优化了别人开发的前端。
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>

</style>
