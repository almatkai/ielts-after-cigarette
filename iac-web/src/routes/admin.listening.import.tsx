import { requireAdminPermission } from '@/features/auth/admin-access'
import { createFileRoute } from '@tanstack/react-router'

import { ListeningImportPage } from '@/pages/admin/listening/listening-import-page'

export const Route = createFileRoute('/admin/listening/import')({
  beforeLoad: ({ context }) =>
    requireAdminPermission(context.auth, 'CONTENT_EDITOR'),
  component: ListeningImportPage,
})
