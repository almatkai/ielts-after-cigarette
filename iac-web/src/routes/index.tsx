import { createFileRoute } from '@tanstack/react-router'

import { LandingPage } from '#/pages/landing/ui/landing-page'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'IAC — современная подготовка к IELTS' },
      {
        name: 'description',
        content:
          'Практикуйте все четыре навыка IELTS, отслеживайте прогресс и сосредоточьтесь на задачах, которые действительно влияют на ваш результат.',
      },
      { property: 'og:locale', content: 'ru_RU' },
      { property: 'og:type', content: 'website' },
      {
        property: 'og:title',
        content: 'Понятный путь к вашему целевому баллу IELTS',
      },
      {
        property: 'og:description',
        content:
          'Сфокусированная практика, разбор ошибок и прозрачное отслеживание прогресса.',
      },
    ],
  }),
  component: LandingPage,
})
