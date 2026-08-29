import { createFileRoute } from '@tanstack/react-router'

import { MistakesPage } from '@/pages/mistakes/ui/mistakes-page'

export const Route = createFileRoute('/dashboard/mistakes')({
  component: MistakesPage,
})
