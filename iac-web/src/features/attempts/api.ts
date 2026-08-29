import { apiClient } from '@/lib/api/client'

import type { PublicListeningTest } from '@/features/listening/api'
import type { PublicReadingMaterial } from '@/features/reading/api'

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED'

// Форматы ответа студента: {"optionId": "A"}, {"optionIds": ["A", "C"]}
// или {"value": "текст"} для completion/short answer.
export type StudentAnswer = Record<string, unknown>

export type Attempt = {
  id: string
  materialType: string
  materialId: string
  materialVersionId: string
  status: AttemptStatus
  score: number | null
  maxScore: number | null
  band: number | null
  startedAt: string
  submittedAt: string | null
}

export type AttemptAnswer = {
  questionId: string
  answer: StudentAnswer
}

export type AttemptReviewItem = {
  questionId: string
  number: number
  prompt: string
  answer: StudentAnswer | null
  isCorrect: boolean
  pointsAwarded: number
  correctAnswer: StudentAnswer
  explanation: string
}

// IN_PROGRESS — только сохранённые ответы, SUBMITTED — полный разбор.
export type AttemptDetail = Attempt & {
  answers?: AttemptAnswer[]
  review?: AttemptReviewItem[]
}

export type StartListeningAttemptResponse = {
  attempt: Attempt
  test: PublicListeningTest
}

export type StartReadingAttemptResponse = {
  attempt: Attempt
  material: PublicReadingMaterial
}

export type AttemptListItem = Omit<Attempt, 'materialType'> & {
  materialType: AttemptMaterialType
  testTitle: string
  testSlug: string
}

export type AttemptMaterialType = 'listening' | 'reading'

export const attemptKeys = {
  detail: (id: string) => ['attempts', id] as const,
  list: (materialType: AttemptMaterialType) =>
    ['attempts', 'list', materialType] as const,
}

export const listAttempts = (
  materialType: AttemptMaterialType,
  signal?: AbortSignal,
) =>
  apiClient.request<{ items: AttemptListItem[] }>(
    `/api/v1/attempts?materialType=${materialType}`,
    { signal },
  )

export const startListeningAttempt = (testId: string, signal?: AbortSignal) =>
  apiClient.request<StartListeningAttemptResponse>(
    `/api/v1/listening/tests/${testId}/attempts`,
    { method: 'POST', signal },
  )
export const startReadingAttempt = (materialId: string, signal?: AbortSignal) =>
  apiClient.request<StartReadingAttemptResponse>(
    `/api/v1/reading/materials/${materialId}/attempts`,
    { method: 'POST', signal },
  )
export const saveAttemptAnswers = (
  attemptId: string,
  answers: AttemptAnswer[],
) =>
  apiClient.request<{ saved: number }>(
    `/api/v1/attempts/${attemptId}/answers`,
    {
      method: 'PUT',
      body: { answers },
    },
  )
export const submitAttempt = (attemptId: string, answers: AttemptAnswer[]) =>
  apiClient.request<Attempt>(`/api/v1/attempts/${attemptId}/submit`, {
    method: 'POST',
    body: { answers },
  })
export const getAttempt = (attemptId: string, signal?: AbortSignal) =>
  apiClient.request<AttemptDetail>(`/api/v1/attempts/${attemptId}`, { signal })
