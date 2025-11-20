import request from "@/utils/request";
import type { Article, ArticleListData, CreateArticleRequest, UpdateArticleRequest } from "@/types/article";
import type { PaginationQuery } from "@/types/request";

/**
 * 获取文章列表
 * @param params 查询参数
 * @returns Promise<ArticleListData>
 */
export function getArticles(params: PaginationQuery): Promise<ArticleListData> {
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