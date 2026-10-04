import { apiClient } from '@/lib/api/client'

import type { Attempt } from '@/features/attempts/api'
import type { PublicListeningTest } from '@/features/listening/api'
import type { PublicReadingMaterial } from '@/features/reading/api'
import type { PublicSpeakingMaterial } from '@/features/speaking/api'
import type { PublicWritingMaterial } from '@/features/writing/api'

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

export type FullMockSession = {
  id: string
  mockTestId: string
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED'
  currentSection: number
  startedAt: string
  submittedAt: string | null
  deadlineAt: string
  mockTest: FullMockTest
  sections: { position: number; skill: FullMockSkill; attempt: Attempt }[]
  overallBand: number | null
}

export type FullMockSkill = 'listening' | 'reading' | 'writing' | 'speaking'

type FullMockSectionBase = {
  position: number
  attempt: Attempt
}

export type FullMockSection =
  | (FullMockSectionBase & {
      skill: 'listening'
      material: PublicListeningTest
    })
  | (FullMockSectionBase & {
      skill: 'reading'
      material: PublicReadingMaterial
    })
  | (FullMockSectionBase & {
      skill: 'writing'
      material: PublicWritingMaterial
    })
  | (FullMockSectionBase & {
      skill: 'speaking'
      material: PublicSpeakingMaterial
    })

export type FullMockBankStatus = {
  skill: FullMockSkill
  total: number
  completed: number
  remaining: number
  isExhausted: boolean
}

export type FullMockOverview = {
  examType: 'academic' | 'general' | ''
  durationMinutes: number
  ready: boolean
  banks: FullMockBankStatus[]
  activeSession: FullMockSession | null
}

export const fullMockKeys = {
  overview: (userId: string | undefined, examType: string | null | undefined) =>
    ['full-mock-overview', userId, examType] as const,
  session: (id: string) => ['full-mock-sessions', id] as const,
  section: (sessionId: string, position: string) =>
    ['full-mock-sessions', sessionId, 'sections', position] as const,
  adminTests: ['admin', 'full-mocks'] as const,
}

export const getFullMockOverview = (signal?: AbortSignal) =>
  apiClient.request<FullMockOverview>('/api/v1/full-mocks/overview', { signal })

export const startGeneratedFullMock = (restart = false) =>
  apiClient.request<FullMockSession>('/api/v1/full-mocks/start', {
    method: 'POST',
    body: { restart },
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

export const finishFullMockSession = (id: string) =>
  apiClient.request<FullMockSession>(
    `/api/v1/full-mock-sessions/${id}/finish`,
    { method: 'POST' },
  )

export const getFullMockSection = (
  sessionId: string,
  position: string,
  signal?: AbortSignal,
) =>
  apiClient.request<FullMockSection>(
    `/api/v1/full-mock-sessions/${sessionId}/sections/${position}`,
    { signal },
  )

export const listFullMocks = (signal?: AbortSignal) =>
  apiClient.request<{ items: FullMockTest[] }>('/api/v1/admin/full-mocks', {
    signal,
  })
