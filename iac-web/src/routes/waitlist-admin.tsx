import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/waitlist-admin')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: '/admin/waitlist' })
  },
  head: () => ({
    meta: [
      { title: 'Waitlist — администрирование IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})
