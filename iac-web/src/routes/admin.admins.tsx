import { createFileRoute } from '@tanstack/react-router'

import { AdminsPage } from '@/pages/admin/admins/admins-page'

export const Route = createFileRoute('/admin/admins')({
  component: AdminsPage,
})
