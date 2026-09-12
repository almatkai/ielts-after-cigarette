import { createFileRoute } from '@tanstack/react-router'

import { WritingImportPage } from '@/pages/admin/writing/writing-import-page'

export const Route = createFileRoute('/admin/writing/import')({
  component: WritingImportPage,
})
