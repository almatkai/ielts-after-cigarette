import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

// Non-nested admin route: the exam fills the viewport, without admin sidebar.
export const Route = createFileRoute('/admin_/preview')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: '/admin' } })
    }
    if (!context.auth.hasAnyPermission(['CONTENT_EDITOR'])) {
      throw redirect({ to: '/forbidden' })
    }
  },
  head: () => ({
    meta: [
      { title: 'Предпросмотр теста — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: Outlet,
})
