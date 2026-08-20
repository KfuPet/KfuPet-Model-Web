export interface User {
  id: number
  username: string
  email: string
  avatarUrl: string | null
  bio: string | null
  role: 'USER' | 'ADMIN' | 'SUPERADMIN'
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  sortOrder?: number
}

export interface Tag {
  id: number
  name: string
  slug: string
}

export interface Post {
  id: number
  title: string
  content: string
  authorId: number
  categoryId: number
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  isFeatured: boolean
  status: string
  createdAt: string
  updatedAt: string
  author: User
  category: Category
  tags: Tag[]
}

export interface Comment {
  id: number
  postId: number
  authorId: number
  parentId: number | null
  content: string
  likeCount: number
  status: string
  createdAt: string
  author: User
}

export interface PackageVersion {
  id: number
  packageId: number
  version: string
  changelog: string | null
  fileSize: number
  storageKey: string
  minKfuPetVersion: string | null
  downloadCount: number
  createdAt: string
}

export interface ModelPackage {
  id: number
  name: string
  slug: string
  description: string | null
  coverUrl: string | null
  previewUrls: string[]
  authorId: number
  categoryId: number
  status: string
  downloadCount: number
  favoriteCount: number
  createdAt: string
  updatedAt: string
  author: User
  category: Category
  tags: Tag[]
  versionCount?: number
  versions?: PackageVersion[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface HomeData {
  latestPosts: Post[]
  hotPosts: Post[]
  latestModels: ModelPackage[]
}
