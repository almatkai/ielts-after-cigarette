import { createFileRoute } from '@tanstack/react-router'

import { WritingMaterialEditorPage } from '@/pages/admin/writing/writing-material-editor-page'

export const Route = createFileRoute('/admin/writing/materials/$materialId')({
  component: WritingMaterialRoute,
})

function WritingMaterialRoute() {
  const { materialId } = Route.useParams()
  return <WritingMaterialEditorPage materialId={materialId} />
}
