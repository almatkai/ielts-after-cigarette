import { createFileRoute } from '@tanstack/react-router'

import { FullMockSessionPage } from '@/pages/fullmock/full-mock-session-page'

export const Route = createFileRoute(
  '/dashboard/full-mock-sessions/$sessionId',
)({ component: MockSessionRoute })

function MockSessionRoute() {
  const { sessionId } = Route.useParams()
  return <FullMockSessionPage sessionId={sessionId} />
}
