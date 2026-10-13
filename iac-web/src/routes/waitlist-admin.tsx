import { createFileRoute, redirect } from '@tanstack/react-router'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/waitlist-admin')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: '/admin/waitlist' })
  },
  head: () => ({
    meta: [
      { title: tr('Waitlist — администрирование IAC') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})
