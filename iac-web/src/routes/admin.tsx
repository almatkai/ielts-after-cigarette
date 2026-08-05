import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AdminShell } from '@/components/admin/admin-shell'

export const Route = createFileRoute('/admin')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: '/admin' } })
    }
    if (!context.auth.hasAnyRole(['EDITOR', 'ADMIN'])) {
      throw redirect({ to: '/forbidden' })
    }
  },
  head: () => ({
    meta: [
      { title: 'Администрирование — IAC' },
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
