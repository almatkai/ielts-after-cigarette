import { createFileRoute } from '@tanstack/react-router'

import { SpeakingMaterialEditorPage } from '@/pages/admin/speaking/speaking-material-editor-page'

export const Route = createFileRoute('/admin/speaking/materials/new')({
  component: SpeakingMaterialEditorPage,
})
