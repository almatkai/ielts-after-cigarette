import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  CardContent,
  CardDescription,
  CardFooter,
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
        await navigate({ to: search.redirect ?? '/' })
      } catch (error) {
        setSubmissionError(getErrorMessage(error))
      }
    },
    [loginWithGoogle, navigate, search.redirect],
  )

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
    <GoogleSignInCard
      onCredential={handleGoogleCredential}
      submissionError={submissionError}
    />
  )
}

function GoogleSignInCard({
  onCredential,
  submissionError,
}: {
  onCredential: (credential: string) => Promise<void>
  submissionError: string | null
}) {
  const [googleFailed, setGoogleFailed] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google || !googleButtonRef.current) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              void onCredential(response.credential)
            }
          },
        })
        const container = googleButtonRef.current
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(400, Math.max(200, container.clientWidth || 320)),
        })
      })
      .catch(() => {
        if (!cancelled) setGoogleFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [onCredential])

  return (
    <>
      <CardHeader className="gap-0 px-6 pt-8 text-center sm:px-8 sm:pt-9">
        <CardTitle className="text-3xl tracking-[-0.04em] text-[#0f172a]">
          Войти или создать аккаунт
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-[#475569]">
          Для входа и регистрации используйте Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pt-6 pb-8 sm:px-8">
        <div ref={googleButtonRef} className="flex min-h-11 justify-center" />
        {googleFailed ? (
          <p className="mt-3 text-center text-sm text-[#dc2626]" role="alert">
            Не удалось загрузить вход через Google. Проверьте подключение и
            обновите страницу.
          </p>
        ) : null}
        {submissionError ? (
          <p className="mt-3 text-center text-sm text-[#dc2626]" role="alert">
            {submissionError}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-center border-t border-[#f1f5f9] px-6 py-4 text-center text-xs leading-5 text-[#64748b] sm:px-8">
        <p>
          Входя в систему, вы соглашаетесь с{' '}
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[#cbd5e1] underline-offset-2 transition-colors hover:text-[#0f172a] hover:decoration-[#3b82f6]"
          >
            условиями использования
          </Link>{' '}
          и{' '}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[#cbd5e1] underline-offset-2 transition-colors hover:text-[#0f172a] hover:decoration-[#3b82f6]"
          >
            политикой конфиденциальности
          </Link>
          .
        </p>
      </CardFooter>
    </>
  )
}
