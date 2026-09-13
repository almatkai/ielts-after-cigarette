import { createFileRoute } from '@tanstack/react-router'

import { ListeningStudentPage } from '@/pages/listening/listening-student-page'

export const Route = createFileRoute('/exam/listening/$testId')({
  component: ListeningRoute,
})

function ListeningRoute() {
  const { testId } = Route.useParams()
  return <ListeningStudentPage testId={testId} />
}
