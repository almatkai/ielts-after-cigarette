import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/writing/$materialId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/exam/writing/$materialId',
      params: { materialId: params.materialId },
    })
  },
})
