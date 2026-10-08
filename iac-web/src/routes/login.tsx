import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { AuthShell } from '#/components/auth/auth-shell'
import { LoginForm } from '#/components/auth/login-form'
import { consumeGoogleReturnPath } from '#/features/auth/google-identity'
import { useAuth } from '#/features/auth/auth-store'

export const Route = createFileRoute('/login')({
  ssr: false,
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    redirect?: '/admin' | '/'
    google?: 'success' | 'registration' | 'error'
  } => {
    const validated: {
      redirect?: '/admin' | '/'
      google?: 'success' | 'registration' | 'error'
    } = {}
    if (search.redirect === '/admin' || search.redirect === '/') {
      validated.redirect = search.redirect
    }
    if (
      search.google === 'success' ||
      search.google === 'registration' ||
      search.google === 'error'
    )
      validated.google = search.google
    return validated
  },
  beforeLoad: async ({ context, search }) => {
    await context.auth.initialize()
    // A Google return must hydrate the login document before navigating away.
    // Redirecting in beforeLoad replaces its SSR boundary during hydration.
    if (context.auth.isAuthenticated() && search.google !== 'success') {
      throw redirect({
        to: search.redirect ?? '/',
      })
    }
  },
  head: () => ({
    meta: [
      { title: 'Войти в Daiyndyq IELTS — подготовка к IELTS' },
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
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { user, accessToken } = useAuth()
  const returning = search.google === 'success' && Boolean(user && accessToken)
  const returnStarted = useRef(false)

  useEffect(() => {
    if (!returning || returnStarted.current) return
    returnStarted.current = true
    void navigate({
      to: search.redirect ?? consumeGoogleReturnPath(),
      replace: true,
    })
  }, [navigate, returning, search.redirect])

  return (
    <AuthShell>
      {returning ? (
        <p
          className="px-6 py-8 text-center text-sm text-[#475569]"
          role="status"
        >
          Завершаем вход через Google…
        </p>
      ) : (
        <LoginForm search={search} />
      )}
    </AuthShell>
  )
}
