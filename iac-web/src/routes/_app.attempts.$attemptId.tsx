import { createFileRoute } from '@tanstack/react-router'

import { AttemptReviewPage } from '@/pages/attempts/attempt-review-page'
import { FullMockAttemptReview } from '@/pages/fullmock/full-mock-attempt-review'

export const Route = createFileRoute('/_app/attempts/$attemptId')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { session?: string; studyReview?: string } => ({
    studyReview:
      typeof search.studyReview === 'string' && search.studyReview.length <= 128
        ? search.studyReview || undefined
        : undefined,
    session:
      typeof search.session === 'string' && search.session.length <= 128
        ? search.session || undefined
        : undefined,
  }),
  component: AttemptReviewRoute,
})
function AttemptReviewRoute() {
  const { attemptId } = Route.useParams()
  const { session, studyReview } = Route.useSearch()
  return session ? (
    <FullMockAttemptReview attemptId={attemptId} sessionId={session} />
  ) : (
    <AttemptReviewPage
      key={attemptId}
      attemptId={attemptId}
      studyReview={studyReview}
    />
  )
}
