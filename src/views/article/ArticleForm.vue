<template>
  <div class="article-editor-page">
    <!-- 固定顶部导航栏 -->
    <header class="editor-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="handleCancel" title="返回" />
        <span class="page-label">{{ isEdit ? '编辑文章' : '新增文章' }}</span>
      </div>

      <div class="header-center">
        <el-form ref="formRef" :model="formData" :rules="formRules">
          <el-form-item prop="title" class="title-form-item">
            <input v-model="formData.title" class="header-title-input" placeholder="请输入文章标题..." maxlength="200" />
          </el-form-item>
        </el-form>
      </div>

      <div class="header-right">
        <el-button @click="drawerVisible = true" :icon="Setting" text>
          文章设置
        </el-button>
        <el-button type="primary" @click="() => handleSave()" :loading="loading">
          {{ loading ? '保存中...' : '保存' }}
        </el-button>
      </div>
    </header>

    <!-- 主编辑区域 -->
    <main class="editor-main" v-loading="loading">
      <CodeMirrorEditor v-model="formData.content" />
    </main>

    <!-- 侧边抽屉 - 文章设置 -->
    <el-drawer v-model="drawerVisible" title="文章设置" :size="800" direction="rtl">
      <el-form :model="formData" label-width="100px" label-position="top" class="drawer-form">
        <div class="form-row">
          <el-form-item label="文章分类" prop="category_id" class="form-col">
            <el-select v-model="formData.category_id" placeholder="请选择或输入分类名称" style="width: 100%" clearable filterable
              allow-create @change="handleCategorySelect">
              <el-option v-for="category in categories" :key="category.id" :label="category.name"
                :value="category.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="文章标签" prop="tag_ids" class="form-col">
            <el-select v-model="formData.tag_ids" placeholder="请选择或输入标签名称" style="width: 100%" multiple clearable
              collapse-tags collapse-tags-tooltip :max-collapse-tags="3" filterable allow-create
              @change="handleTagSelect">
              <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="文章摘要" prop="summary">
          <el-input v-model="formData.summary" type="textarea" placeholder="请输入文章摘要，如不填写将自动截取内容前200字符" :rows="3"
            maxlength="150" show-word-limit clearable />
        </el-form-item>

        <el-form-item label="文章封面" prop="cover">
          <ImageUploader ref="coverUploaderRef" v-model="formData.cover" upload-type="文章封面" :max-size="10" width="285px"
            height="160px" />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="发布地点" prop="location" class="form-col">
            <el-input v-model="formData.location" placeholder="请输入发布地点" clearable />
          </el-form-item>

          <div class="form-col form-switches">
            <el-form-item label="是否置顶" prop="is_top" class="switch-item">
              <el-switch v-model="formData.is_top" />
            </el-form-item>

            <el-form-item label="是否发布" prop="is_publish" class="switch-item">
              <el-switch v-model="formData.is_publish" />
            </el-form-item>
          </div>
        </div>

        <div v-if="isEdit">
          <el-divider />

          <div class="form-row">
            <el-form-item label="发布时间" class="form-col">
              <el-date-picker v-model="formData.publish_time" type="datetime" placeholder="选择发布时间（留空则使用当前时间）"
                style="width: 100%" format="YYYY-MM-DD HH:mm:ss" clearable />
              <div class="form-tip">
                发布时留空将使用当前时间，草稿状态下此时间不生效
              </div>
            </el-form-item>

            <el-form-item label="更新时间" class="form-col">
              <el-date-picker v-model="formData.update_time" type="datetime" placeholder="留空则自动使用当前时间"
                style="width: 100%" format="YYYY-MM-DD HH:mm:ss" clearable />
              <div class="form-tip">
                留空则自动使用当前时间作为更新时间
              </div>
            </el-form-item>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="drawer-footer">
          <el-button type="primary" @click="() => handleSave()" :loading="loading" size="large" style="width: 100%">
            {{ loading ? '保存中...' : '保存' }}
          </el-button>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Setting, ArrowLeft } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Article } from '@/types/article'
