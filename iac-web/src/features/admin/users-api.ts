import { apiClient } from '@/lib/api/client'
import type { UserRole } from '@/features/auth/auth-store'

export type AdminUser = {
  id: string
  email: string
  phone: string | null
  displayName: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  status: string
  blocked: boolean
  createdAt: string
  updatedAt: string
  source: string | null
  referralCode: string | null
  referredByCode: string | null
  termsAcceptedAt: string | null
  googleConnected: boolean
  hasPassword: boolean
  currentBand: number | null
  targetBand: number | null
  examDate: string | null
  examType: string | null
  timezone: string | null
  completedTests: number
  unfinishedTests: number
  lastActiveAt: string | null
}
export type UserDetail = AdminUser & {
  skills: {
    skill: string
    band: number | null
    accuracy: number | null
    completedTasks: number
  }[]
  activityDays: string[]
  sessions: {
    createdAt: string
    expiresAt: string
    revokedAt: string | null
    userAgent: string | null
    ipAddress: string | null
  }[]
}
export type UserAttempt = {
  id: string
  skill: string
  title: string
  status: string
  band: number | null
  score: number | null
  maxScore: number | null
  startedAt: string
  submittedAt: string | null
  fullMock: string | null
}
export type PageResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
export const usersKey = ['admin', 'users'] as const
export const userKey = (id: string) => [...usersKey, id] as const
export function listUsers(
  q: string,
  role: string,
  page: number,
  signal?: AbortSignal,
) {
  return apiClient.request<PageResult<AdminUser>>(
    `/api/v1/admin/users?${new URLSearchParams({ q, role, page: String(page) })}`,
    { signal },
  )
}
export function getUser(id: string, signal?: AbortSignal) {
  return apiClient.request<UserDetail>(`/api/v1/admin/users/${id}`, { signal })
}
export type UserUpdate = Pick<
  AdminUser,
  'displayName' | 'email' | 'role' | 'blocked'
> & { phone: string }
export function updateUser(id: string, body: UserUpdate) {
  return apiClient.request<UserDetail>(`/api/v1/admin/users/${id}`, {
    method: 'PUT',
    body,
  })
}
export function changePassword(id: string, password: string) {
  return apiClient.request<void>(`/api/v1/admin/users/${id}/password`, {
    method: 'POST',
    body: { password },
  })
}
export function revokeSessions(id: string) {
  return apiClient.request<void>(`/api/v1/admin/users/${id}/revoke-sessions`, {
    method: 'POST',
  })
}
export function deleteUser(id: string, email: string) {
  return apiClient.request<void>(`/api/v1/admin/users/${id}`, {
    method: 'DELETE',
    body: { email },
  })
}
export function listUserAttempts(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return apiClient.request<PageResult<UserAttempt>>(
    `/api/v1/admin/users/${id}/attempts?page=${page}`,
    { signal },
  )
}
export function getUserAttempt(
  id: string,
  attempt: string,
  signal?: AbortSignal,
) {
  return apiClient.request<{
    answers: unknown[]
    writing: unknown
    speaking: unknown
    attempt: unknown
  }>(`/api/v1/admin/users/${id}/attempts/${attempt}`, { signal })
}
