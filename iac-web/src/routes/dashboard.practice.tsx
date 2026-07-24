import { createFileRoute } from '@tanstack/react-router'

import { PracticePage } from '@/pages/practice/ui/practice-page'

export const Route = createFileRoute('/dashboard/practice')({
  head: () => ({
    meta: [
      { title: 'Практика — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: PracticePage,
})
