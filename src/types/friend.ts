// ========== 友链类型相关 ==========
// 友链类型实体
export interface FriendType {
  id: number
  name: string
  sort: number
  is_enabled: boolean
  count: number // 该类型下的友链数量
}

// 友链类型列表响应数据
export interface FriendTypeListData {
  list: FriendType[]
  total: number
  page: number
  page_size: number
}

// 创建友链类型请求
export interface CreateFriendTypeRequest {
  name: string
  sort?: number
  is_enabled?: boolean
}

// 更新友链类型请求
export interface UpdateFriendTypeRequest {
  name?: string
  sort?: number
  is_enabled?: boolean
}

// ========== 友链相关 ==========
// 友链实体
export interface Friend {
  id: number
  name: string
  url: string
  description: string
  avatar: string
  screenshot: string // 网站截图
  sort: number // 排序值，范围1-10，默认5
  type_id: number | null // 友链类型ID
  type_name?: string // 友链类型名称
  is_invalid: boolean // 是否失效
  is_pending: boolean // 是否为待审核申请
}

// 友链列表查询参数
export interface FriendQuery {
  page?: number
  page_size?: number
}

// 友链列表响应数据
export interface FriendListData {
  list: Friend[]
  total: number
  page: number
  page_size: number
}

// 创建友链请求
export interface CreateFriendRequest {
  name: string
  url: string
  description?: string
  avatar?: string
  screenshot?: string
  sort?: number // 排序值，范围1-10，默认5
  type_id: number // 友链类型ID（必选）
}

// 更新友链请求
export interface UpdateFriendRequest {
  name?: string
  url?: string
  description?: string
  avatar?: string
  screenshot?: string
  sort?: number // 排序值，范围1-10
  type_id?: number | null
  is_invalid?: boolean // 是否失效
  is_pending?: boolean // 是否为待审核申请
}
