import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
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

import { AuthInput } from './auth-input'
import { GoogleCompleteForm } from './google-complete-form'
import type { PendingGoogleRegistration } from './google-complete-form'

function GoogleIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27a7.18 7.18 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  )
}

function validateEmail(value: string): string | null {
  const normalized = value.trim()
  if (!normalized) return 'Введите адрес электронной почты'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Проверьте формат электронной почты'
  }
  return null
}

function validatePassword(value: string): string | null {
  if (!value) return 'Введите пароль'
  return null
}

export function LoginForm() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const { login, loginWithGoogle } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const [googleFailed, setGoogleFailed] = useState(false)
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

        const container = googleButtonRef.current
        const computedWidth = container.clientWidth
          ? Math.min(400, Math.max(200, container.clientWidth))
          : 366

        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: computedWidth,
        })
      })
      .catch(() => {
        if (cancelled) return
        setGoogleFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [handleGoogleCredential])

  const handlePasswordLogin = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    setSubmissionError(null)

    const normalizedEmail = email.trim()
    const emailErr = validateEmail(normalizedEmail)
    const passwordErr = validatePassword(password)

    setEmailError(emailErr)
    setPasswordError(passwordErr)

    if (emailErr || passwordErr) return

    setIsSubmitting(true)
    try {
      await login({
        email: normalizedEmail,
        password,
        remember: true,
      })
      await navigate({ to: search.redirect ?? '/dashboard' })
    } catch (error) {
      setSubmissionError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

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
          Войти в аккаунт
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-[#475569]">
          Введите почту и пароль для входа в платформу
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pt-6 pb-6 sm:px-8">
        <form noValidate onSubmit={handlePasswordLogin}>
          <div className="space-y-1">
            <AuthInput
              id="login-email"
              label="Электронная почта"
              type="email"
              value={email}
              onChange={(value) => {
                setEmail(value)
                if (emailError) setEmailError(null)
              }}
              onBlur={() => {
                if (email) setEmailError(validateEmail(email))
              }}
              autoComplete="email"
              placeholder="name@example.com"
              error={emailError ?? undefined}
            />

            <AuthInput
              id="login-password"
              label="Пароль"
              type="password"
              value={password}
              onChange={(value) => {
                setPassword(value)
                if (passwordError) setPasswordError(null)
              }}
              onBlur={() => {
                if (password) setPasswordError(validatePassword(password))
              }}
              autoComplete="current-password"
              placeholder="••••••••"
              error={passwordError ?? undefined}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#3b82f6] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSubmitting ? 'Входим…' : 'Войти'}
          </Button>

          {submissionError ? (
            <div
              className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] p-3 text-center text-sm leading-5 text-[#dc2626]"
              role="alert"
            >
              {submissionError}
            </div>
          ) : null}
        </form>

        {/* Разделитель */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-[#e2e8f0]" />
          <span className="absolute bg-white px-3 text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
            или
          </span>
        </div>

        {/* Кнопка входа через Google снизу со стандартным стилем */}
        <div
          onClick={() => {
            window.google?.accounts?.id?.prompt?.()
          }}
          className="group relative flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border border-[#cbd5e1] bg-white px-4 shadow-xs transition-colors hover:border-[#94a3b8] hover:bg-[#f8fafc] active:bg-[#f1f5f9]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              window.google?.accounts?.id?.prompt?.()
            }
          }}
        >
          {/* Стандартный внешний вид кнопки */}
          <div className="flex items-center gap-3 text-sm font-semibold text-[#0f172a]">
            <GoogleIcon className="size-5 shrink-0" />
            <span>Войти через Google</span>
          </div>

          {/* Невидимый слой Google GSI iframe для прямого перехвата клика */}
          <div
            ref={googleButtonRef}
            className="absolute inset-0 z-10 flex h-full w-full items-center justify-center opacity-0 overflow-hidden [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:!scale-[2]"
          />
        </div>

        {googleFailed ? (
          <p className="mt-2 text-center text-xs text-[#94a3b8]">
            Вход через Google временно недоступен
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="justify-center px-6 pt-0 pb-8 sm:px-8">
        <p className="text-center text-sm text-[#475569]">
          Ещё нет аккаунта?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#0f172a] underline decoration-[#cbd5e1] underline-offset-4 hover:decoration-[#3b82f6]"
          >
            Зарегистрироваться
          </Link>
        </p>
      </CardFooter>
    </>
  )
}
