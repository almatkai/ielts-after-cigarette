import { createFileRoute } from '@tanstack/react-router'

import { ReadingImportPage } from '@/pages/admin/reading/reading-import-page'

export const Route = createFileRoute('/admin/reading/import')({
  component: ReadingImportPage,
})
