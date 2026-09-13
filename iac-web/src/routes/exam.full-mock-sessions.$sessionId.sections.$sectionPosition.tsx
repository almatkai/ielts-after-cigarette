import { createFileRoute } from '@tanstack/react-router'

import { FullMockSectionPage } from '@/pages/fullmock/full-mock-section-page'

export const Route = createFileRoute(
  '/exam/full-mock-sessions/$sessionId/sections/$sectionPosition',
)({
  component: FullMockSectionRoute,
})

function FullMockSectionRoute() {
  const { sessionId, sectionPosition } = Route.useParams()
  return (
    <FullMockSectionPage
      sessionId={sessionId}
      sectionPosition={sectionPosition}
    />
  )
}
