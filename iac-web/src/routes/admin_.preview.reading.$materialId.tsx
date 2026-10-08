import { createFileRoute } from '@tanstack/react-router'
import { ReadingTestPreviewPage } from '@/pages/admin/test-preview-page'

export const Route = createFileRoute('/admin_/preview/reading/$materialId')({
  component: ReadingPreviewRoute,
})

function ReadingPreviewRoute() {
  const { materialId } = Route.useParams()
  return <ReadingTestPreviewPage materialId={materialId} />
}
