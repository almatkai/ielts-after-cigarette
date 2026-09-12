import { createFileRoute } from '@tanstack/react-router'

import { WritingMaterialEditorPage } from '@/pages/admin/writing/writing-material-editor-page'

export const Route = createFileRoute('/admin/writing/materials/new')({
  component: WritingMaterialEditorPage,
})
