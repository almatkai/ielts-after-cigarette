import { apiClient } from '@/lib/api/client'

import type { PublicListeningTest } from '@/features/listening/api'
import type { PublicReadingMaterial } from '@/features/reading/api'
import type { PublicSpeakingMaterial } from '@/features/speaking/api'
import type { PublicWritingMaterial } from '@/features/writing/api'

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
  writingEvaluation?: WritingEvaluation
  speakingEvaluation?: SpeakingEvaluation
  recordings?: SpeakingRecording[]
}

export type WritingCriterion = { band: number; feedback: string }

export type WritingEvaluation = {
  model: string
  overallBand: number
  criteria: {
    taskResponse: WritingCriterion
    coherence: WritingCriterion
    lexicalResource: WritingCriterion
    grammar: WritingCriterion
  }
  summary: string
  tasks: {
    taskId: string
    feedback: string
    strengths: string[]
    improvements: string[]
  }[]
  evaluatedAt: string
}

export type SpeakingCriterion = { band: number; feedback: string }

export type SpeakingRecording = {
  id: string
  partId: string
  originalName: string
  mimeType: string
  byteSize: number
  createdAt: string
  updatedAt: string
}

export type SpeakingEvaluation = {
  model: string
  overallBand: number
  criteria: {
    fluency: SpeakingCriterion
    lexicalResource: SpeakingCriterion
    grammar: SpeakingCriterion
    pronunciation: SpeakingCriterion
  }
  summary: string
  parts: {
    partId: string
    transcript: string
    feedback: string
    strengths: string[]
    improvements: string[]
  }[]
  evaluatedAt: string
}

export type StartListeningAttemptResponse = {
  attempt: Attempt
  test: PublicListeningTest
}

export type StartReadingAttemptResponse = {
  attempt: Attempt
  material: PublicReadingMaterial
}

export type StartWritingAttemptResponse = {
  attempt: Attempt
  material: PublicWritingMaterial
}

export type StartSpeakingAttemptResponse = {
  attempt: Attempt
  material: PublicSpeakingMaterial
}

export type AttemptListItem = Omit<Attempt, 'materialType'> & {
  materialType: AttemptMaterialType
  testTitle: string
  testSlug: string
}

export type MistakeReport = {
  attempt: AttemptListItem
  review?: AttemptReviewItem[]
  writingEvaluation?: WritingEvaluation
  speakingEvaluation?: SpeakingEvaluation
}

export type AttemptMaterialType =
  'listening' | 'reading' | 'writing' | 'speaking'

export const attemptKeys = {
  detail: (id: string) => ['attempts', id] as const,
  list: (materialType: AttemptMaterialType) =>
    ['attempts', 'list', materialType] as const,
  listAll: ['attempts', 'list'] as const,
  mistakes: ['attempts', 'mistakes'] as const,
}

export const listAttempts = (
  materialType?: AttemptMaterialType,
  signal?: AbortSignal,
) =>
  apiClient.request<{ items: AttemptListItem[] }>(
    materialType ? `/api/v1/attempts?materialType=${materialType}` : '/api/v1/attempts',
    { signal },
  )

export const getMistakes = (signal?: AbortSignal) =>
  apiClient.request<{ items: MistakeReport[] }>('/api/v1/attempts/mistakes', {
    signal,
  })

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
export const startWritingAttempt = (materialId: string, signal?: AbortSignal) =>
  apiClient.request<StartWritingAttemptResponse>(
    `/api/v1/writing/materials/${materialId}/attempts`,
    { method: 'POST', signal },
  )
export const startSpeakingAttempt = (
  materialId: string,
  signal?: AbortSignal,
) =>
  apiClient.request<StartSpeakingAttemptResponse>(
    `/api/v1/speaking/materials/${materialId}/attempts`,
    { method: 'POST', signal },
  )
export const uploadSpeakingRecording = (
  attemptId: string,
  partId: string,
  recording: File,
) => {
  const form = new FormData()
  form.append('partId', partId)
  form.append('recording', recording)
  return apiClient.upload<SpeakingRecording>(
    `/api/v1/attempts/${attemptId}/recordings`,
    form,
  )
}
export const getSpeakingRecordingBlob = (attemptId: string, partId: string) =>
  apiClient.blob(`/api/v1/attempts/${attemptId}/recordings/${partId}`)
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
