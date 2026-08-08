import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/reading/materials')({
  component: Outlet,
})
