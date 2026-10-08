import { createFileRoute } from '@tanstack/react-router'

import { AttemptReviewPage } from '@/pages/attempts/attempt-review-page'
import { FullMockAttemptReview } from '@/pages/fullmock/full-mock-attempt-review'

export const Route = createFileRoute('/_app/attempts/$attemptId')({
  validateSearch: (search: Record<string, unknown>): { session?: string } => ({
    session:
      typeof search.session === 'string' && search.session.length <= 128
        ? search.session || undefined
        : undefined,
  }),
  component: AttemptReviewRoute,
})
function AttemptReviewRoute() {
  const { attemptId } = Route.useParams()
  const { session } = Route.useSearch()
  return session ? (
    <FullMockAttemptReview attemptId={attemptId} sessionId={session} />
  ) : (
    <AttemptReviewPage key={attemptId} attemptId={attemptId} />
  )
}
