import { createFileRoute } from '@tanstack/react-router'

import { PracticePage } from '@/pages/practice/ui/practice-page'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/_app/practice')({
  head: () => ({
    meta: [
      { title: tr('Практика — Yrys Academy') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: PracticePage,
})
