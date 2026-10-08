import { queryOptions } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import { compressImage } from './image-compression'
import type { ImageCompressionOptions } from './image-compression'

export type BlogAuthorDto = {
  id: string
  displayName: string
  avatarInitial: string
  role: string
}

export type BlogPostDto = {
  id: string
  author: BlogAuthorDto
  slug: string
  title: string
  description: string
  coverMediaId: string | null
  bodyHtml: string
  bodyJson: Record<string, unknown>
  readingTimeMinutes: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt: string | null
  contentUpdatedAt: string | null
  createdAt: string
  updatedAt: string
}

export type BlogPostSummaryDto = {
  id: string
  author: BlogAuthorDto
  slug: string
  title: string
  description: string
  coverMediaId: string | null
  readingTimeMinutes: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt: string | null
  contentUpdatedAt: string | null
}

export type PublicBlogPostDto = {
  id: string
  author: BlogAuthorDto
  slug: string
  title: string
  description: string
  coverMediaId: string | null
  bodyHtml: string
  readingTimeMinutes: number
  publishedAt: string | null
  contentUpdatedAt: string | null
}

export type BlogMediaDto = {
  id: string
  kind: string
  originalName: string
  mimeType: string
  byteSize: number
  createdAt: string
}

export type BlogSaveInput = {
  slug: string
  title: string
  description: string
  coverMediaId: string | null
  bodyHtml: string
  bodyJson: Record<string, unknown>
}

export type WriterApplicationDto = {
  id: string
  userId: string
  userEmail: string
  userDisplayName: string
  overallBand: number
  listeningBand: number | null
  readingBand: number
  writingBand: number
  speakingBand: number
  trfNumber: string
  testDate: string | null
  examType: 'academic' | 'general' | null
  bio: string
  certificateMediaId: string
  certificateMime: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNotes: string
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type WriterApplyInput = {
  overallBand: number
  listeningBand: number | null
  readingBand: number
  writingBand: number
  speakingBand: number
  trfNumber: string
  testDate: string | null
  examType: 'academic' | 'general' | null
  bio: string
  certificateMediaId: string
}

export const blogQueryKeys = {
  posts: ['blog', 'posts'] as const,
  post: (slug: string) => ['blog', 'posts', slug] as const,
  myPosts: ['blog', 'my-posts'] as const,
  adminPosts: ['blog', 'admin', 'posts'] as const,
  applications: ['blog', 'writer-applications'] as const,
  myApplication: ['blog', 'writer-applications', 'mine'] as const,
}

export function blogMediaUrl(mediaId: string) {
  return `/api/v1/blog/media/${mediaId}`
}

// Crawlers and social previews need an absolute image URL on the API origin.
export function blogMediaAbsoluteUrl(mediaId: string) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')
  return `${apiBaseUrl ?? ''}${blogMediaUrl(mediaId)}`
}

export const BLOG_PAGE_SIZE = 12

// ---------- Public blog ----------

export function listPublishedPosts(
  limit = 20,
  offset = 0,
  signal?: AbortSignal,
) {
  return apiClient.request<{
    items: BlogPostSummaryDto[]
    total: number
  }>(`/api/v1/blog/posts?limit=${limit}&offset=${offset}`, {
    signal,
    authenticated: false,
  })
}

export function getPublishedPost(slug: string, signal?: AbortSignal) {
  return apiClient.request<PublicBlogPostDto>(`/api/v1/blog/posts/${slug}`, {
    signal,
    authenticated: false,
  })
}

export function publishedPostsQueryOptions(page: number) {
  const offset = (page - 1) * BLOG_PAGE_SIZE
  return queryOptions({
    queryKey: [...blogQueryKeys.posts, 'page', page],
    queryFn: ({ signal }) => listPublishedPosts(BLOG_PAGE_SIZE, offset, signal),
  })
}

export function publishedPostQueryOptions(slug: string) {
  return queryOptions({
    queryKey: blogQueryKeys.post(slug),
    queryFn: ({ signal }) => getPublishedPost(slug, signal),
  })
}

// The backend caps a page at 50 items; feeds and sitemaps need every post.
export async function listAllPublishedPosts() {
  const pageSize = 50
  const items: BlogPostSummaryDto[] = []
  for (let offset = 0; ; offset += pageSize) {
    const page = await listPublishedPosts(pageSize, offset)
    items.push(...page.items)
    if (page.items.length < pageSize || items.length >= page.total) break
  }
  return items
}

// ---------- Writer workspace ----------

export function listMyPosts(signal?: AbortSignal) {
  return apiClient.request<{ items: BlogPostDto[] }>('/api/v1/writer/posts', {
    signal,
  })
}

export function createPost(input: BlogSaveInput) {
  return apiClient.request<BlogPostDto>('/api/v1/writer/posts', {
    method: 'POST',
    body: input,
  })
}

export function updatePost(postId: string, input: BlogSaveInput) {
  return apiClient.request<BlogPostDto>(`/api/v1/writer/posts/${postId}`, {
    method: 'PUT',
    body: input,
  })
}

export function publishPost(postId: string) {
  return apiClient.request<BlogPostDto>(
    `/api/v1/writer/posts/${postId}/publish`,
    { method: 'POST', body: {} },
  )
}

export function archivePost(postId: string) {
  return apiClient.request<BlogPostDto>(
    `/api/v1/writer/posts/${postId}/archive`,
    { method: 'POST', body: {} },
  )
}

export async function uploadBlogMedia(
  file: File,
  compression?: ImageCompressionOptions,
) {
  const form = new FormData()
  form.append('file', await compressImage(file, compression))
  return apiClient.upload<BlogMediaDto>('/api/v1/blog/media', form)
}

// ---------- Writer applications ----------

export function getMyApplication(signal?: AbortSignal) {
  return apiClient.request<{
    application: WriterApplicationDto | null
    exists: boolean
  }>('/api/v1/writers/applications/mine', { signal })
}

export function submitWriterApplication(input: WriterApplyInput) {
  return apiClient.request<WriterApplicationDto>(
    '/api/v1/writers/applications',
    { method: 'POST', body: input },
  )
}

// ---------- Admin ----------

export function listWriterApplications(status?: string, signal?: AbortSignal) {
  const query = status ? `?status=${status}` : ''
  return apiClient.request<{ items: WriterApplicationDto[] }>(
    `/api/v1/admin/writers/applications${query}`,
    { signal },
  )
}

export function approveWriterApplication(applicationId: string, notes = '') {
  return apiClient.request<WriterApplicationDto>(
    `/api/v1/admin/writers/applications/${applicationId}/approve`,
    { method: 'POST', body: { notes } },
  )
}

export function rejectWriterApplication(applicationId: string, notes = '') {
  return apiClient.request<WriterApplicationDto>(
    `/api/v1/admin/writers/applications/${applicationId}/reject`,
    { method: 'POST', body: { notes } },
  )
}

export function listAdminBlogPosts(signal?: AbortSignal) {
  return apiClient.request<{ items: BlogPostDto[] }>(
    '/api/v1/admin/blog/posts',
    { signal },
  )
}
