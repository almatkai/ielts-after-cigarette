import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
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
