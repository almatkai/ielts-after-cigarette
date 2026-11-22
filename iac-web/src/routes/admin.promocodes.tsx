import { createFileRoute } from '@tanstack/react-router'

import { PromocodesPage } from '@/pages/admin/promocodes/promocodes-page'

export const Route = createFileRoute('/admin/promocodes')({
  component: PromocodesPage,
})