import type { Category } from '@/types/category'
import type { Tag } from '@/types/tag'
import { createArticle, updateArticle, getArticle } from '@/api/article'
import { getCategories, createCategory } from '@/api/category'
import { getTags, createTag } from '@/api/tag'
import { parseBackendDate, formatForBackend } from '@/utils/date'
import { useDebounceFn } from '@vueuse/core'
import ImageUploader from '@/components/common/ImageUploader.vue'
import CodeMirrorEditor from '@/components/common/CodeMirrorEditor.vue'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const coverUploaderRef = ref<InstanceType<typeof ImageUploader>>()

const loading = ref(false)
const drawerVisible = ref(false)
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const articleInfo = ref<Article>({} as Article)
const isSaved = ref(false) // 标记是否已保存，用于判断是否需要提示
const draftArticleId = ref<number | null>(null) // 草稿文章ID（新建模式下）
const originalIsPublish = ref<boolean>(false) // 文章原始发布状态

// 判断是否为编辑模式
const isEdit = computed(() => route.name === 'ArticleEdit')

// 判断是否允许自动保存（只有草稿或新建文章才自动保存）
const canAutoSave = computed(() => {
  if (!isEdit.value) {
    // 新建文章：允许自动保存
    return true
  }
  // 编辑文章：只有原始状态是未发布才允许自动保存
  return !originalIsPublish.value
})

// 表单数据
const formData = reactive({
  title: '',
  content: '',
  summary: '',
  cover: '',
  category_id: undefined as number | undefined,
  tag_ids: [] as number[],
  location: '',
  is_top: false,
  is_publish: false,
  publish_time: null as Date | null,
  update_time: null as Date | null
})

// 保存原始数据快照，用于检测变化
const originalData = reactive({
  title: '',
  content: '',
  summary: '',
  cover: '',
  category_id: undefined as number | undefined,
  tag_ids: [] as number[],
  location: '',
  is_top: false,
  is_publish: false,
  publish_time: null as Date | null,
  update_time: null as Date | null
})

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 1, max: 200, message: '标题长度在 1 到 200 个字符', trigger: 'blur' }
  ]
}

// ==================== 超级简化草稿功能 ====================
// 策略：复用文章API，将草稿保存为 is_publish=false 的文章
// 优点：不需要独立草稿API，减少90%请求，代码极简

