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
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
      },
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
