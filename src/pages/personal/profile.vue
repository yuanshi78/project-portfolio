<script setup>
/**
 * 算居住年数
 * @returns {number}
 */
function getYears() {
  return new Date().getFullYear() - 2014;
}
</script>

<template>
  <VRow>
    <VCol cols="12" lg="4" md="4">
      <VCard class="mx-auto">
        <!--        <div class="text-body-2 mb-4 text-disabled">自我介绍</div>-->
        <v-list>
          <v-list-subheader>自我介绍</v-list-subheader>
          <v-list-item prepend-icon="ri-user-line">姓名: Aliaksandr Kuzmiankou 元实</v-list-item>
          <v-list-item prepend-icon="ri-calendar-line">年龄：46岁</v-list-item>
          <v-list-item prepend-icon="ri-global-line">国籍：白俄罗斯 🇧🇾</v-list-item>
          <v-list-item prepend-icon="ri-speak-line">语言：俄语、白俄语、汉语、英语</v-list-item>
          <v-list-item prepend-icon="ri-calendar-2-line">居住：在西安{{getYears()}}年了</v-list-item>
          <v-list-item prepend-icon="ri-parent-line">婚姻状况：已婚，有孩子</v-list-item>
          <v-list-item prepend-icon="ri-star-line">角色： web前端工程师</v-list-item>
          <v-list-item prepend-icon="ri-graduation-cap-line">教育： 白俄罗斯国立信息和无线电电子大学 <br> 1997-2002 <br>
            软件工程师
          </v-list-item>
          <v-list-item prepend-icon="ri-user-location-line">家庭地址：西安莲湖区环城西路南段8号</v-list-item>
          <v-list-item prepend-icon="ri-wechat-2-line">微信号：yuanshi78</v-list-item>
          <v-list-item prepend-icon="ri-phone-line">手机号：18681876326</v-list-item>
        </v-list>
      </VCard>

      <VCard class="mx-auto mt-6">
        <v-list>
          <v-list-subheader>爱好</v-list-subheader>
          <v-list-item prepend-icon="ri-computer-line">IT：人工智能（特别是人工神经网络）、web前端、算法、系统结构设计
          </v-list-item>
          <v-list-item prepend-icon="ri-reactjs-fill">科学：数学、神经生物学</v-list-item>
          <v-list-item prepend-icon="ri-ancient-gate-line">中国🇨🇳: 文化（特别是道家/道教）、 历史、古汉语、现代汉语、茶叶
          </v-list-item>
          <v-list-item prepend-icon="ri-music-line">音乐: 西方古典音乐（从巴洛克时代的到20/21世纪时代的）、中国古典音乐（古琴）、早期摇滚(The
            Beatles, The Who, Pink Floyd, Led Zeppelin, Deep Purple, Queen等)、早期流行音乐、爵士
          </v-list-item>
        </v-list>
      </VCard>
    </VCol>
    <VCol cols="12" lg="8" md="8">
      <VRow>
        <VCol cols="12" md="12" sm="12">
          <VCard>
            <div class="text-default pa-4">专业技能</div>
            <VRow>
              <VCol cols="12" lg="6" md="6">
                <v-list>
                  <v-list-item prepend-icon="ri-vuejs-line">
                    前端：HTML5、CSS3、JavaScript （ES5, ES2015, ES2015以上）、Vue 2/3
                  </v-list-item>
                </v-list>
              </VCol>
              <VCol cols="12" lg="6" md="6">
                <v-list>
                  <v-list-item prepend-icon="ri-code-s-slash-line">
                    语言：JavaScript （ES5, ES2015, ES2015以上）、C/C++、Lisp、SQL、JCL
                  </v-list-item>
                </v-list>
              </VCol>
              <VCol cols="12" lg="6" md="6">
                <v-list>
                  <v-list-item prepend-icon="ri-code-box-line">
                    低代码框架：diboot、amis
                  </v-list-item>
                </v-list>
              </VCol>
              <VCol cols="12" lg="6" md="6">
                <v-list>
                  <v-list-item prepend-icon="ri-earth-line">
                    GIS工具：高德地图API、AntV L7、Cesium js
                  </v-list-item>
                </v-list>
              </VCol>
              <VCol cols="12" lg="6" md="6">
                <v-list>
                  <v-list-item prepend-icon="ri-pie-chart-line" class="important">
                   可视化：echarts, Grafana
                  </v-list-item>
                </v-list>
              </VCol>
              <VCol cols="12" lg="6" md="6">
                <v-list>
                  <v-list-item prepend-icon="ri-ubuntu-line">
                    OS：Linux (Manjaro & Mint)、Windows、IBM z/OS
                  </v-list-item>
                </v-list>
              </VCol>
              <VCol cols="12" lg="6" md="6">
                <v-list>
                  <v-list-item prepend-icon="ri-computer-line">
                    硬件环境：PC、IBM zSeries (Z Mainframes)
                  </v-list-item>
                </v-list>
              </VCol>
            </VRow>
          </VCard>
        </VCol>

        <VCol cols="12" lg="6" md="6">
          <VCard class="mx-auto">
            <v-list>
              <v-list-subheader>自我评价</v-list-subheader>
              <v-list-item prepend-icon="ri-speak-line">
                俄语🇷🇺、白俄语🇧🇾、汉语🇨🇳、英语🇬🇧。有一定的汉语基础，在听、说、读、写方面都有长处，可以用中文与人顺利的交流
              </v-list-item>
              <v-list-item prepend-icon="ri-code-s-slash-line">拥有十九年的软件创作和应用经验</v-list-item>
              <v-list-item prepend-icon="ri-lightbulb-flash-line" class="important">产生新想法的能力较强</v-list-item>
              <v-list-item prepend-icon="ri-parentheses-fill" class="important">研发(研究+开发)能力较强</v-list-item>
              <v-list-item prepend-icon="ri-apps-line">复合软件研制和了解项目业务流程能力较强</v-list-item>
              <v-list-item prepend-icon="ri-dashboard-2-line" class="important">研发大数据可视化系统能力较强</v-list-item>
              <v-list-item prepend-icon="ri-stackshare-line" class="important">有研发IoT平台前端的经验</v-list-item>
              <v-list-item prepend-icon="ri-stack-line">了解敏捷开发 Scrum 的基础</v-list-item>
              <v-list-item prepend-icon="ri-group-3-line">有团队合作精神</v-list-item>
              <v-list-item prepend-icon="ri-task-line">本人适应性强，责任心强，有优秀的中文口头表达能力
              </v-list-item>
              <v-list-item prepend-icon="ri-globe-line">会努力吸引白俄罗斯项目</v-list-item>
            </v-list>
          </VCard>
        </VCol>

        <VCol cols="12" lg="6" md="6">
          <VCard class="mx-auto">
            <v-list>
              <v-list-subheader>想法</v-list-subheader>
              <v-list-item class="important">
                1. 以思想为主. 技术是实现思想的工具
              </v-list-item>
              <v-list-item>
                2. 充分利用抽象的力量
              </v-list-item>
              <v-list-item>
                4. 尽量利用模块化架构
              </v-list-item>
              <v-list-item>
                5. 尽量减少重复代码
              </v-list-item>
              <v-list-item>
                6. 尽量利用提高工作效率的工具， 包括AI, 低代码/无代码工具
              </v-list-item>
              <v-list-item class="important">
                7. 团队合作很重要
              </v-list-item>
              <v-list-item>
                8. 我不是coder monkey, 而是<span class="important">软件工程师</span>， 喜欢挑战新思路， 喜欢挑战新想法，喜欢研发（研究 + 开发）
              </v-list-item>
              <v-list-item>
                9. 想做出自己的产品
              </v-list-item>
              <v-list-item class="important">
                10. 利用以前研发的拓扑工具为基础，研发完整的IoT拓扑图工具， 作为在IoT平台上使用的模块
              </v-list-item>
              <v-list-item>
                11. 我的梦想是对人工神经网络技术的发展有贡献
              </v-list-item>
            </v-list>
          </VCard>
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>

<style lang="scss" scoped>
.important {
  font-weight: bold;
  color: gold;
}
</style>
