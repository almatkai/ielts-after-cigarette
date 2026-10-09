import { requireAdminPermission } from '@/features/auth/admin-access'
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/speaking/materials')({
  beforeLoad: ({ context }) =>
    requireAdminPermission(context.auth, 'CONTENT_EDITOR'),
  component: Outlet,
})
