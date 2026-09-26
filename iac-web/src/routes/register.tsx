import { createFileRoute, redirect } from '@tanstack/react-router'

// Keep old bookmarks working; registration now starts with Google on /login.
export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
})
