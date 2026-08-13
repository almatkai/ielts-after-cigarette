import { createFileRoute } from '@tanstack/react-router'

import { ListeningTestEditorPage } from '@/pages/admin/listening/listening-test-editor-page'

export const Route = createFileRoute('/admin/listening/tests/new')({
  component: ListeningTestEditorPage,
})
