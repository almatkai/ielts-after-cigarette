import { createFileRoute } from '@tanstack/react-router'

import { translate } from '@/lib/i18n'
import { ProfilePage } from '@/pages/profile/ui/profile-page'

export const Route = createFileRoute('/_app/profile')({
  head: () => ({
    meta: [
      { title: translate('Профиль — Daiyndyq IELTS') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProfilePage,
})
