import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import {
  canGuestVisit,
  canBrowseWithoutAccount,
  getGuestConfig,
} from '@/features/auth/guest'
import { GuestAccessGate } from '@/components/auth/guest-shell'

export const Route = createFileRoute('/_app')({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      const config = await context.queryClient.ensureQueryData({
        queryKey: ['guest-config'],
        queryFn: () => getGuestConfig(),
      })
      if (!config.enabled) throw redirect({ to: '/login' })
      return {
        guestAccessDenied: !(
          canBrowseWithoutAccount(location.pathname) ||
          (context.auth.hasGuestSession() && canGuestVisit(location.pathname))
        ),
      }
    }
    return { guestAccessDenied: false }
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
  const { guestAccessDenied } = Route.useRouteContext()
  return (
    <DashboardShell>
      {guestAccessDenied ? <GuestAccessGate /> : <Outlet />}
    </DashboardShell>
  )
}
