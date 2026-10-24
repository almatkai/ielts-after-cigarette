import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AdminShell } from '@/components/admin/admin-shell'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/admin')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: '/admin' } })
    }
    if (!context.auth.canAccessAdmin()) {
      throw redirect({ to: '/forbidden' })
    }
  },
  head: () => ({
    meta: [
      { title: tr('Администрирование — Yrys Academy') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}
