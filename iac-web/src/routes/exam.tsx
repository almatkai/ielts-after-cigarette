import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { canGuestVisit, getGuestConfig } from '@/features/auth/guest'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { GuestAccessGate } from '@/components/auth/guest-shell'

export const Route = createFileRoute('/exam')({
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
          context.auth.hasGuestSession() && canGuestVisit(location.pathname)
        ),
      }
    }
    return { guestAccessDenied: false }
  },
  head: () => ({
    meta: [
      { title: 'IELTS test — Daiyndyq IELTS' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ExamLayout,
})

function ExamLayout() {
  const { guestAccessDenied } = Route.useRouteContext()
  if (guestAccessDenied)
    return (
      <DashboardShell>
        <GuestAccessGate />
      </DashboardShell>
    )
  return (
    <main className="min-h-dvh bg-[#f7f7f5] text-[#111111]">
      <Outlet />
    </main>
  )
}
