import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/register/verify')({
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
})
