import { createFileRoute } from '@tanstack/react-router'

import { ProfilePage } from '@/pages/profile/ui/profile-page'

export const Route = createFileRoute('/_app/profile')({
  head: () => ({
    meta: [
      { title: 'Профиль — Daiyndyq IELTS' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProfilePage,
})
