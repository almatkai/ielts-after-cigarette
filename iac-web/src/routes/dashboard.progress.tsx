import { createFileRoute } from '@tanstack/react-router'

import { ProgressPage } from '@/pages/progress/ui/progress-page'

export const Route = createFileRoute('/dashboard/progress')({
  head: () => ({
    meta: [
      { title: 'Прогресс — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProgressPage,
})
