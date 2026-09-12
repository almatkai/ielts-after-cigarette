import { createFileRoute } from '@tanstack/react-router'

import { WritingMaterialsPage } from '@/pages/admin/writing/writing-materials-page'

export const Route = createFileRoute('/admin/writing/materials/')({
  component: WritingMaterialsPage,
})
