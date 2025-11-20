<template>
  <common-list 
    title="评论管理" 
    :data="commentList" 
    :loading="loading" 
    :total="total" 
    :show-create="false"
    v-model:page="queryParams.page" 
    v-model:page-size="queryParams.page_size"
    @refresh="fetchComments"
    @update:page="fetchComments"
    @update:pageSize="fetchComments"
  >
    <!-- 右上角工具栏 -->
    <template #toolbar-after>
      <el-button type="primary" @click="emailDialogVisible = true">邮箱配置</el-button>
    </template>

    <!-- 表格列 -->
    <el-table-column label="用户信息" width="180" align="center">
      <template #default="{ row }">
        <div style="display: flex; align-items: center; gap: 8px">
          <el-avatar :size="40" :src="row.user.avatar" style="flex-shrink: 0">
            <el-icon>
              <User />
            </el-icon>
          </el-avatar>
          <div style="flex: 1; min-width: 0; overflow: hidden; text-align: left">
            <div style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ row.user.nickname }}</div>
            <div style="font-size: 12px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ row.user.email }}</div>
          </div>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="评论内容" min-width="300">
      <template #default="{ row }">
        <div style="line-height: 1.6; display: flex; align-items: center; gap: 8px">
          <span>{{ row.content }}</span>
          <el-tag v-if="row.deleted_at" type="danger" size="small">已删除</el-tag>
          <el-tag v-if="row.parent_id" type="info" size="small">子评论</el-tag>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="评论目标" width="220" align="center">
      <template #default="{ row }">
        <div style="display: flex; align-items: center; gap: 8px">
          <el-tag 
            v-if="row.target.type !== 'article'"
            type="success" 
            size="small"
          >
            {{ getTargetTypeText(row.target.type) }}
          </el-tag>
          <el-tooltip :content="row.target.title" placement="top">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; flex: 1">
              {{ row.target.title }}
            </div>
          </el-tooltip>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="评论时间" width="180" align="center">
      <template #default="{ row }">
        {{ formatDateTime(row.created_at) }}
      </template>
    </el-table-column>

    <el-table-column label="状态" width="100" align="center">
      <template #default="{ row }">
        <el-switch v-model="row.status" :active-value="1" :inactive-value="0" inline-prompt active-text="显示"
          inactive-text="隐藏" @change="handleStatusChange(row)" />
      </template>
    </el-table-column>

    <el-table-column label="操作" width="120" align="center" fixed="right">
      <template #default="{ row }">
        <el-button v-if="row.deleted_at" type="success" link size="small" @click="handleRestore(row.id)">
          恢复
        </el-button>
        <el-button v-else type="danger" link size="small" @click="handleDelete(row.id)">
          删除
        </el-button>
      </template>
    </el-table-column>
    <!-- 额外挂载区域 -->
    <template #extra>
      <email-config-dialog v-model="emailDialogVisible" />
    </template>
  </common-list>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import CommonList from '@/components/common/CommonList.vue'
import type { Comment } from '@/types/comment'
import type { PaginationQuery } from '@/types/request'
import { getComments, deleteComment, restoreComment, toggleCommentStatus } from '@/api/comment'
import { formatDateTime } from '@/utils/date'
import EmailConfigDialog from '@/views/comment/components/EmailConfigDialog.vue'

const loading = ref(false)
const commentList = ref<Comment[]>([])
const total = ref(0)
const queryParams = ref<PaginationQuery>({ page: 1, page_size: 20 })
const emailDialogVisible = ref(false)

const fetchComments = async () => {
  loading.value = true
  try {
    const [result] = await Promise.all([
      getComments(queryParams.value),
      new Promise(resolve => setTimeout(resolve, 300))
    ])
    commentList.value = result.list
    total.value = result.total
  } catch {
    ElMessage.error('获取评论列表失败')
  } finally {
    loading.value = false
  }
}

const handleStatusChange = async (comment: Comment) => {
  const statusText = comment.status === 1 ? '显示' : '隐藏'
  try {
    await toggleCommentStatus(comment.id)
    ElMessage.success(`已设置为${statusText}`)
  } catch (error) {
    comment.status = comment.status === 1 ? 0 : 1
    if (error instanceof Error) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('状态切换失败')
    }
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', { type: 'warning' })
    await deleteComment(id)
    ElMessage.success('删除成功')
    fetchComments()
  } catch (error) {
    if (error !== 'cancel' && error instanceof Error) ElMessage.error(error.message)
  }
}

const handleRestore = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要恢复这条评论吗？', '提示', { type: 'info' })
    await restoreComment(id)
    ElMessage.success('恢复成功')
    fetchComments()
  } catch (error) {
    if (error !== 'cancel' && error instanceof Error) ElMessage.error(error.message)
  }
}

// 获取目标类型显示文本
const getTargetTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    page: '页面'
  }
  return typeMap[type] || type
}

onMounted(fetchComments)
</script>
