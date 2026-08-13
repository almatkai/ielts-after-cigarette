import { apiClient } from '@/lib/api/client'

export const listeningQuestionTypes = [
  'multiple_choice',
  'matching',
  'map_labelling',
  'plan_labelling',
  'diagram_labelling',
  'form_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'sentence_completion',
  'short_answer',
] as const

export type ListeningQuestionType = (typeof listeningQuestionTypes)[number]
export type ListeningQuestion = {
  id?: string
  position: number
  number: number
  prompt: string
  content: Record<string, unknown>
  answer: Record<string, unknown>
  explanation: string
  points: number
}
export type ListeningGroup = {
  id?: string
  position: number
  type: ListeningQuestionType
  instructions: string
  context: string
  config: Record<string, unknown>
  imageAssetId: string | null
  questions: ListeningQuestion[]
}
export type ListeningPart = {
  id?: string
  position: number
  title: string
  audioAssetId: string | null
  groups: ListeningGroup[]
}
export type ListeningTestInput = {
  slug: string
  examType: 'academic' | 'general'
  title: string
  description: string
  durationMinutes: number
  parts: ListeningPart[]
  revision?: number
}
export type ListeningTest = ListeningTestInput & {
  id: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  revision: number
  currentVersionNumber: number
  hasUnpublishedChanges: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}
export type ListeningMedia = {
  id: string
  kind: 'audio' | 'image'
  originalName: string
  mimeType: string
  byteSize: number
  createdAt: string
}
export type ListeningImportIssue = {
  code: string
  message: string
  line?: number
  part?: number
  questionNumber?: number
}
export type ListeningImportResult = {
  formatVersion: string
  test: ListeningTestInput
  errors: ListeningImportIssue[]
  warnings: ListeningImportIssue[]
  info: ListeningImportIssue[]
}

export type PublicListeningQuestion = Omit<
  ListeningQuestion,
  'answer' | 'explanation'
>
export type PublicListeningGroup = Omit<ListeningGroup, 'questions'> & {
  questions: PublicListeningQuestion[]
}
export type PublicListeningPart = Omit<ListeningPart, 'groups'> & {
  groups: PublicListeningGroup[]
}
export type PublicListeningTest = Pick<
  ListeningTest,
  'id' | 'slug' | 'examType' | 'title' | 'description' | 'durationMinutes'
> & { parts: PublicListeningPart[] }

export const listeningKeys = {
  adminTests: ['admin', 'listening', 'tests'] as const,
  adminTest: (id: string) => ['admin', 'listening', 'tests', id] as const,
  publicTests: ['listening', 'tests'] as const,
  publicTest: (id: string) => ['listening', 'tests', id] as const,
}

export const listAdminListeningTests = (signal?: AbortSignal) =>
  apiClient.request<{ items: ListeningTest[] }>(
    '/api/v1/admin/listening/tests',
    {
      signal,
    },
  )
export const getAdminListeningTest = (id: string, signal?: AbortSignal) =>
  apiClient.request<ListeningTest>(`/api/v1/admin/listening/tests/${id}`, {
    signal,
  })
export const createListeningTest = (input: ListeningTestInput) =>
  apiClient.request<ListeningTest>('/api/v1/admin/listening/tests', {
    method: 'POST',
    body: input,
  })
export const updateListeningTest = (id: string, input: ListeningTestInput) =>
  apiClient.request<ListeningTest>(`/api/v1/admin/listening/tests/${id}`, {
    method: 'PUT',
    body: input,
  })
export const publishListeningTest = (id: string, revision: number) =>
  apiClient.request<ListeningTest>(
    `/api/v1/admin/listening/tests/${id}/publish`,
    { method: 'POST', body: { revision } },
  )
export const parseListeningImport = (source: string, examType: string) =>
  apiClient.request<ListeningImportResult>(
    '/api/v1/admin/listening/import/parse',
    {
      method: 'POST',
      body: { source, examType },
    },
  )
export const importListeningTest = (input: ListeningTestInput) =>
  apiClient.request<ListeningTest>('/api/v1/admin/listening/import', {
    method: 'POST',
    body: input,
  })
export const uploadListeningMedia = (kind: 'audio' | 'image', file: File) => {
  const form = new FormData()
  form.set('kind', kind)
  form.set('file', file)
  return apiClient.upload<ListeningMedia>('/api/v1/admin/listening/media', form)
}
export const getListeningMediaBlob = (id: string) =>
  apiClient.blob(`/api/v1/listening/media/${id}`)
export const listPublicListeningTests = (signal?: AbortSignal) =>
  apiClient.request<{ items: PublicListeningTest[] }>(
    '/api/v1/listening/tests',
    {
      signal,
    },
  )
export const getPublicListeningTest = (id: string, signal?: AbortSignal) =>
  apiClient.request<PublicListeningTest>(`/api/v1/listening/tests/${id}`, {
    signal,
  })
