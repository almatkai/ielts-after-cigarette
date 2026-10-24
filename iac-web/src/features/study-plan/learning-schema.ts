import { z } from 'zod'

const section = z.enum(['reading', 'listening', 'writing', 'speaking'])
const status = z.enum([
  'insufficient',
  'needs-practice',
  'correction-saved',
  'awaiting-transfer',
  'demonstrated',
])
const verdict = z.enum(['correct', 'incorrect', 'unverified'])
const strings = z.array(z.string())
const provenance = z.object({
  model: z.string().nullable(),
  promptVersion: z.string().nullable(),
  rubricVersion: z.string().nullable(),
})
const source = z.object({
  audioUrl: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  drillId: z.string().nullable().optional(),
  attemptId: z.string(),
  questionId: z.string().nullable(),
  materialId: z.string(),
  versionId: z.string(),
  familyId: z.string().nullable(),
  familyKnown: z.boolean(),
  questionType: z.string(),
  prompt: z.string(),
  stimulus: z.string(),
  originalAnswer: z.string(),
  feedback: z.string(),
  occurredAt: z.string(),
  modality: z.enum(['objective', 'typed', 'audio', 'unknown', 'script']),
  provenance,
})
const correction = z.object({
  text: z.string(),
  explanation: z.string(),
  assisted: z.boolean(),
  savedAt: z.string(),
  verdict,
  feedback: z.string(),
})
const check = z.object({
  sessionId: z.string(),
  familyId: z.string().nullable(),
  occurredAt: z.string(),
  independent: z.boolean(),
  delayed: z.boolean(),
  passed: z.boolean(),
  reason: z.string(),
})
export const learningCycleSchema = z.object({
  id: z.string(),
  revision: z.number(),
  skillId: z.string(),
  section,
  status,
  source,
  viewedAt: z.string().nullable(),
  correction: correction.nullable(),
  checks: z.array(check),
  skippedAt: z.string().nullable(),
  nextDrillId: z.string().nullable(),
  nextCheckDate: z.string().nullable().optional(),
  remainingChecks: z.number(),
  limitations: strings,
})
export const learningDrillSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  section,
  title: z.string(),
  durationMinutes: z.number(),
  modality: z.enum(['objective', 'typed', 'audio', 'script']),
  familyId: z.string().nullable(),
  version: z.string(),
  introduction: z.string(),
  stimulus: z.string(),
  task: z.string(),
  rightsProvenance: z.string(),
  editorialStatus: z.enum(['draft', 'reviewed']),
  masteryEligible: z.boolean(),
  audioUrl: z.string().nullable().optional(),
  sourceMaterialId: z.string().nullable().optional(),
  sourceVersionId: z.string().nullable().optional(),
  sourceQuestionId: z.string().nullable().optional(),
})
const sectionInventory = z.object({
  section,
  fullMaterials: z.number(),
  fittingMaterials: z.number(),
  shortDrills: z.number(),
  reviewedDrills: z.number(),
  independentFamilies: z.number(),
  available: z.boolean(),
  limitations: strings,
})
export const learningInventorySchema = z.object({
  dailyMinutes: z.number(),
  sections: z.array(sectionInventory),
  limitations: strings,
})
const skill = z.object({ id: z.string(), section, title: z.string() })
export const taskPerformanceSchema = z.object({
  section: z.enum(['reading', 'listening']),
  questionType: z.string(),
  title: z.string(),
  answered: z.number(),
  correct: z.number(),
  incorrect: z.number(),
  sourceCount: z.number(),
  practiceAnswered: z.number(),
  sourceRefs: z.array(
    z.object({
      sourceId: z.string(),
      attemptId: z.string(),
      title: z.string(),
      occurredAt: z.string(),
      answered: z.number(),
      correct: z.number(),
      incorrect: z.number(),
    }),
  ),
  limitations: strings,
})
const profile = z.object({
  skillId: z.string(),
  section,
  status,
  sourceIds: strings,
  rationale: z.string(),
  updatedAt: z.string().nullable(),
  independentFamilies: z.number(),
  delayedCheckPassed: z.boolean(),
  remainingChecks: z.number(),
})
export const learningSchema = z.object({
  revision: z.number(),
  today: z.string(),
  examDate: z.string().nullable(),
  readOnly: z.boolean(),
  skills: z.array(skill),
  profiles: z.array(profile),
  cycles: z.array(learningCycleSchema),
  drills: z.array(learningDrillSchema),
  inventory: learningInventorySchema,
  limitations: strings,
  overallBand: z.null(),
  taskPerformance: z.array(taskPerformanceSchema).optional().default([]),
})
export const learningSessionSchema = z.object({
  id: z.string(),
  revision: z.number(),
  drill: learningDrillSchema,
  cycleId: z.string().nullable(),
  assignmentId: z.string().nullable(),
  status: z.enum(['in-progress', 'submitted']),
  startedAt: z.string(),
  submittedAt: z.string().nullable(),
  text: z.string().nullable(),
  explanation: z.string().nullable(),
  assisted: z.boolean(),
  audioAttemptId: z.string().nullable(),
  verdict: verdict.nullable(),
  feedback: z.string().nullable(),
  independent: z.boolean(),
  independenceReason: z.string(),
})
