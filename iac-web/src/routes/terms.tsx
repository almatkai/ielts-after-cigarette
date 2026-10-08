import { createFileRoute } from '@tanstack/react-router'

import { TermsPage } from '@/pages/legal/terms-page'

export const Route = createFileRoute('/terms')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Условия использования — Daiyndyq IELTS' },
      {
        name: 'description',
        content:
          'Условия использования и пользовательское соглашение образовательной платформы подготовки к IELTS «Daiyndyq IELTS».',
      },
      { name: 'robots', content: 'index, follow' },
    ],
  }),
  component: TermsPage,
})
