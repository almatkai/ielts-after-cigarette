import type { QueryClient } from '@tanstack/react-query'
import type { StudyView } from './api'

export const studyPlanKeys = {
  all: ['study-plan'] as const,
  user: (userId?: string) => ['study-plan', userId ?? 'signed-out'] as const,
  current: (userId?: string) =>
    [...studyPlanKeys.user(userId), 'full'] as const,
  scope: (
    userId: string | undefined,
    view: StudyView,
    date?: string,
    details = false,
  ) =>
    [
      ...studyPlanKeys.user(userId),
      view,
      date ?? 'server-today',
      details,
    ] as const,
}

// All writers cancel old projections before marking every scope stale.
export async function invalidateStudyPlan(
  client: QueryClient,
  userId?: string,
) {
  const queryKey = userId ? studyPlanKeys.user(userId) : studyPlanKeys.all
  await client.cancelQueries({ queryKey })
  await client.invalidateQueries({ queryKey })
}
