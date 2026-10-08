import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const Route = createFileRoute('/_app')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  head: () => ({
    meta: [
      { title: 'Панель управления — Daiyndyq IELTS' },
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
