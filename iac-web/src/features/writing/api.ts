import { apiClient } from '@/lib/api/client'

export type WritingTask = {
  id: string
  position: number
  type: 'task1' | 'task2'
  prompt: string
  minimumWords: number
  visualType?:
    | 'bar_chart'
    | 'line_graph'
    | 'pie_chart'
    | 'table'
    | 'diagram'
    | 'process'
    | 'map'
    | 'mixed'
  visualUrl?: string
  visualAssetId?: string
  essayType?:
    | 'opinion'
    | 'discussion'
    | 'advantages_disadvantages'
    | 'problem_solution'
    | 'two_part'
  letterTone?: 'formal' | 'semi-formal' | 'informal'
}

export type PublicWritingMaterial = {
  id: string
  slug: string
  examType: 'academic' | 'general'
  difficulty: 'foundation' | 'intermediate' | 'advanced'
  title: string
  description: string
  durationMinutes: number
  tasks: WritingTask[]
}

export type PublicWritingMaterialListItem = Omit<
  PublicWritingMaterial,
  'tasks'
> & {
  publishedAt: string | null
}

export type WritingTaskInput = Omit<WritingTask, 'id'> & {
  id?: string
  assessmentNotes?: string
}

export type WritingMaterial = Omit<PublicWritingMaterial, 'tasks'> & {
  tasks: WritingTaskInput[]
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  revision: number
  currentVersionNumber: number
  publishedVersionId: string | null
  hasUnpublishedChanges: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type WritingMaterialInput = Omit<
  WritingMaterial,
  | 'id'
  | 'status'
  | 'revision'
  | 'currentVersionNumber'
  | 'publishedVersionId'
  | 'hasUnpublishedChanges'
  | 'publishedAt'
  | 'createdAt'
  | 'updatedAt'
  | 'tasks'
> & {
  tasks: WritingTaskInput[]
  revision?: number
}

export type WritingImportResult = {
  materials: WritingMaterialInput[]
  errors: { code: string; message: string; item?: number }[]
}

export type WritingMedia = {
  id: string
  kind: 'image'
  originalName: string
  mimeType: string
  byteSize: number
  createdAt: string
}

export const writingKeys = {
  publicMaterials: ['writing', 'materials'] as const,
  publicMaterial: (id: string) => ['writing', 'materials', id] as const,
  adminMaterials: ['admin', 'writing', 'materials'] as const,
  adminMaterial: (id: string) => ['admin', 'writing', 'materials', id] as const,
}

export function listPublicWritingMaterials(signal?: AbortSignal) {
  return apiClient.request<{ items: PublicWritingMaterialListItem[] }>(
    '/api/v1/writing/materials',
    { signal },
  )
}

export function getPublicWritingMaterial(id: string, signal?: AbortSignal) {
  return apiClient.request<PublicWritingMaterial>(
    `/api/v1/writing/materials/${id}`,
    { signal },
  )
}

export function listWritingMaterials(signal?: AbortSignal) {
  return apiClient.request<{ items: WritingMaterial[] }>(
    '/api/v1/admin/writing/materials',
    { signal },
  )
}

export function getWritingMaterial(id: string, signal?: AbortSignal) {
  return apiClient.request<WritingMaterial>(
    `/api/v1/admin/writing/materials/${id}`,
    { signal },
  )
}

export function createWritingMaterial(input: WritingMaterialInput) {
  return apiClient.request<WritingMaterial>('/api/v1/admin/writing/materials', {
    method: 'POST',
    body: input,
  })
}

export function updateWritingMaterial(id: string, input: WritingMaterialInput) {
  return apiClient.request<WritingMaterial>(
    `/api/v1/admin/writing/materials/${id}`,
    { method: 'PUT', body: input },
  )
}

export function publishWritingMaterial(id: string, revision: number) {
  return apiClient.request<WritingMaterial>(
    `/api/v1/admin/writing/materials/${id}/publish`,
    { method: 'POST', body: { revision } },
  )
}

export function archiveWritingMaterial(id: string, revision: number) {
  return apiClient.request<WritingMaterial>(
    `/api/v1/admin/writing/materials/${id}/archive`,
    { method: 'POST', body: { revision } },
  )
}

export function parseWritingImport(source: string) {
  return apiClient.request<WritingImportResult>(
    '/api/v1/admin/writing/import/parse',
    { method: 'POST', body: { source } },
  )
}

export function confirmWritingImport(materials: WritingMaterialInput[]) {
  return apiClient.request<{ items: WritingMaterial[] }>(
    '/api/v1/admin/writing/import',
    { method: 'POST', body: { materials } },
  )
}

export function uploadWritingMedia(file: File) {
  const form = new FormData()
  form.set('file', file)
  return apiClient.upload<WritingMedia>('/api/v1/admin/writing/media', form)
}

export function getWritingMediaBlob(id: string) {
  return apiClient.blob(`/api/v1/writing/media/${id}`)
}
