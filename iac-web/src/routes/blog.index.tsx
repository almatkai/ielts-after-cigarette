import { createFileRoute } from '@tanstack/react-router'

import { BlogIndexPage } from '@/pages/blog/blog-index-page'

export const Route = createFileRoute('/blog/')({
  ssr: true,
  head: () => ({
    meta: [
      { title: 'Блог — IAC' },
      {
        name: 'description',
        content:
          'Статьи авторов с подтверждённым IELTS 7.5+: стратегии, опыт и разборы.',
      },
    ],
  }),
  component: BlogIndexPage,
})
