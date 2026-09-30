import { createFileRoute } from '@tanstack/react-router'

import { AttemptReviewPage } from '@/pages/attempts/attempt-review-page'

export const Route = createFileRoute('/_app/attempts/$attemptId')({
  component: AttemptReviewRoute,
})
function AttemptReviewRoute() {
  const { attemptId } = Route.useParams()
  return <AttemptReviewPage attemptId={attemptId} />
}
