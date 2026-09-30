import { createFileRoute } from '@tanstack/react-router'

import { OverviewPage } from '@/pages/overview/ui/overview-page'

export const Route = createFileRoute('/_app/')({
  head: () => ({
    meta: [
      { title: 'Обзор — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: OverviewPage,
})
