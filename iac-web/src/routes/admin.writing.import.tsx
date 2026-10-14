import { requireAdminPermission } from '@/features/auth/admin-access'
import { createFileRoute } from '@tanstack/react-router'

import { WritingImportPage } from '@/pages/admin/writing/writing-import-page'

export const Route = createFileRoute('/admin/writing/import')({
  beforeLoad: ({ context }) =>
    requireAdminPermission(context.auth, 'CONTENT_EDITOR'),
  component: WritingImportPage,
})
