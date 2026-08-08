import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-store'
import { isGoogleRegistrationRequired } from '@/features/auth/google-auth'
import {
  GOOGLE_CLIENT_ID,
  loadGoogleIdentityScript,
} from '@/features/auth/google-identity'
import { getErrorMessage } from '@/lib/api/client'

import { GoogleCompleteForm } from './google-complete-form'
import type { PendingGoogleRegistration } from './google-complete-form'

export function LoginForm() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const { loginWithGoogle } = useAuth()
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [pendingGoogle, setPendingGoogle] =
    useState<PendingGoogleRegistration | null>(null)
  const googleButtonRef = useRef<HTMLDivElement>(null)

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setSubmissionError(null)
      try {
        const response = await loginWithGoogle(credential)
        if (isGoogleRegistrationRequired(response)) {
          setPendingGoogle({
            registrationToken: response.registrationToken,
            profile: response.profile,
          })
          return
        }
        await navigate({ to: search.redirect ?? '/dashboard' })
      } catch (error) {
        setSubmissionError(getErrorMessage(error))
      }
    },
    [loginWithGoogle, navigate, search.redirect],
  )

  useEffect(() => {
    let cancelled = false
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google || !googleButtonRef.current) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              void handleGoogleCredential(response.credential)
            }
          },
        })
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 340,
        })
      })
      // Google is the only sign-in option here, so surface script failures.
      .catch(() => {
        if (cancelled) return
        setSubmissionError(
          'Не удалось загрузить вход через Google. Проверьте соединение или блокировщик рекламы.',
        )
      })
    return () => {
      cancelled = true
    }
  }, [handleGoogleCredential])

  if (pendingGoogle) {
    return (
      <GoogleCompleteForm
        pending={pendingGoogle}
        onBack={() => {
          setPendingGoogle(null)
          setSubmissionError(null)
        }}
        redirect={search.redirect}
      />
    )
  }

  return (
    <>
      <CardHeader className="gap-0 px-6 pt-8 text-center sm:px-8 sm:pt-9">
        <CardTitle className="text-3xl tracking-[-0.04em] text-[#0f172a]">
          Войти
        </CardTitle>
        <CardDescription className="sr-only text-[#475569]">
          Войдите через аккаунт Google.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pt-8 pb-8 sm:px-8">
        <div
          ref={googleButtonRef}
          className="flex min-h-10 w-full items-center justify-center"
        />
        {submissionError ? (
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
