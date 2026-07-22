import { Outlet, createFileRoute } from '@tanstack/react-router'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [
      { title: 'Панель управления — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  )
}
