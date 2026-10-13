import { createFileRoute } from '@tanstack/react-router'

import { OverviewPage } from '@/pages/overview/ui/overview-page'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/_app/')({
  head: () => ({
    meta: [
      { title: tr('Daiyndyq IELTS — сдай IELTS выше 7.0 с первого раза') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: OverviewPage,
})
