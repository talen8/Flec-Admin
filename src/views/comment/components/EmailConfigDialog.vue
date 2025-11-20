<template>
  <el-dialog v-model="visible" :title="'邮箱配置'" width="600px" :close-on-click-modal="false" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="SMTP 服务器">
        <el-input v-model="form.smtp_host" placeholder="例如 smtp.163.com" />
      </el-form-item>
      <el-form-item label="SMTP 端口">
        <el-input v-model="form.smtp_port" type="number" placeholder="例如 465" />
      </el-form-item>
      <el-form-item label="SMTP 用户名">
        <el-input v-model="form.smtp_username" placeholder="邮箱账号，例如 user@domain.com" />
      </el-form-item>
      <el-form-item label="SMTP 密码">
        <el-input v-model="form.smtp_password" type="password" show-password placeholder="邮箱授权码或密码" />
      </el-form-item>
      <el-form-item label="站点名称">
        <el-input v-model="form.site_name" placeholder="用于邮件显示的站点名" />
      </el-form-item>
      <el-form-item label="前台地址">
        <el-input v-model="form.web_url" placeholder="例如 https://your-site.com" />
      </el-form-item>
      <el-form-item label="后台地址">
        <el-input v-model="form.admin_url" placeholder="例如 https://admin.your-site.com" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettingGroup, updateSettingGroup } from '@/api/sysconfig'
import type { UpdateSettingGroupRequest } from '@/types/sysconfig'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean], 'success': [] }>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const formRef = ref()
const saving = ref(false)

const form = ref({
  smtp_host: '',
  smtp_port: '465',
  smtp_username: '',
  smtp_password: '',
  site_name: '',
  web_url: '',
  admin_url: ''
})

const loadConfigs = async () => {
  try {
    const data = await getSettingGroup('email')
    // 将 settings 数组转换为对象
    const configs: Record<string, string> = {}
    data.settings.forEach(item => {
      const key = item.key.replace('email.', '') // 移除前缀
      configs[key] = item.value
    })
    
    form.value.smtp_host = configs.smtp_host || ''
    form.value.smtp_port = configs.smtp_port || '465'
    form.value.smtp_username = configs.smtp_username || ''
    form.value.smtp_password = configs.smtp_password || ''
    form.value.site_name = configs.site_name || ''
    form.value.web_url = configs.web_url || ''
    form.value.admin_url = configs.admin_url || ''
  } catch {
    ElMessage.error('获取配置失败')
  }
}

watch(() => visible.value, (val) => { if (val) loadConfigs() })

const handleSubmit = async () => {
  saving.value = true
  try {
    const payload: UpdateSettingGroupRequest = {
      settings: {
        'email.smtp_host': form.value.smtp_host,
        'email.smtp_port': String(form.value.smtp_port),
        'email.smtp_username': form.value.smtp_username,
        'email.smtp_password': form.value.smtp_password,
        'email.site_name': form.value.site_name,
        'email.web_url': form.value.web_url,
        'email.admin_url': form.value.admin_url
      }
    }
    await updateSettingGroup('email', payload)
    ElMessage.success('保存成功（配置已自动热重载）')
    emit('success')
    visible.value = false
  } catch (e) {
    if (e instanceof Error) ElMessage.error(e.message)
    else ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {}
</script>

<style scoped>
.dialog-footer { display: inline-flex; gap: 12px; }
</style>