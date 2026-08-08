import { createFileRoute } from '@tanstack/react-router'

import { ReadingMaterialsPage } from '@/pages/admin/reading/reading-materials-page'

export const Route = createFileRoute('/admin/reading/materials/')({
  component: ReadingMaterialsPage,
})
