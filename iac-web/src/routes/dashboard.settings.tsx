import { createFileRoute } from '@tanstack/react-router'

import { SettingsPage } from '@/pages/settings/ui/settings-page'

export const Route = createFileRoute('/dashboard/settings')({
  head: () => ({
    meta: [
      { title: 'Настройки — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: SettingsPage,
})
