import { createFileRoute } from '@tanstack/react-router'

import { PricingPage } from '@/pages/pricing/pricing-page'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/_app/pricing')({
  head: () => ({
    meta: [
      { title: tr('Тарифы — Yrys Academy') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: PricingPage,
})
