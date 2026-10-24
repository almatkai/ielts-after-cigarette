import { ApiError, apiClient } from '@/lib/api/client'
import type { SkillId } from '@/features/ielts/api'

export type StudySettings = {
  dailyMinutes: number
  studyDays: number[]
  weeklyMockEnabled: boolean
}
export type StudyAssignment = {
  id: string
  kind: 'PRACTICE' | 'REVIEW' | 'CHECKPOINT' | 'REENTRY' | 'DRILL'
  skill: SkillId
  title: string
  reason: string
  durationMinutes: number
  status:
    | 'PLANNED'
    | 'IN_PROGRESS'
    | 'AWAITING_RESULT'
    | 'COMPLETED'
    | 'SKIPPED'
    | 'MISSED'
    | 'BLOCKED'
  drillId?: string | null
  cycleId?: string | null
  sessionId?: string | null
  materialId: string | null
  attemptId: string | null
  sourceAttemptId: string | null
  target: string
  skipReason: string | null
  completedAt: string | null
}
export type StudyDay = {
  date: string
  dayIndex: number
  week: number
  budgetMinutes: number
  plannedMinutes: number
  readOnlyReason?: string | null
  isRest: boolean
  preliminary: boolean
  assignments: StudyAssignment[]
}
export type StudyWeek = {
  week: number
  startDate: string
  endDate: string
  goal: string
  preliminary: boolean
  mockOffer: {
    status: 'AVAILABLE' | 'SCHEDULED' | 'DECLINED' | 'DISABLED'
    durationMinutes: number
    scheduledDate: string | null
    windowMinutes: number | null
    target: string
  }
}
export type StudyEvidence = {
  skill: SkillId
  band: number | null
  practiceBand: number | null
  status: string
  attemptId: string | null
  assessedAt: string | null
  sampleCount: number
  score: number | null
  maxScore: number | null
  source: string
  limitations: string[]
}
export type StudyResponse = {
  today: string
  timezone: string
  settings: StudySettings
  goal: {
    targetBand: number | null
    examDate: string | null
    examType: string | null
  }
  plan: null | {
    id: string
    revision: number
    startDate: string
    endDate: string
    days: StudyDay[]
    weeks: StudyWeek[]
    changes: { type: string; description: string; date: string | null }[]
    returnAfterPause: boolean
  }
  recommendations: {
    id: string
    skill: SkillId
    title: string
    reason: string
    attemptId: string | null
    target: string
  }[]
  evidence: StudyEvidence[]
  overallBand: number | null
  progress: {
    date: string
    completedAttempts: number
    drillsCompleted?: number
    correctionsSaved?: number
    independentChecksPassed?: number
    reviewedAssignments: number
    skippedAssignments: number
    plannedMinutes: number
    activeMinutes: number | null
  }[]
  limitations: string[]
}
export type SkipReason = 'no_time' | 'unsuitable' | 'outside_app' | 'other'
export type StartResult = {
  attemptId: string | null
  target: string
  planRevision: number
}
export const studyPlanKeys = {
  all: ['study-plan'] as const,
  current: (userId?: string) => ['study-plan', userId ?? 'signed-out'] as const,
}
const root = '/api/v1/study-plan'
export async function getStudyPlan(signal?: AbortSignal) {
  const response = await apiClient.request<Partial<StudyResponse>>(root, {
    signal,
  })
  if (
    !response.today ||
    !response.timezone ||
    !Array.isArray(response.evidence) ||
    !Array.isArray(response.progress) ||
    !response.settings ||
    !('plan' in response)
  ) {
    throw new ApiError(502, {
      message: 'Ответ плана не соответствует контракту. Повторите загрузку.',
    })
  }
  return response as StudyResponse
}
export const createStudyPlan = (settings: StudySettings) =>
  apiClient.request<StudyResponse>(root, { method: 'POST', body: settings })
export const updateStudySettings = (
  settings: StudySettings,
  expectedRevision: number,
) =>
  apiClient.request<StudyResponse>(`${root}/settings`, {
    method: 'PUT',
    body: { ...settings, expectedRevision },
  })
export const replanStudy = (expectedRevision: number) =>
  apiClient.request<StudyResponse>(`${root}/replan`, {
    method: 'POST',
    body: { expectedRevision },
  })
export const startAssignment = (id: string, expectedRevision: number) =>
  apiClient.request<StartResult>(
    `${root}/assignments/${encodeURIComponent(id)}/start`,
    { method: 'POST', body: { expectedRevision } },
  )
export const skipAssignment = (
  id: string,
  reason: SkipReason,
  expectedRevision: number,
) =>
  apiClient.request<StudyResponse>(
    `${root}/assignments/${encodeURIComponent(id)}/skip`,
    { method: 'POST', body: { expectedRevision, reason } },
  )
export const acknowledgeReview = (id: string, expectedRevision: number) =>
  apiClient.request<StudyResponse>(
    `${root}/assignments/${encodeURIComponent(id)}/review`,
    { method: 'POST', body: { expectedRevision } },
  )
export const setWeeklyMock = (
  week: number,
  input: {
    expectedRevision: number
    action: 'schedule' | 'decline'
    scheduledDate?: string
    windowMinutes?: number
  },
) =>
  apiClient.request<StudyResponse>(`${root}/weeks/${week}/mock`, {
    method: 'POST',
    body: input,
  })
