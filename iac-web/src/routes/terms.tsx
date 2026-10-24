import { createFileRoute } from '@tanstack/react-router'

import { TermsPage } from '@/pages/legal/terms-page'
import { tr } from '@/lib/i18n'
import { siteUrl } from '@/features/blog/seo'

export const Route = createFileRoute('/terms')({
  ssr: false,
  head: () => ({
    meta: [
      { title: tr('Условия использования — Yrys Academy') },
      {
        name: 'description',
        content:
          'Условия использования и пользовательское соглашение образовательной платформы подготовки к IELTS «Yrys Academy».',
      },
      { name: 'robots', content: 'index, follow' },
    ],
    links: [{ rel: 'canonical', href: siteUrl('/terms') }],
  }),
  component: TermsPage,
})
