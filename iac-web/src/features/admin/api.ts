import { apiClient } from '@/lib/api/client'

import type { UserRole } from '@/features/auth/auth-store'

export type AdminAccessDto = {
  userId: string
  role: Extract<UserRole, 'EDITOR' | 'ADMIN'>
}

export const adminQueryKeys = {
  access: ['admin', 'access'] as const,
  readingMaterials: ['admin', 'reading', 'materials'] as const,
  readingMaterial: (id: string) =>
    ['admin', 'reading', 'materials', id] as const,
  waitlist: ['admin', 'waitlist'] as const,
  superAdmins: ['admin', 'super-admins'] as const,
}

export function getAdminAccess(signal?: AbortSignal) {
  return apiClient.request<AdminAccessDto>('/api/v1/admin/access', { signal })
}

export type ReadingMaterial = {
  id: string
  slug: string
  examType: 'academic' | 'general'
  difficulty: 'foundation' | 'intermediate' | 'advanced'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  revision: number
  title: string
  description: string
  body: string
  sourceTitle: string | null
  sourceUrl: string | null
  currentVersionNumber: number
  publishedVersionId: string | null
  hasUnpublishedChanges: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ReadingMaterialInput = {
  slug: string
  examType: ReadingMaterial['examType']
  difficulty: ReadingMaterial['difficulty']
  title: string
  description: string
  body: string
  sourceTitle: string | null
  sourceUrl: string | null
  revision?: number
}

export function listReadingMaterials(signal?: AbortSignal) {
  return apiClient.request<{ items: ReadingMaterial[] }>(
    '/api/v1/admin/reading/materials',
    { signal },
  )
}

export function getReadingMaterial(id: string, signal?: AbortSignal) {
  return apiClient.request<ReadingMaterial>(
    `/api/v1/admin/reading/materials/${id}`,
    { signal },
  )
}

export function createReadingMaterial(input: ReadingMaterialInput) {
  return apiClient.request<ReadingMaterial>('/api/v1/admin/reading/materials', {
    method: 'POST',
    body: input,
  })
}

export function updateReadingMaterial(id: string, input: ReadingMaterialInput) {
  return apiClient.request<ReadingMaterial>(
    `/api/v1/admin/reading/materials/${id}`,
    { method: 'PUT', body: input },
  )
}

export function publishReadingMaterial(id: string, revision: number) {
  return apiClient.request<ReadingMaterial>(
    `/api/v1/admin/reading/materials/${id}/publish`,
    { method: 'POST', body: { revision } },
  )
}

export type WaitlistEntry = {
  id: string
  phone: string
  email: string | null
  firstName: string | null
  lastName: string | null
  source: string | null
  status: string
  createdAt: string
  referralCode: string
  referredByCode: string | null
  referrals: number
}

export function listWaitlistEntries(signal?: AbortSignal) {
  return apiClient.request<{ entries: WaitlistEntry[]; total: number }>(
    '/api/v1/admin/waitlist',
    { signal },
  )
}

export type SuperAdminEntry = {
  email: string
  source: 'env' | 'db'
}

export function listSuperAdmins(signal?: AbortSignal) {
  return apiClient.request<{ admins: SuperAdminEntry[] }>(
    '/api/v1/admin/super-admins',
    { signal },
  )
}

export function addSuperAdmin(email: string) {
  return apiClient.request<void>('/api/v1/admin/super-admins', {
    method: 'POST',
    body: { email },
  })
}

export function removeSuperAdmin(email: string) {
  return apiClient.request<void>(
    `/api/v1/admin/super-admins/${encodeURIComponent(email)}`,
    { method: 'DELETE' },
  )
}
