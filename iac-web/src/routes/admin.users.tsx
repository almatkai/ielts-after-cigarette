import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: ({ context }) => {
    if (!context.auth.hasAnyRole(['ADMIN']))
      throw redirect({ to: '/forbidden' })
  },
  component: Outlet,
})
