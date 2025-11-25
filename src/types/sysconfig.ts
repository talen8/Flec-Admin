// 配置分组类型
export type SettingGroupType = 'site' | 'email' | 'upload'

// 配置分组信息
export interface SettingGroup {
  key: SettingGroupType
  label: string
}

// 单个配置项
export interface SettingItem {
  key: string
  value: string
}

// 获取配置分组响应
export interface SettingGroupResponse {
  group: SettingGroupType
  settings: SettingItem[]
}

// 更新配置分组请求
export interface UpdateSettingGroupRequest {
  settings: Record<string, string> // key-value 对象
}
