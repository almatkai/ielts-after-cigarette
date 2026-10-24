import { apiClient } from '@/lib/api/client'
import type { LearningDrill } from './learning-api'

export type EditorialStatus = 'draft' | 'reviewed' | 'withdrawn'
export type EditorialDecision = {
  version: string
  contentHash: string
  familyId: string
  status: EditorialStatus
  expectedRevision: number
  reviewNotes: string
  keysChecked: boolean
  familyChecked: boolean
  sourceChecked: boolean
}
export type EditorialMetadata = {
  kind: string
  referenceId: string
  version: string
  section: string
  familyId: string
  status: EditorialStatus
  contentHash: string
  revision: number
  reviewNotes: string
  reviewerId: string
  reviewedAt: string
}
export type EditorialCandidate = {
  kind: 'drill' | 'material'
  id: string
  version: string
  section: string
  title: string
  contentHash: string
  drill: LearningDrill | null
  answerKey: unknown
  explanation: string
  metadata: EditorialMetadata | null
}
export type EditorialEvent = {
  revision: number
  decision: EditorialDecision
  reviewerId: string
  createdAt: string
}
const root = '/api/v1/admin/study-learning/content'
const path = (item: EditorialCandidate) =>
  `${root}/${item.kind}/${encodeURIComponent(item.id)}`
export const listEditorialContent = (signal?: AbortSignal) =>
  apiClient.request<{ items: EditorialCandidate[]; limitations: string[] }>(
    root,
    { signal },
  )
export const editorialHistory = (
  item: EditorialCandidate,
  signal?: AbortSignal,
) =>
  apiClient.request<{ items: EditorialEvent[] }>(
    `${path(item)}/history?version=${encodeURIComponent(item.version)}`,
    { signal },
  )
export const reviewEditorialContent = (
  item: EditorialCandidate,
  decision: EditorialDecision,
) =>
  apiClient.request<{
    revision: number
    status: EditorialStatus
    familyId: string
    contentHash: string
  }>(path(item), { method: 'PUT', body: decision })
