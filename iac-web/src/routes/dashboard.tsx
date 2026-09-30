import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ location }) => {
    const target = location.pathname.replace(/^\/dashboard\/?/, '/')
    throw redirect({ to: (target || '/') as any })
  },
})
