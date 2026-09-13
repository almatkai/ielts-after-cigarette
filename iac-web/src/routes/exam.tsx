import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/exam')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  head: () => ({
    meta: [
      { title: 'IELTS test — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ExamLayout,
})

function ExamLayout() {
  return (
    <main className="min-h-dvh bg-[#f7f7f5] text-[#111111]">
      <Outlet />
    </main>
  )
}
