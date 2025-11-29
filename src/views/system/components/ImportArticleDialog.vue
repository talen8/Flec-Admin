<template>
  <el-dialog v-model="dialogVisible" title="导入文章" width="500px" :close-on-click-modal="false">
    <el-upload
      :auto-upload="false"
      :file-list="fileList"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      accept=".md,.markdown"
      :limit="100"
      multiple
      drag
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">拖拽或点击选择 Markdown 文件</div>
      <template #tip>
        <div class="el-upload__tip">支持 Hexo/Markdown 格式文章，最多 100 个文件</div>
      </template>
    </el-upload>

    <el-alert
      v-if="importResult"
      :type="importResult.failed > 0 ? 'warning' : 'success'"
      :closable="false"
      style="margin-top: 16px"
    >
      <div>成功 {{ importResult.success }} 篇，失败 {{ importResult.failed }} 篇</div>
      <div v-if="importResult.errors?.length" style="margin-top: 8px; font-size: 12px; color: #909399;">
        <div v-for="(err, i) in importResult.errors" :key="i">{{ err.filename }}: {{ err.error }}</div>
      </div>
    </el-alert>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="uploading" :disabled="fileList.length === 0" @click="handleImport">
        {{ uploading ? '导入中...' : '开始导入' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadUserFile, UploadFile } from 'element-plus'
import { importArticles } from '@/api/article'
import type { ImportArticlesResult } from '@/types/article'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const fileList = ref<UploadUserFile[]>([])
const uploading = ref(false)
const importResult = ref<ImportArticlesResult | undefined>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleFileChange = (file: UploadFile, files: UploadUserFile[]) => {
  fileList.value = files
}

const handleFileRemove = (file: UploadFile, files: UploadUserFile[]) => {
  fileList.value = files
}

const handleImport = async () => {
  if (fileList.value.length === 0) return

  try {
    uploading.value = true
    importResult.value = undefined

    const formData = new FormData()
    fileList.value.forEach(file => {
      if (file.raw) formData.append('files', file.raw)
    })

    const result = await importArticles(formData)
    importResult.value = result

    if (result.failed === 0) {
      ElMessage.success(`成功导入 ${result.success} 篇文章`)
      emit('success')
    } else if (result.success > 0) {
      ElMessage.warning(`导入完成：成功 ${result.success} 篇，失败 ${result.failed} 篇`)
      emit('success')
    } else {
      ElMessage.error('导入失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    uploading.value = false
  }
}

watch(dialogVisible, (val) => {
  if (!val) {
    setTimeout(() => {
      fileList.value = []
      importResult.value = undefined
    }, 300)
  }
})
</script>

<style scoped>
:deep(.el-icon--upload) {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 12px;
}
</style>
