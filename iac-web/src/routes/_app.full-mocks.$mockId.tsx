import { createFileRoute } from '@tanstack/react-router'

import { FullMockStartPage } from '@/pages/fullmock/full-mock-start-page'

export const Route = createFileRoute('/dashboard/full-mocks/$mockId')({
  component: MockStartRoute,
})

function MockStartRoute() {
  const { mockId } = Route.useParams()
  return <FullMockStartPage mockId={mockId} />
}
