<template>
  <div class="header">
    <div class="left">
      <div class="toggle-sidebar" @click="toggleSidebar">
        <i class="ri-menu-fold-3-line ri-lg" v-if="!isCollapse"></i>
        <i class="ri-menu-unfold-3-line ri-lg" v-else></i>
      </div>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="route.path !== '/'">{{ route.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="right">
      <NotificationBell />
      <el-dropdown>
        <span class="user-info">
          <el-avatar :src="userAvatar" />
          <span class="nickname">{{ nickname }}</span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>
              <el-icon><User /></el-icon>
              <span>{{ nickname }}</span>
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleChangePassword">
              <el-icon><Lock /></el-icon>
              <span>修改密码</span>
            </el-dropdown-item>
            <el-dropdown-item @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Lock, SwitchButton, ArrowDown } from '@element-plus/icons-vue'
import NotificationBell from '@/components/common/NotificationBell.vue'
import { logout as logoutApi } from '@/api/user'
import { removeTokens } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)

const userInfoStr = localStorage.getItem('userInfo')
const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {}
const nickname = ref(userInfo.nickname || 'Admin')
const userAvatar = ref(userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png')

const emit = defineEmits(['update:collapse'])

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
  // 触发事件通知父组件
  emit('update:collapse', isCollapse.value)
}

const handleChangePassword = () => {
  ElMessage.info('修改密码功能待实现')
  // TODO: 实现修改密码功能，可以打开一个对话框
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    
    // 调用后端登出 API，将 token 加入黑名单
    try {
      await logoutApi()
    } catch (error) {
      console.error('登出 API 调用失败:', error)
      // 即使后端 API 失败，也要清除本地 token
    }
    
    // 清除所有本地存储的认证信息
    removeTokens()
    localStorage.removeItem('userInfo')
    
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {}
}
</script>

<style scoped lang="scss">
.header {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .left {
    display: flex;
    align-items: center;

    .toggle-sidebar {
      margin-right: 20px;
      font-size: 20px;
      cursor: pointer;
    }
  }

  .right {
    display: flex;
    align-items: center;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.3s;
      outline: none;

      &:hover {
        background-color: #f5f7fa;
      }

      &:focus {
        outline: none;
      }

      .nickname {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }

      .arrow-icon {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>