import { createFileRoute } from '@tanstack/react-router'

import { SpeakingMaterialEditorPage } from '@/pages/admin/speaking/speaking-material-editor-page'

export const Route = createFileRoute('/admin/speaking/materials/$materialId')({
  component: SpeakingMaterialRoute,
})

function SpeakingMaterialRoute() {
  const { materialId } = Route.useParams()
  return <SpeakingMaterialEditorPage materialId={materialId} />
}
