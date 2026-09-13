import { createFileRoute } from '@tanstack/react-router'

import { WritingStudentPage } from '@/pages/writing/writing-student-page'

export const Route = createFileRoute('/exam/writing/$materialId')({
  component: WritingRoute,
})

function WritingRoute() {
  const { materialId } = Route.useParams()
  return <WritingStudentPage materialId={materialId} />
}
