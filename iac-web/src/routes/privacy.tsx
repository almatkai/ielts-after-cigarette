import { createFileRoute } from '@tanstack/react-router'

import { PrivacyPage } from '@/pages/legal/privacy-page'
import { tr } from '@/lib/i18n'

export const Route = createFileRoute('/privacy')({
  ssr: false,
  head: () => ({
    meta: [
      { title: tr('Политика конфиденциальности — Daiyndyq IELTS') },
      {
        name: 'description',
        content:
          'Политика конфиденциальности и обработки персональных данных образовательной платформы подготовки к IELTS «Daiyndyq IELTS».',
      },
      { name: 'robots', content: 'index, follow' },
    ],
  }),
  component: PrivacyPage,
})
