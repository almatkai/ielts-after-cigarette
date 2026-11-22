import { createFileRoute } from '@tanstack/react-router'

import { BillingReturnPage } from '@/pages/pricing/billing-return-page'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/_app/billing/return')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { orderId?: string; status?: string } => ({
    orderId:
      typeof search.orderId === 'string' && /^[\w-]{1,64}$/.test(search.orderId)
        ? search.orderId
        : undefined,
    status:
      typeof search.status === 'string' && search.status === 'failed'
        ? 'failed'
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: tr('Оплата — Yrys Academy') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: BillingReturnRoute,
})

function BillingReturnRoute() {
  const { orderId, status } = Route.useSearch()
  return <BillingReturnPage orderId={orderId} initialStatus={status} />
}
