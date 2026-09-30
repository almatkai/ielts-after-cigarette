import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/speaking/$materialId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/exam/speaking/$materialId',
      params: { materialId: params.materialId },
    })
  },
})
