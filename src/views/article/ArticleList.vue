<template>
  <common-list title="文章列表" :data="articleList" :loading="loading" :total="total" v-model:page="queryParams.page"
    v-model:page-size="queryParams.page_size" create-text="新增文章" @create="handleCreate" @refresh="fetchArticles"
    @update:page="fetchArticles" @update:pageSize="fetchArticles">
    <!-- 额外按钮 -->
    <template #toolbar-after>
      <el-button @click="categoryDialogVisible = true">
        <el-icon>
          <Folder />
        </el-icon>
        分类管理
      </el-button>
      <el-button @click="tagDialogVisible = true">
        <el-icon>
          <Collection />
        </el-icon>
        标签管理
      </el-button>
    </template>

    <!-- 额外组件 -->
    <template #extra>
      <category-manager v-model="categoryDialogVisible" />
      <tag-manager v-model="tagDialogVisible" />
    </template>

    <!-- 表格列 - 直接使用 el-table-column -->
    <el-table-column label="封面" width="120" align="center">
      <template #default="{ row }">
        <el-image :src="row.cover" fit="cover" style="width: 80px; height: 50px; border-radius: 4px" />
      </template>
    </el-table-column>

    <el-table-column label="标题" min-width="300">
      <template #default="{ row }">
        <span>{{ row.title }}</span>
        <el-tag v-if="row.is_top" type="primary" size="small" style="margin-left: 8px">置顶</el-tag>
        <el-tag v-if="!row.is_publish" type="warning" size="small" style="margin-left: 8px">草稿</el-tag>
      </template>
    </el-table-column>

    <el-table-column label="分类" width="120" align="center">
      <template #default="{ row }">
        <span v-if="row.category">{{ row.category.name }}</span>
        <span v-else style="color: #999">-</span>
      </template>
    </el-table-column>

    <el-table-column label="标签" width="200" align="center">
      <template #default="{ row }">
        <el-tag v-for="tag in row.tags" :key="tag.id" size="small" type="info" style="margin: 2px">
          {{ tag.name }}
        </el-tag>
        <span v-if="!row.tags?.length" style="color: #999">-</span>
      </template>
    </el-table-column>

    <el-table-column label="发布地点" width="120" align="center">
      <template #default="{ row }">
        <span v-if="row.location">{{ row.location }}</span>
        <span v-else style="color: #999">-</span>
      </template>
    </el-table-column>

    <el-table-column label="统计" width="140" align="center">
      <template #default="{ row }">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 13px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <el-icon size="14" style="color: #409eff;">
              <View />
            </el-icon>
            <span>{{ row.view_count || 0 }}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <el-icon size="14" style="color: #67c23a;">
              <ChatDotRound />
            </el-icon>
            <span>{{ row.comment_count || 0 }}</span>
          </div>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="150" align="center">
      <template #default="{ row }">
        <el-button type="primary" link size="small" @click="handleEdit(row.id)">编辑</el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
      </template>
    </el-table-column>
  </common-list>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Folder, Collection, View, ChatDotRound } from '@element-plus/icons-vue'
import CommonList from '@/components/common/CommonList.vue'
import type { Article } from '@/types/article'
import type { PaginationQuery } from '@/types/request'
import { getArticles, deleteArticle } from '@/api/article'
import CategoryManager from './components/CategoryManager.vue'
import TagManager from './components/TagManager.vue'
import { formatDateTime } from '@/utils/date'

const router = useRouter()
const loading = ref(false)
const categoryDialogVisible = ref(false)
const tagDialogVisible = ref(false)
const articleList = ref<Article[]>([])
const total = ref(0)
const queryParams = ref<PaginationQuery>({ page: 1, page_size: 20 })

const fetchArticles = async () => {
  loading.value = true
  try {
    const [result] = await Promise.all([
      getArticles(queryParams.value),
      new Promise(resolve => setTimeout(resolve, 300))
    ])
    articleList.value = result.list
    total.value = result.total
  } catch {
    ElMessage.error('获取文章列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => router.push('/articles/create')
const handleEdit = (id: number) => router.push(`/articles/edit/${id}`)

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', { type: 'warning' })
    await deleteArticle(id)
    ElMessage.success('删除成功')
    fetchArticles()
  } catch (error) {
    if (error instanceof Error) ElMessage.error(error.message)
  }
}

onMounted(fetchArticles)
</script>
