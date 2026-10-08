import { createFileRoute } from '@tanstack/react-router'

import { AdminWriterApplicationsPage } from '@/pages/admin/blog/writer-applications-page'

export const Route = createFileRoute('/admin/writers/applications')({
  component: AdminWriterApplicationsPage,
})
