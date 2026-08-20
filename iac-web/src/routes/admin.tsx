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
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
      },
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
