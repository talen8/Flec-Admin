import request from "@/utils/request";
import type { Article, CreateArticleRequest, UpdateArticleRequest, ImportArticlesResult } from "@/types/article";
import type { PaginationQuery } from "@/types/request";

/**
 * 获取文章列表
 * @param params 查询参数
 * @returns Promise<ArticleListResponse>
 */
export function getArticles(params: PaginationQuery): Promise<any> {
  return request.get("/admin/articles", { params });
}

/**
 * 获取文章详情
 * @param id 文章ID
 * @returns Promise<Article>
 */
export function getArticle(id: number): Promise<Article> {
  return request.get(`/admin/articles/${id}`);
}

/**
 * 创建文章
 * @param data 文章数据
 * @returns Promise<Article>
 */
export function createArticle(data: CreateArticleRequest): Promise<Article> {
  return request.post("/admin/articles", data);
}

/**
 * 更新文章
 * @param id 文章ID
 * @param data 文章数据
 * @returns Promise<Article>
 */
export function updateArticle(id: number, data: UpdateArticleRequest): Promise<Article> {
  return request.put(`/admin/articles/${id}`, data);
}

/**
 * 删除文章
 * @param id 文章ID
 * @returns Promise<void>
 */
export function deleteArticle(id: number): Promise<void> {
  return request.delete(`/admin/articles/${id}`);
}

/**
 * 导入文章
 * @param formData 包含文件和参数的 FormData
 * @returns Promise<ImportArticlesResult>
 */
export function importArticles(formData: FormData): Promise<ImportArticlesResult> {
  return request.post("/admin/articles/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}