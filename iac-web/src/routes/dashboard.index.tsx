import { createFileRoute } from '@tanstack/react-router'

import { OverviewPage } from '@/pages/overview/ui/overview-page'

export const Route = createFileRoute('/dashboard/')({
  head: () => ({
    meta: [
      { title: 'Обзор — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: OverviewPage,
})
