import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/reading/$materialId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/exam/reading/$materialId',
      params: { materialId: params.materialId },
    })
  },
})
