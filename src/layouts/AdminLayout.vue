<template>
  <el-container class="admin-layout">
    <el-aside :width="isCollapse ? '64px' : '200px'">
      <Sidebar :is-collapse="isCollapse" />
    </el-aside>
    <el-container>
      <el-header>
        <Header v-model:collapse="isCollapse" />
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Header from '@/components/layouts/Header.vue'
import Sidebar from '@/components/layouts/Sidebar.vue'

const isCollapse = ref(false)
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
  
  .el-aside {
    background-color: #304156;
    transition: width 0.3s;
    overflow: hidden;
  }
  
  .el-header {
    background-color: #fff;
    border-bottom: 1px solid #dcdfe6;
    padding: 0;
    height: 60px;
  }
  
  .el-main {
    background-color: #f0f2f5;
    padding: 20px;
  }
}
</style>