import { createFileRoute } from '@tanstack/react-router'

import { ProfilePage } from '@/pages/profile/ui/profile-page'

export const Route = createFileRoute('/dashboard/profile')({
  head: () => ({
    meta: [
      { title: 'Профиль — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProfilePage,
})
