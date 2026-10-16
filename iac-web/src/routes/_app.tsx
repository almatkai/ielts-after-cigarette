import { Outlet, createFileRoute } from '@tanstack/react-router'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { canGuestVisit, canBrowseWithoutAccount } from '@/features/auth/guest'
import { GuestAccessGate } from '@/components/auth/guest-shell'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/_app')({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      // The trial flag controls starting a mock, not visiting the app.
      // Keep the overview reachable from login even when trials are unavailable.
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
      { title: tr('Панель управления — Daiyndyq IELTS') },
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
