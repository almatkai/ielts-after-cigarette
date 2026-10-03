import { createFileRoute } from '@tanstack/react-router'
import { ListeningTestPreviewPage } from '@/pages/admin/test-preview-page'

export const Route = createFileRoute('/admin_/preview/listening/$testId')({
  component: ListeningPreviewRoute,
})

function ListeningPreviewRoute() {
  const { testId } = Route.useParams()
  return <ListeningTestPreviewPage testId={testId} />
}
