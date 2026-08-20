import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthShell } from '#/components/auth/auth-shell'
import { LoginForm } from '#/components/auth/login-form'

export const Route = createFileRoute('/login')({
  ssr: false,
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    redirect?: '/admin' | '/dashboard'
    registration?: string
    oauth_error?: string
  } => {
    const validated: {
      redirect?: '/admin' | '/dashboard'
      registration?: string
      oauth_error?: string
    } = {}
    if (search.redirect === '/admin' || search.redirect === '/dashboard') {
      validated.redirect = search.redirect
    }
    if (typeof search.registration === 'string' && search.registration) {
      validated.registration = search.registration
    }
    if (typeof search.oauth_error === 'string' && search.oauth_error) {
      validated.oauth_error = search.oauth_error
    }
    return validated
  },
  beforeLoad: async ({ context, search }) => {
    await context.auth.initialize()
    if (context.auth.isAuthenticated()) {
      throw redirect({ to: search.redirect ?? '/dashboard' })
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
