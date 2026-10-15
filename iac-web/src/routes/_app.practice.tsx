import { createFileRoute } from '@tanstack/react-router'

import { translate } from '@/lib/i18n'
import { PracticePage } from '@/pages/practice/ui/practice-page'

export const Route = createFileRoute('/_app/practice')({
  head: () => ({
    meta: [
      { title: translate('Практика — Daiyndyq IELTS') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: PracticePage,
})
