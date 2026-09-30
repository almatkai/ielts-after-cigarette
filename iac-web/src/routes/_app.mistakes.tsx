import { createFileRoute } from '@tanstack/react-router'

import { MistakesPage } from '@/pages/mistakes/ui/mistakes-page'

export const Route = createFileRoute('/_app/mistakes')({
  component: MistakesPage,
})
