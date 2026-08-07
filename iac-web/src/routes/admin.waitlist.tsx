import { createFileRoute } from '@tanstack/react-router'

import { WaitlistPage } from '@/pages/admin/waitlist/waitlist-page'

export const Route = createFileRoute('/admin/waitlist')({
  component: WaitlistPage,
})