// 自动保存草稿（30秒一次 + 离开页面时）
const saveDraftSilently = async () => {
  // 只有标题或内容不为空时才保存
  if (!formData.title.trim() && !formData.content.trim()) {
    return
  }

  try {
    // 准备保存数据
    const saveData: any = {
      title: formData.title.trim() || `未命名草稿 ${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
      content: formData.content.trim(),
      summary: formData.summary.trim(),
      cover: formData.cover || '',
      category_id: formData.category_id,
      tag_ids: Array.from(formData.tag_ids || []),
      location: formData.location.trim(),
      is_top: formData.is_top,
      is_publish: formData.is_publish
    }

    if (isEdit.value) {
      // 编辑模式：更新文章内容和发布状态
      const id = Number(route.params.id)
      await updateArticle(id, saveData)
    } else if (draftArticleId.value) {
      // 新建模式：更新已创建的草稿（保持未发布状态）
      saveData.is_publish = false
      await updateArticle(draftArticleId.value, saveData)
    } else {
      // 新建模式：首次保存，创建新草稿
      saveData.is_publish = false
      saveData.publish_time = ''
      saveData.update_time = ''
      const result = await createArticle(saveData)
      draftArticleId.value = result.id
    }

    console.log('💾 内容已自动保存', new Date().toLocaleTimeString())
  } catch (error) {
    console.warn('⚠️ 自动保存失败:', error)
  }
}

// 30秒自动保存（使用防抖）
const debouncedSaveDraft = useDebounceFn(saveDraftSilently, 30000)

// 监听表单变化，触发自动保存
watch(
  () => ({
    title: formData.title,
    content: formData.content,
    summary: formData.summary,
    cover: formData.cover,
    category_id: formData.category_id,
    tag_ids: formData.tag_ids,
    location: formData.location,
    is_top: formData.is_top,
    is_publish: formData.is_publish
  }),
  () => {
    // 只有草稿或新建文章才自动保存
    if (!isSaved.value && !loading.value && canAutoSave.value) {
      debouncedSaveDraft()
    }
  },
  { deep: true }
)

// ==================== 数据获取函数 ====================

const fetchData = async (fetchFn: Function, target: any, errorMsg: string) => {
  try {
    const response = await fetchFn()
    target.value = response.list
  } catch {
    ElMessage.error(errorMsg)
  }
}

const fetchCategories = () => fetchData(getCategories, categories, '获取分类列表失败')
const fetchTags = () => fetchData(getTags, tags, '获取标签列表失败')

// 获取文章详情（编辑模式）
const fetchArticle = async (id: number) => {
  try {
    loading.value = true
    const article = await getArticle(id)
    articleInfo.value = article

    // 记录文章原始发布状态（用于判断是否允许自动保存）
    originalIsPublish.value = article.is_publish

    // 填充表单数据
    const data = {
      title: article.title,
      content: article.content,
      summary: article.summary,
      cover: article.cover || '',
      category_id: article.category?.id || undefined,
      tag_ids: article.tags?.map(tag => tag.id) || [],
      location: (article as any).location || '',
      is_top: article.is_top || false,
      is_publish: article.is_publish || false,
      publish_time: parseBackendDate(article.publish_time),
      update_time: parseBackendDate(article.update_time)
    }

    Object.assign(formData, data)
    // 同时保存原始数据（Date 对象需要单独复制）
    Object.assign(originalData, {
      ...data,
      publish_time: data.publish_time ? new Date(data.publish_time) : null,
      update_time: data.update_time ? new Date(data.update_time) : null
    })
  } catch (error) {
    ElMessage.error('获取文章详情失败')
    router.push('/articles')
  } finally {
    loading.value = false
  }
}

// 保存文章
const handleSave = async (autoRedirect: boolean = true) => {
  if (!formRef.value) return

  try {
    // 验证标题
    await formRef.value.validate()

    // 手动验证内容
    if (!formData.content || !formData.content.trim()) {
      ElMessage.error('请输入文章内容')
      return
    }

    loading.value = true

    // 如果有待上传的封面，先上传
    try {
      if (coverUploaderRef.value) {
        await coverUploaderRef.value.uploadPendingFile()
      }
    } catch (error: any) {
      loading.value = false
      ElMessage.error(error.message || '封面上传失败')
      return
    }

    // 准备提交数据
    const submitData: any = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      summary: formData.summary.trim(),
      cover: formData.cover || '',
      tag_ids: Array.from(formData.tag_ids || []),
      location: formData.location.trim(),
      is_top: formData.is_top,
      is_publish: formData.is_publish
    }

    // 可选字段：只在有值时添加
    if (formData.category_id) {
      submitData.category_id = formData.category_id
    }

    // 时间字段处理：Date 对象转换为后端格式（YYYY-MM-DD HH:mm:ss）
    // 编辑模式下必须包含这些字段（即使为空）
    if (isEdit.value || formData.publish_time) {
      submitData.publish_time = formatForBackend(formData.publish_time)
    }

    if (isEdit.value || formData.update_time) {
      submitData.update_time = formatForBackend(formData.update_time)
    }

    // 自动生成摘要
    if (!submitData.summary && submitData.content) {
      submitData.summary = submitData.content
        .replace(/[#*`>\-\[\]]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200)
    }

    // 提交数据
    const id = Number(route.params.id)

    if (isEdit.value) {
      await updateArticle(id, submitData)
    } else {
      await createArticle(submitData)
    }

    ElMessage.success(isEdit.value ? '更新文章成功' : '创建文章成功')

    // 标记已保存，避免离开页面时提示
    isSaved.value = true

    // 清除草稿文章ID（如果是新建模式）
    draftArticleId.value = null

    // 根据参数决定是否自动跳转
    if (autoRedirect) {
      // 短暂延迟后跳转，确保后端处理完成
      setTimeout(() => {
        router.push('/articles')
      }, 500)
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
    }
  } finally {
    loading.value = false
  }
}

