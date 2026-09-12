import { apiClient } from '@/lib/api/client'

export type SpeakingPartType = 'part1' | 'part2' | 'part3'

export type SpeakingQuestion = {
  id: string
  position: number
  prompt: string
}

export type SpeakingPart = {
  id: string
  position: number
  type: SpeakingPartType
  title: string
  instructions: string
  preparationSeconds: number
  responseSeconds: number
  cueCard: string[]
  questions: SpeakingQuestion[]
}

export type PublicSpeakingMaterial = {
  id: string
  slug: string
  examType: 'academic' | 'general'
  difficulty: 'foundation' | 'intermediate' | 'advanced'
  title: string
  description: string
  parts: SpeakingPart[]
}

export type PublicSpeakingMaterialListItem = Omit<
  PublicSpeakingMaterial,
  'parts'
> & { publishedAt: string | null }

export type SpeakingMaterial = PublicSpeakingMaterial & {
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  revision: number
  currentVersionNumber: number
  publishedVersionId: string | null
  hasUnpublishedChanges: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SpeakingQuestionInput = Omit<SpeakingQuestion, 'id'> & {
  id?: string
}

export type SpeakingPartInput = Omit<SpeakingPart, 'id' | 'questions'> & {
  id?: string
  questions: SpeakingQuestionInput[]
}

export type SpeakingMaterialInput = Omit<
  SpeakingMaterial,
  | 'id'
  | 'status'
  | 'revision'
  | 'currentVersionNumber'
  | 'publishedVersionId'
  | 'hasUnpublishedChanges'
  | 'publishedAt'
  | 'createdAt'
  | 'updatedAt'
  | 'parts'
> & {
  parts: SpeakingPartInput[]
  revision?: number
}

export const speakingKeys = {
  publicMaterials: ['speaking', 'materials'] as const,
  publicMaterial: (id: string) => ['speaking', 'materials', id] as const,
  adminMaterials: ['admin', 'speaking', 'materials'] as const,
  adminMaterial: (id: string) =>
    ['admin', 'speaking', 'materials', id] as const,
}

export function listPublicSpeakingMaterials(signal?: AbortSignal) {
  return apiClient.request<{ items: PublicSpeakingMaterialListItem[] }>(
    '/api/v1/speaking/materials',
    { signal },
  )
}

export function getPublicSpeakingMaterial(id: string, signal?: AbortSignal) {
  return apiClient.request<PublicSpeakingMaterial>(
    `/api/v1/speaking/materials/${id}`,
    { signal },
  )
}

export function listSpeakingMaterials(signal?: AbortSignal) {
  return apiClient.request<{ items: SpeakingMaterial[] }>(
    '/api/v1/admin/speaking/materials',
    { signal },
  )
}

export function getSpeakingMaterial(id: string, signal?: AbortSignal) {
  return apiClient.request<SpeakingMaterial>(
    `/api/v1/admin/speaking/materials/${id}`,
    { signal },
  )
}

export function createSpeakingMaterial(input: SpeakingMaterialInput) {
  return apiClient.request<SpeakingMaterial>(
    '/api/v1/admin/speaking/materials',
    {
      method: 'POST',
      body: input,
    },
  )
}

export function updateSpeakingMaterial(
  id: string,
  input: SpeakingMaterialInput,
) {
  return apiClient.request<SpeakingMaterial>(
    `/api/v1/admin/speaking/materials/${id}`,
    { method: 'PUT', body: input },
  )
}

export function publishSpeakingMaterial(id: string, revision: number) {
  return apiClient.request<SpeakingMaterial>(
    `/api/v1/admin/speaking/materials/${id}/publish`,
    { method: 'POST', body: { revision } },
  )
}
