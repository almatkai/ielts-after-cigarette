import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/speaking/materials')({
  component: Outlet,
})
