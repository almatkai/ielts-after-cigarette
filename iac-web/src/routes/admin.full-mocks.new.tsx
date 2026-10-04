import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/full-mocks/new')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/full-mocks', replace: true })
  },
})
