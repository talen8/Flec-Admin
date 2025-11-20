// 文章实体
export interface Article {
    id: number
    title: string
    content: string
    summary?: string
    cover?: string
    is_publish: boolean  // 是否已发布
    is_top: boolean
    view_count: number
    comment_count: number
    location?: string
    publish_time?: string
    update_time?: string
    category?: {
        id: number
        name: string
    }
    tags?: Array<{
        id: number
        name: string
    }>
}

// 创建文章请求
export interface CreateArticleRequest {
    title: string
    content: string
    summary?: string
    cover?: string
    category_id?: number
    tag_ids?: number[]
    location?: string
    is_top?: boolean
}

// 更新文章请求  
export interface UpdateArticleRequest {
    title?: string
    content?: string
    summary?: string
    cover?: string
    category_id?: number
    tag_ids?: number[]
    location?: string
    is_top?: boolean
    publish_time?: string
    update_time?: string
}

// 分页数据
export interface ArticleListData {
    list: Article[]
    total: number
    page: number
    page_size: number
}
