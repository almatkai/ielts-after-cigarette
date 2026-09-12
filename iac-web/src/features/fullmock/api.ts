import { apiClient } from '@/lib/api/client'

import type { Attempt } from '@/features/attempts/api'

export type FullMockTest = {
  id: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  revision: number
  examType: 'academic' | 'general'
  title: string
  description: string
  durationMinutes: number
  listeningMaterialId: string
  readingMaterialId: string
  writingMaterialId: string
  speakingMaterialId: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type FullMockInput = Omit<
  FullMockTest,
  'id' | 'status' | 'revision' | 'publishedAt' | 'createdAt' | 'updatedAt'
> & { revision?: number }

export type FullMockSession = {
  id: string
  mockTestId: string
  status: 'IN_PROGRESS' | 'SUBMITTED'
  currentSection: number
  startedAt: string
  submittedAt: string | null
  deadlineAt: string
  mockTest: FullMockTest
  sections: { position: number; skill: FullMockSkill; attempt: Attempt }[]
  overallBand: number | null
}

export type FullMockSkill = 'listening' | 'reading' | 'writing' | 'speaking'

export const fullMockKeys = {
  publicTests: ['full-mocks'] as const,
  publicTest: (id: string) => ['full-mocks', id] as const,
  session: (id: string) => ['full-mock-sessions', id] as const,
  adminTests: ['admin', 'full-mocks'] as const,
  adminTest: (id: string) => ['admin', 'full-mocks', id] as const,
}

export const listPublicFullMocks = (signal?: AbortSignal) =>
  apiClient.request<{ items: FullMockTest[] }>('/api/v1/full-mocks', { signal })

export const getPublicFullMock = (id: string, signal?: AbortSignal) =>
  apiClient.request<FullMockTest>(`/api/v1/full-mocks/${id}`, { signal })

export const startFullMockSession = (id: string) =>
  apiClient.request<FullMockSession>(`/api/v1/full-mocks/${id}/sessions`, {
    method: 'POST',
  })

export const getFullMockSession = (id: string, signal?: AbortSignal) =>
  apiClient.request<FullMockSession>(`/api/v1/full-mock-sessions/${id}`, {
    signal,
  })

export const advanceFullMockSession = (id: string) =>
  apiClient.request<FullMockSession>(
    `/api/v1/full-mock-sessions/${id}/advance`,
    {
      method: 'POST',
    },
  )

export const listFullMocks = (signal?: AbortSignal) =>
  apiClient.request<{ items: FullMockTest[] }>('/api/v1/admin/full-mocks', {
    signal,
  })

export const getFullMock = (id: string, signal?: AbortSignal) =>
  apiClient.request<FullMockTest>(`/api/v1/admin/full-mocks/${id}`, { signal })

export const createFullMock = (input: FullMockInput) =>
  apiClient.request<FullMockTest>('/api/v1/admin/full-mocks', {
    method: 'POST',
    body: input,
  })

export const updateFullMock = (id: string, input: FullMockInput) =>
  apiClient.request<FullMockTest>(`/api/v1/admin/full-mocks/${id}`, {
    method: 'PUT',
    body: input,
  })

export const publishFullMock = (id: string, revision: number) =>
  apiClient.request<FullMockTest>(`/api/v1/admin/full-mocks/${id}/publish`, {
    method: 'POST',
    body: { revision },
  })
