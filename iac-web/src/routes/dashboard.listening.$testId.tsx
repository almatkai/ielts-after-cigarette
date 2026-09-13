import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/listening/$testId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/exam/listening/$testId',
      params: { testId: params.testId },
    })
  },
})
