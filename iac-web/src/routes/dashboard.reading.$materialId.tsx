import { createFileRoute } from '@tanstack/react-router'

import { ReadingStudentPage } from '@/pages/reading/reading-student-page'

export const Route = createFileRoute('/dashboard/reading/$materialId')({
  component: ReadingRoute,
})
function ReadingRoute() {
  const { materialId } = Route.useParams()
  return <ReadingStudentPage materialId={materialId} />
}
