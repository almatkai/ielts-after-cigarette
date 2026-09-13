import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/dashboard/full-mock-sessions/$sessionId',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/exam/full-mock-sessions/$sessionId',
      params: { sessionId: params.sessionId },
    })
  },
})
