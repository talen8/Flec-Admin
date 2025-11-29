<template>
  <div class="common-list">
    <el-card>
      <!-- 工具栏 -->
      <div class="toolbar">
        <h2>系统设置</h2>
        <div class="actions">
          <el-button type="primary" :loading="saving" @click="handleSave">
            保存配置
          </el-button>
          <el-button @click="loadAllConfigs">重置</el-button>
        </div>
      </div>

      <!-- 标签页内容 -->
      <el-tabs v-model="activeTab" class="setting-tabs">
          <!-- 站点信息标签页 -->
          <el-tab-pane label="站点信息" name="site">
            <el-form :model="siteForm" label-width="120px" class="setting-form">
              <el-form-item label="站点名称" required>
                <el-input v-model="siteForm.name" placeholder="用于RSS订阅和邮件显示的站点名" :disabled="loading" />
              </el-form-item>

              <el-form-item label="前台地址" required>
                <el-input v-model="siteForm.web_url" placeholder="例如 https://your-site.com" :disabled="loading" />
              </el-form-item>

              <el-form-item label="后台地址" required>
                <el-input v-model="siteForm.admin_url" placeholder="例如 https://admin.your-site.com"
                  :disabled="loading" />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 通知配置标签页 -->
          <el-tab-pane label="通知配置" name="notification">
            <el-form :model="emailForm" label-width="120px" class="setting-form">
              <el-form-item label="SMTP 服务器">
                <el-input v-model="emailForm.smtp_host" placeholder="例如 smtp.163.com" :disabled="loading" />
              </el-form-item>

              <el-form-item label="SMTP 端口">
                <el-input v-model="emailForm.smtp_port" type="number" placeholder="例如 465" :disabled="loading" />
              </el-form-item>

              <el-form-item label="SMTP 用户名">
                <el-input v-model="emailForm.smtp_username" placeholder="邮箱账号，例如 user@domain.com" :disabled="loading" />
              </el-form-item>

              <el-form-item label="SMTP 密码">
                <el-input v-model="emailForm.smtp_password" type="password" show-password placeholder="邮箱授权码或密码"
                  :disabled="loading" />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 导入导出标签页 -->
          <el-tab-pane label="导入导出" name="import-export">
            <el-form label-width="100px" class="setting-form">
              <el-form-item label="文章数据">
                <el-button type="primary" @click="handleArticleImport">导入文章</el-button>
              </el-form-item>

              <el-form-item label="评论数据">
                <el-button type="primary" @click="handleCommentImport">导入评论</el-button>
                <el-button disabled style="margin-left: 10px;">导出评论</el-button>
              </el-form-item>

              <el-form-item label="友链数据">
                <el-button disabled>导入友链</el-button>
                <el-button disabled style="margin-left: 10px;">导出友链</el-button>
              </el-form-item>

              <el-form-item label="全站备份">
                <el-button disabled>备份数据</el-button>
                <el-button disabled style="margin-left: 10px;">恢复数据</el-button>
              </el-form-item>
            </el-form>

            <!-- 文章导入对话框 -->
            <import-article-dialog v-model="articleImportVisible" @success="handleImportSuccess" />
            
            <!-- 评论导入对话框 -->
            <import-comment-dialog v-model="commentImportVisible" @success="handleImportSuccess" />
          </el-tab-pane>
        </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettingGroup, updateSettingGroup } from '@/api/sysconfig'
import type { UpdateSettingGroupRequest } from '@/types/sysconfig'
import ImportArticleDialog from './components/ImportArticleDialog.vue'
import ImportCommentDialog from './components/ImportCommentDialog.vue'

// 页面状态
const activeTab = ref('site')
const loading = ref(false)
const saving = ref(false)
const articleImportVisible = ref(false)
const commentImportVisible = ref(false)

// 站点配置表单
const siteForm = ref({
  name: '',
  web_url: '',
  admin_url: ''
})

// 邮箱配置表单
const emailForm = ref({
  smtp_host: '',
  smtp_port: '465',
  smtp_username: '',
  smtp_password: ''
})

// 加载站点配置
const loadSiteConfigs = async () => {
  try {
    const data = await getSettingGroup('site')
    const configs: Record<string, string> = {}
    data.settings.forEach(item => {
      const key = item.key.replace('site.', '')
      configs[key] = item.value
    })

    siteForm.value.name = configs.name || ''
    siteForm.value.web_url = configs.web_url || ''
    siteForm.value.admin_url = configs.admin_url || ''
  } catch {
    ElMessage.error('获取站点配置失败')
  }
}

// 加载邮箱配置
const loadEmailConfigs = async () => {
  try {
    const data = await getSettingGroup('email')
    const configs: Record<string, string> = {}
    data.settings.forEach(item => {
      const key = item.key.replace('email.', '')
      configs[key] = item.value
    })

    emailForm.value.smtp_host = configs.smtp_host || ''
    emailForm.value.smtp_port = configs.smtp_port || '465'
    emailForm.value.smtp_username = configs.smtp_username || ''
    emailForm.value.smtp_password = configs.smtp_password || ''
  } catch {
    ElMessage.error('获取邮箱配置失败')
  }
}

// 加载所有配置
const loadAllConfigs = async () => {
  loading.value = true
  try {
    await Promise.all([loadSiteConfigs(), loadEmailConfigs()])
  } finally {
    loading.value = false
  }
}

// 统一保存配置
const handleSave = async () => {
  saving.value = true
  try {
    // 站点配置
    const sitePayload: UpdateSettingGroupRequest = {
      settings: {
        'site.name': siteForm.value.name,
        'site.web_url': siteForm.value.web_url,
        'site.admin_url': siteForm.value.admin_url
      }
    }

    // 邮箱配置
    const emailPayload: UpdateSettingGroupRequest = {
      settings: {
        'email.smtp_host': emailForm.value.smtp_host,
        'email.smtp_port': String(emailForm.value.smtp_port),
        'email.smtp_username': emailForm.value.smtp_username,
        'email.smtp_password': emailForm.value.smtp_password
      }
    }

    // 并行保存两个配置组
    await Promise.all([
      updateSettingGroup('site', sitePayload),
      updateSettingGroup('email', emailPayload)
    ])

    ElMessage.success('配置保存成功')
  } catch (e) {
    if (e instanceof Error) ElMessage.error(e.message)
    else ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 导入导出功能
const handleArticleImport = () => {
  articleImportVisible.value = true
}

const handleCommentImport = () => {
  commentImportVisible.value = true
}

const handleImportSuccess = () => {
  articleImportVisible.value = false
  commentImportVisible.value = false
}

onMounted(() => {
  loadAllConfigs()
})
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    color: #303133;
  }
}

.actions {
  display: flex;
  gap: 12px;
}

.setting-form {
  max-width: 600px;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__header) {
  margin: 0 0 30px 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  font-weight: 500;
  font-size: 14px;
  color: #606266;
}

:deep(.el-tabs__item.is-active) {
  color: #409EFF;
}

:deep(.el-tabs__active-bar) {
  background-color: #409EFF;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__inner) {
  border-radius: 6px;
}

:deep(.el-button) {
  border-radius: 6px;
}
</style>
