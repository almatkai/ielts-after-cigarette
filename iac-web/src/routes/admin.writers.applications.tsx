import { requireAdminPermission } from '@/features/auth/admin-access'
import { createFileRoute } from '@tanstack/react-router'

import { AdminWriterApplicationsPage } from '@/pages/admin/blog/writer-applications-page'

export const Route = createFileRoute('/admin/writers/applications')({
  beforeLoad: ({ context }) =>
    requireAdminPermission(context.auth, 'BLOG_MODERATOR'),
  component: AdminWriterApplicationsPage,
})
