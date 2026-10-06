import type { AttemptMaterialType } from '@/features/attempts/api'

// Single source of truth for where a practice attempt lives and which
// start-attempt query backs its page. The drafts banner and the exam pages
// both read these definitions, so routes and cache keys cannot drift apart.
export type ExamAttemptLink =
  | { to: '/exam/listening/$testId'; params: { testId: string } }
  | { to: '/exam/reading/$materialId'; params: { materialId: string } }
  | { to: '/exam/writing/$materialId'; params: { materialId: string } }
  | { to: '/exam/speaking/$materialId'; params: { materialId: string } }

export function examAttemptLink(
  materialType: AttemptMaterialType,
  materialId: string,
): ExamAttemptLink {
  switch (materialType) {
    case 'listening':
      return { to: '/exam/listening/$testId', params: { testId: materialId } }
    case 'reading':
      return { to: '/exam/reading/$materialId', params: { materialId } }
    case 'writing':
      return { to: '/exam/writing/$materialId', params: { materialId } }
    case 'speaking':
      return { to: '/exam/speaking/$materialId', params: { materialId } }
  }
}

export function attemptStartQueryKey(
  materialType: AttemptMaterialType,
  materialId: string,
): readonly unknown[] {
  if (materialType === 'listening') {
    return ['listening', 'tests', materialId, 'attempt'] as const
  }
  return [materialType, 'materials', materialId, 'attempt'] as const
}
