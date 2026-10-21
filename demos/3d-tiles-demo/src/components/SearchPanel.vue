<template>
  <!-- 与 ordos index.html 的搜索面板结构一致，样式由 public/css/nav.css 提供 -->
  <aside id="search-panel" class="asideSearch">
    <div id="search-block">
      <div id="search" class="aside-head">
        <input
          type="text"
          id="search-input"
          autocomplete="off"
          placeholder="请输入查询关键字"
          v-model="kw"
          @keyup.enter="go"
        />
        <button id="search-btn" @click="go"></button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { store } from '../store.js'

const kw = ref('')

function go() {
  store.ui.searchKeyword = kw.value.trim()
  if (store.ui.searchKeyword) store.ui.activeTab = 'search'
}
</script>

<style scoped>
/* 水平定位/尺寸由 theme.css 的 .asideSearch 覆盖统一控制（含移动端适配）。 */
</style>
