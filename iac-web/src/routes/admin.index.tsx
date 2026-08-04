import { createFileRoute } from '@tanstack/react-router'

import { AdminOverviewPage } from '@/pages/admin/ui/admin-overview-page'

export const Route = createFileRoute('/admin/')({
  component: AdminOverviewPage,
})
