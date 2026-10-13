import { createFileRoute } from '@tanstack/react-router'

import { ProfilePage } from '@/pages/profile/ui/profile-page'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/_app/profile')({
  head: () => ({
    meta: [
      { title: tr('Профиль — Daiyndyq IELTS') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProfilePage,
})
