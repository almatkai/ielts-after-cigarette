import { createFileRoute, redirect } from '@tanstack/react-router'

import { AnalyticsPage } from '@/pages/admin/analytics/analytics-page'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/admin/analytics')({
  beforeLoad: ({ context }) => {
    if (!context.auth.hasAnyRole(['ADMIN']))
      throw redirect({ to: '/forbidden' })
  },
  head: () => ({ meta: [{ title: tr('Аналитика — Daiyndyq IELTS') }] }),
  component: AnalyticsPage,
})
