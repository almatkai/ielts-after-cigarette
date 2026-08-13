import { createFileRoute } from '@tanstack/react-router'

import { ListeningImportPage } from '@/pages/admin/listening/listening-import-page'

export const Route = createFileRoute('/admin/listening/import')({
  component: ListeningImportPage,
})
