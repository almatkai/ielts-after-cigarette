import { createFileRoute } from '@tanstack/react-router'

import { ReadingMaterialEditorPage } from '@/pages/admin/reading/reading-material-editor-page'

export const Route = createFileRoute('/admin/reading/materials/new')({
  component: ReadingMaterialEditorPage,
})
