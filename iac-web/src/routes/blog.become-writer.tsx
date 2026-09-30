import { createFileRoute } from '@tanstack/react-router'

import { BecomeWriterPage } from '@/pages/blog/become-writer-page'

export const Route = createFileRoute('/blog/become-writer')({
  ssr: true,
  head: () => ({
    meta: [
      { title: 'Стать автором — IAC' },
      {
        name: 'description',
        content:
          'Публикуйтесь в блоге IAC: подтвердите официальный IELTS 7.5+ и пишите статьи.',
      },
    ],
  }),
  component: BecomeWriterPage,
})
