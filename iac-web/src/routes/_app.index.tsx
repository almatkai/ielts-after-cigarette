import { createFileRoute } from '@tanstack/react-router'

import { OverviewPage } from '@/pages/overview/ui/overview-page'

export const Route = createFileRoute('/_app/')({
  head: () => ({
    meta: [
      { title: 'Yrys Academy — подготовка к IELTS онлайн' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: OverviewPage,
})
