import { createFileRoute } from '@tanstack/react-router'

import { FullMockEditorPage } from '@/pages/admin/fullmock/full-mock-editor-page'

export const Route = createFileRoute('/admin/full-mocks/new')({
  component: FullMockEditorPage,
})
