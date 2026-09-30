import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/listening/$testId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/exam/listening/$testId',
      params: { testId: params.testId },
    })
  },
})
