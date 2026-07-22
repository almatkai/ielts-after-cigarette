import { createFileRoute } from '@tanstack/react-router'

import { AuthShell } from '#/components/auth/auth-shell'
import { RegisterForm } from '#/components/auth/register-form'

export const Route = createFileRoute('/register')({
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
