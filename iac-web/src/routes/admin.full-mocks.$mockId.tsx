import { createFileRoute } from '@tanstack/react-router'

import { FullMockEditorPage } from '@/pages/admin/fullmock/full-mock-editor-page'

export const Route = createFileRoute('/admin/full-mocks/$mockId')({
  component: FullMockEditRoute,
})

function FullMockEditRoute() {
  const { mockId } = Route.useParams()
  return <FullMockEditorPage mockId={mockId} />
}
