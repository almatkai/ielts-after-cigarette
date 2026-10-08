import { apiClient } from '@/lib/api/client'
import type { PublicReadingMaterial } from '@/features/reading/api'
import type { PublicListeningTest } from '@/features/listening/api'

export type PreviewVersion = 'draft' | 'published'
export type PreviewAnswerKey = {
  answer: Record<string, unknown> | null
  explanation: string
  quote: string
  hint: string
}
export type PreviewAnswerKeys = Record<string, PreviewAnswerKey>
export type TestPreview<T> = {
  material: T
  answerKeys: PreviewAnswerKeys
  versionNumber: number
  revision: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  hasUnpublishedChanges: boolean
}

export const getReadingPreview = (
  id: string,
  version: PreviewVersion,
  signal?: AbortSignal,
) =>
  apiClient.request<TestPreview<PublicReadingMaterial>>(
    `/api/v1/admin/reading/materials/${id}/preview?version=${version}`,
    { signal },
  )

export const getListeningPreview = (
  id: string,
  version: PreviewVersion,
  signal?: AbortSignal,
) =>
  apiClient.request<TestPreview<PublicListeningTest>>(
    `/api/v1/admin/listening/tests/${id}/preview?version=${version}`,
    { signal },
  )
