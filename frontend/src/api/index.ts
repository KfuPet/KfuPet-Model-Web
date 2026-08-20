import http from './http'
import type { HomeData } from './types'

export const authApi = {
  register(data: { username: string; email: string; password: string }) {
    return http.post('/auth/register', data).then((r) => r.data)
  },
  login(data: { identifier: string; password: string }) {
    return http.post('/auth/login', data).then((r) => r.data)
  },
}

export const homeApi = {
  getHome(): Promise<HomeData> {
    return http.get('/home').then((r) => r.data)
  },
}

export const communityApi = {
  categories() {
    return http.get('/community/categories').then((r) => r.data)
  },
  posts(params?: Record<string, unknown>) {
    return http.get('/community/posts', { params }).then((r) => r.data)
  },
  post(id: number) {
    return http.get(`/community/posts/${id}`).then((r) => r.data)
  },
  createPost(data: {
    title: string
    content: string
    categoryId: number
    tagIds?: number[]
  }) {
    return http.post('/community/posts', data).then((r) => r.data)
  },
  comments(postId: number) {
    return http.get(`/community/posts/${postId}/comments`).then((r) => r.data)
  },
  createComment(postId: number, data: { content: string; parentId?: number }) {
    return http
      .post(`/community/posts/${postId}/comments`, data)
      .then((r) => r.data)
  },
}

export const modelsApi = {
  categories() {
    return http.get('/model-categories').then((r) => r.data)
  },
  list(params?: Record<string, unknown>) {
    return http.get('/models', { params }).then((r) => r.data)
  },
  get(id: number) {
    return http.get(`/models/${id}`).then((r) => r.data)
  },
  create(data: {
    name: string
    description?: string
    categoryId: number
    tagIds?: number[]
    status?: string
  }) {
    return http.post('/models', data).then((r) => r.data)
  },
  versions(id: number) {
    return http.get(`/models/${id}/versions`).then((r) => r.data)
  },
  uploadVersion(id: number, formData: FormData) {
    return http.post(`/models/${id}/versions`, formData).then((r) => r.data)
  },
  downloadUrl(id: number, versionId: number) {
    return `/api/models/${id}/versions/${versionId}/download`
  },
}
