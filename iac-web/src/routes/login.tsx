import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthShell } from '#/components/auth/auth-shell'
import { LoginForm } from '#/components/auth/login-form'

export const Route = createFileRoute('/login')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (context.auth.isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  head: () => ({
    meta: [
      { title: 'Войти в IAC — подготовка к IELTS' },
      {
        name: 'description',
        content: 'Вход в личный кабинет платформы подготовки к IELTS.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: LoginPage,
})

function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  )
}
