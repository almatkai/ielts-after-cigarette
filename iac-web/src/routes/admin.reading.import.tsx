import { requireAdminPermission } from '@/features/auth/admin-access'
import { createFileRoute } from '@tanstack/react-router'

import { ReadingImportPage } from '@/pages/admin/reading/reading-import-page'

export const Route = createFileRoute('/admin/reading/import')({
  beforeLoad: ({ context }) =>
    requireAdminPermission(context.auth, 'CONTENT_EDITOR'),
  component: ReadingImportPage,
})
