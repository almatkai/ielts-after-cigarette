import { createFileRoute } from '@tanstack/react-router'

import { SpeakingImportPage } from '@/pages/admin/speaking/speaking-import-page'

export const Route = createFileRoute('/admin/speaking/import')({
  component: SpeakingImportPage,
})
