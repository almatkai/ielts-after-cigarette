import { ApiError, apiClient } from '@/lib/api/client'
import {
  learningCycleSchema,
  learningInventorySchema,
  learningSchema,
  learningSessionSchema,
} from './learning-schema'
import type { taskPerformanceSchema } from './learning-schema'
import type { z } from 'zod'
import type { SkillId } from '@/features/ielts/api'

export type WeaknessStatus =
  | 'insufficient'
  | 'needs-practice'
  | 'correction-saved'
  | 'awaiting-transfer'
  | 'demonstrated'
export type Verdict = 'incorrect' | 'correct' | 'unverified'
export type MicroSkill = { id: string; section: SkillId; title: string }
export type WeakProfile = {
  skillId: string
  section: SkillId
  status: WeaknessStatus
  sourceIds: string[]
  rationale: string
  updatedAt: string | null
  independentFamilies: number
  delayedCheckPassed: boolean
  remainingChecks: number
}
export type SourceEvidence = {
  audioUrl?: string | null
  sessionId?: string | null
  drillId?: string | null
  attemptId: string
  questionId: string | null
  materialId: string
  versionId: string
  familyId: string | null
  familyKnown: boolean
  questionType: string
  prompt: string
  stimulus: string
  originalAnswer: string
  feedback: string
  occurredAt: string
  modality: 'objective' | 'typed' | 'audio' | 'unknown' | 'script'
  provenance: {
    model: string | null
    promptVersion: string | null
    rubricVersion: string | null
  }
}
export type Correction = {
  text: string
  explanation: string
  assisted: boolean
  savedAt: string
  verdict: Verdict
  feedback: string
}
export type TransferCheck = {
  sessionId: string
  familyId: string | null
  occurredAt: string
  independent: boolean
  delayed: boolean
  passed: boolean
  reason: string
}
export type LearningCycle = {
  id: string
  revision: number
  skillId: string
  section: SkillId
  status: WeaknessStatus
  source: SourceEvidence
  viewedAt: string | null
  correction: Correction | null
  checks: TransferCheck[]
  skippedAt: string | null
  nextDrillId: string | null
  nextCheckDate?: string | null
  remainingChecks: number
  limitations: string[]
}
export type LearningDrill = {
  id: string
  skillId: string
  section: SkillId
  title: string
  durationMinutes: number
  modality: 'objective' | 'typed' | 'audio' | 'script'
  familyId: string | null
  version: string
  introduction: string
  stimulus: string
  task: string
  rightsProvenance: string
  editorialStatus: 'draft' | 'reviewed'
  masteryEligible: boolean
  audioUrl?: string | null
  sourceMaterialId?: string | null
  sourceVersionId?: string | null
  sourceQuestionId?: string | null
}
export type LearningSession = {
  id: string
  revision: number
  drill: LearningDrill
  cycleId: string | null
  assignmentId: string | null
  status: 'in-progress' | 'submitted'
  startedAt: string
  submittedAt: string | null
  text: string | null
  explanation: string | null
  assisted: boolean
  audioAttemptId: string | null
  verdict: Verdict | null
  feedback: string | null
  independent: boolean
  independenceReason: string
}
export type SectionInventory = {
  section: SkillId
  fullMaterials: number
  fittingMaterials: number
  shortDrills: number
  reviewedDrills: number
  independentFamilies: number
  available: boolean
  limitations: string[]
}
export type LearningInventory = {
  dailyMinutes: number
  sections: SectionInventory[]
  limitations: string[]
}
export type Learning = {
  revision: number
  today: string
  examDate: string | null
  readOnly: boolean
  skills: MicroSkill[]
  profiles: WeakProfile[]
  cycles: LearningCycle[]
  drills: LearningDrill[]
  inventory: LearningInventory
  limitations: string[]
  overallBand: null
  taskPerformance: TaskPerformance[]
}
export type TaskPerformance = z.infer<typeof taskPerformanceSchema>
export type TaskPerformanceSource = TaskPerformance['sourceRefs'][number]
export type LearningAnswer = {
  text: string
  explanation: string
  assisted: boolean
  audioAttemptId?: string
}
const root = '/api/v1/study-plan/learning'
const idPath = (kind: 'cycles' | 'sessions' | 'drills', id: string) =>
  `${root}/${kind}/${encodeURIComponent(id)}`
function parseResponse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success)
    throw new ApiError(502, {
      code: 'LEARNING_CONTRACT_ERROR',
      message:
        'Ответ учебного API не соответствует контракту. Повторите загрузку.',
    })
  return result.data
}
export const getLearning = async (signal?: AbortSignal): Promise<Learning> =>
  parseResponse(
    learningSchema,
    await apiClient.request<unknown>(root, { signal }),
  )
export const getLearningInventory = async (
  signal?: AbortSignal,
): Promise<LearningInventory> =>
  parseResponse(
    learningInventorySchema,
    await apiClient.request<unknown>(`${root}/inventory`, { signal }),
  )
export const getLearningCycle = async (
  id: string,
  signal?: AbortSignal,
): Promise<LearningCycle> =>
  parseResponse(
    learningCycleSchema,
    await apiClient.request<unknown>(idPath('cycles', id), { signal }),
  )
export const getLearningSession = async (
  id: string,
  signal?: AbortSignal,
): Promise<LearningSession> =>
  parseResponse(
    learningSessionSchema,
    await apiClient.request<unknown>(idPath('sessions', id), { signal }),
  )
async function postCycle(
  id: string,
  action: 'view' | 'skip' | 'correction',
  body: unknown,
): Promise<LearningCycle> {
  return parseResponse(
    learningCycleSchema,
    await apiClient.request<unknown>(`${idPath('cycles', id)}/${action}`, {
      method: 'POST',
      body,
    }),
  )
}
export const viewLearningCycle = (id: string, expectedRevision: number) =>
  postCycle(id, 'view', { expectedRevision })
export const correctLearningCycle = (
  id: string,
  expectedRevision: number,
  idempotencyKey: string,
  answer: LearningAnswer,
) =>
  postCycle(id, 'correction', { expectedRevision, idempotencyKey, ...answer })
export const skipLearningCycle = (
  id: string,
  expectedRevision: number,
  idempotencyKey: string,
) => postCycle(id, 'skip', { expectedRevision, idempotencyKey })
export const startLearningDrill = async (
  id: string,
  expectedRevision: number,
  idempotencyKey: string,
  context: { cycleId?: string; assignmentId?: string },
): Promise<LearningSession> =>
  parseResponse(
    learningSessionSchema,
    await apiClient.request<unknown>(`${idPath('drills', id)}/start`, {
      method: 'POST',
      body: { expectedRevision, idempotencyKey, ...context },
    }),
  )
export const submitLearningSession = async (
  id: string,
  expectedRevision: number,
  idempotencyKey: string,
  answer: LearningAnswer,
): Promise<LearningSession> =>
  parseResponse(
    learningSessionSchema,
    await apiClient.request<unknown>(`${idPath('sessions', id)}/submit`, {
      method: 'POST',
      body: { expectedRevision, idempotencyKey, ...answer },
    }),
  )
