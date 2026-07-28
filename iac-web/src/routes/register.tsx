import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthShell } from '#/components/auth/auth-shell'
import { RegisterForm } from '#/components/auth/register-form'

export const Route = createFileRoute('/register')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (context.auth.isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  head: () => ({
    meta: [
      { title: 'Создать аккаунт IAC — подготовка к IELTS' },
      {
        name: 'description',
        content: 'Регистрация в платформе сфокусированной подготовки к IELTS.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  )
}
