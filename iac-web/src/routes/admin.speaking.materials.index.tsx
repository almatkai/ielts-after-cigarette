import { createFileRoute } from '@tanstack/react-router'

import { SpeakingMaterialsPage } from '@/pages/admin/speaking/speaking-materials-page'

export const Route = createFileRoute('/admin/speaking/materials/')({
  component: SpeakingMaterialsPage,
})
