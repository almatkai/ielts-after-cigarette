import { createFileRoute } from '@tanstack/react-router'

import { MistakesPage } from '@/pages/mistakes/ui/mistakes-page'

export const Route = createFileRoute('/dashboard/mistakes')({
  head: () => ({
    meta: [
      { title: 'Ошибки — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: MistakesPage,
})
