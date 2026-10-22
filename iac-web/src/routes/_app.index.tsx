import { createFileRoute } from '@tanstack/react-router'

import { OverviewPage } from '@/pages/overview/ui/overview-page'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/_app/')({
  head: () => ({
    meta: [
      { title: tr('Yrys Academy — подготовка к IELTS онлайн') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: OverviewPage,
})