// 检查表单是否有变化
const hasFormChanged = (): boolean => {
  // 比较数组是否相等
  const arraysEqual = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((val, index) => val === sortedB[index])
  }

  // 比较 Date 对象是否相等
  const datesEqual = (a: Date | null, b: Date | null) => {
    if (a === null && b === null) return true
    if (a === null || b === null) return false
    return a.getTime() === b.getTime()
  }

  return (
    formData.title !== originalData.title ||
    formData.content !== originalData.content ||
    formData.summary !== originalData.summary ||
    formData.cover !== originalData.cover ||
    formData.category_id !== originalData.category_id ||
    !arraysEqual(formData.tag_ids, originalData.tag_ids) ||
    formData.location !== originalData.location ||
    formData.is_top !== originalData.is_top ||
    formData.is_publish !== originalData.is_publish ||
    !datesEqual(formData.publish_time, originalData.publish_time) ||
    !datesEqual(formData.update_time, originalData.update_time)
  )
}

// 取消操作
const handleCancel = () => {
  // 直接跳转，由路由守卫处理未保存提示
  router.push('/articles')
}

// 创建新项目的通用函数
const createNewItem = async (name: string, createFn: Function, refreshFn: Function, type: 'category' | 'tag') => {
  const maxLength = type === 'category' ? 50 : 50
  if (name.length > maxLength) {
    ElMessage.error(`${type === 'category' ? '分类' : '标签'}名称不能超过${maxLength}个字符`)
    return null
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: `正在创建${type === 'category' ? '分类' : '标签'}...`,
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const newItem = await createFn({ name, description: '', sort: 0 })
    await refreshFn()
    loadingInstance.close()
    ElMessage.success(`${type === 'category' ? '分类' : '标签'}"${name}"创建成功`)
    return newItem
  } catch {
    loadingInstance.close()
    ElMessage.error(`创建${type === 'category' ? '分类' : '标签'}失败`)
    return null
  }
}

// 处理分类选择变化
const handleCategorySelect = async (value: any) => {
  if (typeof value !== 'string') return

  const categoryName = value.trim()
  if (!categoryName) {
    formData.category_id = undefined
    return
  }

  // 检查是否已存在
  const existing = categories.value.find(cat =>
    cat.name.toLowerCase() === categoryName.toLowerCase()
  )
  if (existing) {
    formData.category_id = existing.id
    ElMessage.info(`已选择现有分类"${existing.name}"`)
    return
  }

  // 创建新分类
  const newCategory = await createNewItem(categoryName, createCategory, fetchCategories, 'category')
  if (newCategory) {
    formData.category_id = newCategory.id
  } else {
    formData.category_id = undefined
  }
}

// 处理标签选择变化
const handleTagSelect = async (values: any[]) => {
  const { validIds, newNames } = values.reduce(
    (acc, value) => {
      if (typeof value === 'string') {
        const tagName = value.trim()
        if (!tagName || tagName.length > 50) return acc

        const existing = tags.value.find(tag =>
          tag.name.toLowerCase() === tagName.toLowerCase()
        )
        if (existing) {
          acc.validIds.push(existing.id)
          ElMessage.info(`已选择现有标签"${existing.name}"`)
        } else {
          acc.newNames.push(tagName)
        }
      } else if (typeof value === 'number') {
        acc.validIds.push(value)
      }
      return acc
    },
    { validIds: [] as number[], newNames: [] as string[] }
  )

  formData.tag_ids = validIds

  // 批量创建新标签
  if (newNames.length > 0) {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: `正在创建${newNames.length}个新标签...`,
      background: 'rgba(0, 0, 0, 0.7)'
    })

    let successCount = 0
    for (const tagName of newNames) {
      const newTag = await createNewItem(tagName, createTag, fetchTags, 'tag')
      if (newTag) {
        formData.tag_ids.push(newTag.id)
        successCount++
      }
    }

    loadingInstance.close()
    if (successCount > 0) {
      ElMessage.success(`成功创建${successCount}个新标签`)
    }
  }
}

// 初始化数据
const initData = async () => {
  await Promise.all([fetchCategories(), fetchTags()])

  if (isEdit.value) {
    const id = Number(route.params.id)
    if (id) {
      await fetchArticle(id)
    } else {
      ElMessage.error('无效的文章ID')
      router.push('/articles')
    }
  }
}

