import { createFileRoute } from '@tanstack/react-router'

import { translate } from '@/lib/i18n'
import { OverviewPage } from '@/pages/overview/ui/overview-page'

export const Route = createFileRoute('/_app/')({
  head: () => ({
    meta: [
      {
        title: translate('Daiyndyq IELTS — сдай IELTS выше 7.0 с первого раза'),
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: OverviewPage,
})
