// 用户实体
export interface User {
    id: number
    email: string
    nickname: string
    avatar: string
    website?: string
    role: string   // super_admin | admin | user | guest
    is_enabled: boolean // 是否启用
    last_login: string
    deleted_at?: string
}

// 登录请求
export interface LoginParams {
    email: string
    password: string
}

// 登录响应
export interface LoginResponse {
    access_token: string
    refresh_token: string
    user: {
        id: number
        nickname: string
        email: string
        avatar: string
        role: string
    }
}

// 重置密码请求
export interface ResetPasswordRequest {
    new_password: string
}

// 创建用户请求
export interface CreateUserRequest {
    password: string
    email: string
    nickname: string
    avatar?: string
    website?: string
    role: 'super_admin' | 'admin' | 'user' | 'guest'
}

// 更新用户请求
export interface UpdateUserRequest {
    password?: string
    email?: string
    nickname?: string
    avatar?: string
    website?: string
    role?: 'super_admin' | 'admin' | 'user' | 'guest'
    is_enabled?: boolean
}

// 分页数据
export interface UserListData {
    list: User[]
    total: number
    page: number
    page_size: number
}

// 刷新Token请求
export interface RefreshTokenRequest {
    refresh_token: string
}

// 刷新Token响应
export interface RefreshTokenResponse {
    access_token: string
    refresh_token: string
}
