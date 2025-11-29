<template>
  <el-dialog v-model="dialogVisible" title="导入评论" width="600px" :close-on-click-modal="false">
    <el-form label-width="100px">
      <el-form-item label="数据来源">
        <el-select v-model="sourceType" placeholder="请选择数据来源" style="width: 100%">
          <el-option label="Artalk" value="artalk" />
        </el-select>
        <div class="form-tip">
          选择评论数据的来源系统，目前支持 Artalk 评论系统
        </div>
      </el-form-item>

      <el-form-item label="上传文件">
        <el-upload
          :auto-upload="false"
          :file-list="fileList"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          accept=".json,.artrans"
          :limit="1"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">拖拽或点击选择文件</div>
          <template #tip>
            <div class="el-upload__tip">
              支持 JSON 或 Artrans 格式文件，单个文件最大 10MB
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="importResult"
      :type="importResult.failed > 0 ? 'warning' : 'success'"
      :closable="false"
      style="margin-top: 16px"
    >
      <div>
        <strong>导入完成</strong>
      </div>
      <div style="margin-top: 8px">
        总计 {{ importResult.total }} 条，成功 {{ importResult.success }} 条，失败 {{ importResult.failed }} 条
      </div>
      <div v-if="importResult.user_created > 0" style="margin-top: 4px; font-size: 12px; color: #909399">
        自动创建了 {{ importResult.user_created }} 个游客用户账号
      </div>
      <div v-if="importResult.errors?.length" style="margin-top: 12px; font-size: 12px; color: #909399; max-height: 200px; overflow-y: auto">
        <div><strong>失败详情：</strong></div>
        <div v-for="(err, i) in importResult.errors" :key="i" style="margin-top: 4px">
          第 {{ err.index + 1 }} 条: {{ err.error }}
        </div>
      </div>
    </el-alert>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button 
        type="primary" 
        :loading="uploading" 
        :disabled="fileList.length === 0 || !sourceType" 
        @click="handleImport"
      >
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
import { importComments } from '@/api/comment'
import type { ImportCommentsResult } from '@/types/comment'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const fileList = ref<UploadUserFile[]>([])
const uploading = ref(false)
const importResult = ref<ImportCommentsResult | undefined>()
const sourceType = ref<string>('artalk')

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
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  if (!sourceType.value) {
    ElMessage.warning('请选择数据来源')
    return
  }

  try {
    uploading.value = true
    importResult.value = undefined

    const formData = new FormData()
    const rawFile = fileList.value[0]?.raw
    if (!rawFile) {
      ElMessage.error('文件读取失败')
      return
    }
    formData.append('file', rawFile)
    formData.append('source_type', sourceType.value)

    const result = await importComments(formData)
    importResult.value = result

    if (result.failed === 0) {
      ElMessage.success(`成功导入 ${result.success} 条评论`)
      emit('success')
    } else if (result.success > 0) {
      ElMessage.warning(`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
      emit('success')
    } else {
      ElMessage.error('导入失败，请检查文件格式')
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
      sourceType.value = 'artalk'
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

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 8px;
}
</style>
