import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/speaking/$materialId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/exam/speaking/$materialId',
      params: { materialId: params.materialId },
    })
  },
})
