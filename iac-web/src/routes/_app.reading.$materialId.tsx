import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/reading/$materialId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/exam/reading/$materialId',
      params: { materialId: params.materialId },
    })
  },
})
