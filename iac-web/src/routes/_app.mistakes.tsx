import { createFileRoute } from '@tanstack/react-router'

import { MistakesPage } from '@/pages/mistakes/ui/mistakes-page'
import { mistakesSearchSchema } from '@/pages/mistakes/model'

export const Route = createFileRoute('/_app/mistakes')({
  validateSearch: mistakesSearchSchema,
  component: MistakesPage,
})
