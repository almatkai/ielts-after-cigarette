import { requireAdminPermission } from '@/features/auth/admin-access'
import { createFileRoute } from '@tanstack/react-router'

import { SpeakingImportPage } from '@/pages/admin/speaking/speaking-import-page'

export const Route = createFileRoute('/admin/speaking/import')({
  beforeLoad: ({ context }) =>
    requireAdminPermission(context.auth, 'CONTENT_EDITOR'),
  component: SpeakingImportPage,
})