onMounted(initData)

// 路由离开守卫：离开页面时自动保存草稿
onBeforeRouteLeave(async (to, from, next) => {
  // 如果已保存，直接离开
  if (isSaved.value) {
    next()
    return
  }

  // 有内容未保存
  if (hasFormChanged()) {
    // 只有草稿或新建文章才自动保存
    if (canAutoSave.value) {
      console.log('🚀 检测到未保存内容，自动保存草稿...')
      await saveDraftSilently()
      ElMessage.info('内容已自动保存为草稿')
    } else {
      // 已发布文章：提示用户选择操作
      try {
        await ElMessageBox.confirm(
          '当前文章未保存，是否保存后退出？',
          '提示',
          {
            type: 'warning',
            confirmButtonText: '保存并退出',
            cancelButtonText: '放弃修改',
            showClose: true,           // 显示 X 按钮
            closeOnPressEscape: true,  // 允许 ESC 关闭
            closeOnClickModal: true,   // 允许点击遮罩关闭
            distinguishCancelAndClose: true  // 区分取消和关闭
          }
        )

        // 用户点击"保存并退出"
        try {
          await handleSave(false)
          next()
        } catch (error) {
          next(false)
        }
      } catch (action) {
        // action 可能是 'cancel'（点击按钮） 或 'close'（点击X/ESC/遮罩）
        if (action === 'cancel') {
          // 用户点击"放弃修改" - 直接退出
          next()
        } else {
          // 用户点击 X 或 ESC 或遮罩 = 继续编辑
          next(false)
        }
      }
      return
    }
  }

  next()
})
</script>

<style scoped lang="scss">
.article-editor-page {
  height: 100vh; // 固定视窗高度，让编辑器 footer 固定在底部
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden; // 防止整体页面滚动

  // 固定顶部导航栏
  .editor-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #e4e7ed;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;

      .page-label {
        font-size: 14px;
        font-weight: 500;
        color: #606266;
        white-space: nowrap;
      }
    }

    .header-center {
      flex: 1;
      min-width: 0; // 允许flex项缩小
      border: 1px solid #757575;
      border-radius: 4px;

      .title-form-item {
        margin-bottom: 0;

        :deep(.el-form-item__content) {
          line-height: normal;
        }

        :deep(.el-form-item__error) {
          position: absolute;
          bottom: -20px;
          left: 0;
          font-size: 12px;
        }
      }

      .header-title-input {
        width: 100%;
        border: none;
        outline: none;
        font-size: 16px;
        font-weight: 500;
        color: #303133;
        background: transparent;
        padding: 8px 12px;
        border-radius: 4px;
        transition: background-color 0.2s;

        &::placeholder {
          color: #c0c4cc;
          font-weight: 400;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      flex-wrap: wrap;

      .header-center {
        order: 3;
        flex-basis: 100%;
      }
    }
  }

  // 主编辑区域
  .editor-main {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0; // 修复 flex 子元素高度问题
  }

  // 抽屉内的表单
  :deep(.el-drawer__body) {
    padding: 24px;

    .el-form-item {
      margin-bottom: 24px;
    }

    .el-form-item__label {
      font-weight: 500;
      color: #303133;
      margin-bottom: 8px;
      font-size: 14px;
    }
  }

  // 两列布局
  .drawer-form {
    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 0;

      .form-col {
        flex: 1;
        min-width: 0; // 防止内容溢出
      }

      .form-switches {
        display: flex;
        gap: 20px;

        .switch-item {
          flex: 1;
        }
      }

      // 响应式：小屏幕时改为单列
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 0;

        .form-switches {
          flex-direction: column;
          gap: 0;
        }
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
    line-height: 1.5;
  }

  :deep(.el-divider) {
    margin: 28px 0;
  }

  // 抽屉底部保存按钮
  .drawer-footer {
    margin-top: 16px;
    padding-top: 24px;
    border-top: 1px solid #e4e7ed;
  }

  // 加载状态优化
  :deep(.el-loading-mask) {
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
  }
}
</style>
