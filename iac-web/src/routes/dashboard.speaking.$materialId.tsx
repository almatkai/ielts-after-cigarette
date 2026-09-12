import { createFileRoute } from '@tanstack/react-router'

import { SpeakingStudentPage } from '@/pages/speaking/speaking-student-page'

export const Route = createFileRoute('/dashboard/speaking/$materialId')({
  component: SpeakingRoute,
})

function SpeakingRoute() {
  const { materialId } = Route.useParams()
  return <SpeakingStudentPage materialId={materialId} />
}
