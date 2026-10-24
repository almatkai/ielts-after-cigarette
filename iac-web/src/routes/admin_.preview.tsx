import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { tr } from '@/lib/i18n'

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
      { title: tr('Предпросмотр теста — Yrys Academy') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: Outlet,
})
