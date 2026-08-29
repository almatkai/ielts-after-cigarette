import { apiClient } from '@/lib/api/client'

import type { ReadingQuestionType } from '@/features/admin/api'

export type PublicReadingQuestion = {
  id?: string
  position: number
  prompt: string
  content: Record<string, unknown>
  points: number
}

export type PublicReadingGroup = {
  id?: string
  position: number
  type: ReadingQuestionType
  instructions: string
  questions: PublicReadingQuestion[]
}

export type PublicReadingMaterial = {
  id: string
  slug: string
  examType: 'academic' | 'general'
  difficulty: 'foundation' | 'intermediate' | 'advanced'
  title: string
  description: string
  body: string
  questionGroups: PublicReadingGroup[]
}

export type PublicReadingMaterialListItem = Omit<
  PublicReadingMaterial,
  'body' | 'questionGroups'
> & {
  publishedAt: string | null
}

export const readingKeys = {
  publicMaterials: ['reading', 'materials'] as const,
  publicMaterial: (id: string) => ['reading', 'materials', id] as const,
}

export const listPublicReadingMaterials = (signal?: AbortSignal) =>
  apiClient.request<{ items: PublicReadingMaterialListItem[] }>(
    '/api/v1/reading/materials',
    { signal },
  )
export const getPublicReadingMaterial = (id: string, signal?: AbortSignal) =>
  apiClient.request<PublicReadingMaterial>(
    `/api/v1/reading/materials/${id}`,
    { signal },
  )
