import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/writing/materials')({
  component: Outlet,
})
