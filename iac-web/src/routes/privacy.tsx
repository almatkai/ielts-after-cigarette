import { createFileRoute } from '@tanstack/react-router'

import { PrivacyPage } from '@/pages/legal/privacy-page'
import { tr } from '@/lib/i18n'
import { siteUrl } from '@/features/blog/seo'

export const Route = createFileRoute('/privacy')({
  ssr: false,
  head: () => ({
    meta: [
      { title: tr('Политика конфиденциальности — Yrys Academy') },
      {
        name: 'description',
        content:
          'Политика конфиденциальности и обработки персональных данных образовательной платформы подготовки к IELTS «Yrys Academy».',
      },
      { name: 'robots', content: 'index, follow' },
    ],
    links: [{ rel: 'canonical', href: siteUrl('/privacy') }],
  }),
  component: PrivacyPage,
})
