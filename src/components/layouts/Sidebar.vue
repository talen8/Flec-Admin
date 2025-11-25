<template>
  <div class="sidebar" :class="{ 'is-collapse': isCollapse }">
    <div class="logo">
      <img src="@/assets/img/logo.png" alt="logo">
      <span v-show="!isCollapse">博客管理系统</span>
    </div>
    <el-menu :default-active="route.path" :collapse="isCollapse" background-color="#304156" text-color="#bfcbd9"
      active-text-color="#409eff" router>
      <el-menu-item index="/">
        <i class="ri-dashboard-2-line ri-lg"></i>
        <template #title><span>仪表盘</span></template>
      </el-menu-item>

      <el-menu-item index="/articles">
        <i class="ri-article-line ri-lg"></i>
        <template #title>文章管理</template>
      </el-menu-item>

      <el-menu-item index="/users">
        <i class="ri-team-line ri-lg"></i>
        <template #title>用户管理</template>
      </el-menu-item>

      <el-menu-item index="/comments">
        <i class="ri-message-3-line ri-lg"></i>
        <template #title>评论管理</template>
      </el-menu-item>

      <el-menu-item index="/files">
        <i class="ri-folder-image-line ri-lg"></i>
        <template #title>文件管理</template>
      </el-menu-item>

      <el-menu-item index="/friends">
        <i class="ri-links-line ri-lg"></i>
        <template #title>友链管理</template>
      </el-menu-item>

      <el-menu-item index="/moments">
        <i class="ri-chat-3-line ri-lg"></i>
        <template #title>动态管理</template>
      </el-menu-item>

      <el-menu-item index="/menus">
        <i class="ri-menu-line ri-lg"></i>
        <template #title>菜单管理</template>
      </el-menu-item>

      <el-menu-item index="/visits">
        <i class="ri-file-list-3-line ri-lg"></i>
        <template #title>访问日志</template>
      </el-menu-item>

      <el-menu-item index="/feedback">
        <i class="ri-feedback-line ri-lg"></i>
        <template #title>反馈投诉</template>
      </el-menu-item>

      <el-menu-item index="/settings">
        <i class="ri-settings-3-line ri-lg"></i>
        <template #title>系统设置</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
defineProps<{
  isCollapse: boolean
}>()
</script>

<style scoped lang="scss">
.sidebar {
  height: 100%;

  .logo {
    height: 60px;
    padding: 10px 0;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 32px;
      height: 32px;
    }

    span {
      margin-left: 10px;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
    }
  }

  &.is-collapse {
    .logo {
      padding: 10px;

      span {
        display: none;
      }
    }
  }

  :deep(.el-menu) {
    border-right: none;

    .el-menu-item {
      font-size: 16px;

      i {
        margin-right: 10px;
      }
    }
  }
}
</style>