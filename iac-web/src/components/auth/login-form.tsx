import { useSearch } from '@tanstack/react-router'

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { parseOAuthRegistrationToken } from '@/features/auth/oauth-auth'

import { OAuthButtons } from './oauth-buttons'
import { OAuthCompleteForm } from './oauth-complete-form'

export function LoginForm() {
  const search = useSearch({ from: '/login' })
  const submissionError = search.oauth_error
    ? oauthErrorMessage(search.oauth_error)
    : null

  const pendingOAuth = search.registration
    ? parseOAuthRegistrationToken(search.registration)
    : null
  const invalidOAuthLink = Boolean(search.registration) && !pendingOAuth

  if (pendingOAuth) {
    return (
      <OAuthCompleteForm pending={pendingOAuth} redirect={search.redirect} />
    )
  }

  return (
    <>
      <CardHeader className="gap-0 px-6 pt-8 text-center sm:px-8 sm:pt-9">
        <CardTitle className="text-3xl tracking-[-0.04em] text-[#0f172a]">
          Войти
        </CardTitle>
        <CardDescription className="sr-only text-[#475569]">
          Войдите через Google, GitHub или Яндекс.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pt-8 pb-8 sm:px-8">
        <OAuthButtons redirect={search.redirect} />
        {invalidOAuthLink ? (
          <p
            className="mt-4 text-center text-sm leading-6 text-[#dc2626]"
            role="alert"
          >
            Ссылка для завершения регистрации недействительна. Войдите ещё раз.
          </p>
        ) : submissionError ? (
          <p
            className="mt-4 text-center text-sm leading-6 text-[#dc2626]"
            role="alert"
          >
            {submissionError}
          </p>
        ) : null}
      </CardContent>
    </>
  )
}

function oauthErrorMessage(code: string) {
  switch (code) {
    case 'access_denied':
      return 'Вход через внешний сервис был отменён. Попробуйте снова.'
    case 'invalid_state':
      return 'Сессия входа истекла или повторилась. Начните вход заново.'
    case 'email_required':
      return 'Сервис не передал вашу электронную почту. Разрешите доступ к почте или войдите через Google.'
    case 'exchange_failed':
      return 'Не удалось подтвердить вход через внешний сервис. Попробуйте ещё раз.'
    default:
      return 'Не удалось войти через внешний сервис. Попробуйте ещё раз.'
  }
}
