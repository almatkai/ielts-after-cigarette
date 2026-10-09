import { requireAdminPermission } from '@/features/auth/admin-access'
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/listening/tests')({
  beforeLoad: ({ context }) =>
    requireAdminPermission(context.auth, 'CONTENT_EDITOR'),
  component: Outlet,
})
