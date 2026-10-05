import { createFileRoute, redirect } from '@tanstack/react-router'
import { AIProvidersPage } from '@/pages/admin/ai-providers/ai-providers-page'

export const Route = createFileRoute('/admin/ai-providers')({
  beforeLoad: ({ context }) => {
    if (!context.auth.hasAnyRole(['ADMIN']))
      throw redirect({ to: '/forbidden' })
  },
  head: () => ({ meta: [{ title: 'AI-провайдеры — Daiyndyq IELTS' }] }),
  component: AIProvidersPage,
})
