import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
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
import {
  GOOGLE_CLIENT_ID,
  loadGoogleIdentityScript,
} from '@/features/auth/google-identity'
import { getErrorMessage } from '@/lib/api/client'

import { AuthInput } from './auth-input'
import { getFieldError } from './auth-input-utils'

function validateEmail(value: string) {
  const normalizedValue = value.trim()
  if (!normalizedValue) return 'Введите электронную почту'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    return 'Проверьте формат электронной почты'
  }
  return undefined
}

function validatePassword(value: string) {
  if (!value) return 'Введите пароль'
  if (value.length < 8) return 'Пароль должен содержать не менее 8 символов'
  return undefined
}

export function LoginForm() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const { login, loginWithGoogle } = useAuth()
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [recoveryIsVisible, setRecoveryIsVisible] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
    onSubmit: async ({ value }) => {
      setSubmissionError(null)
      try {
        await login(value)
        await navigate({ to: search.redirect ?? '/dashboard' })
      } catch (error) {
        setSubmissionError(getErrorMessage(error))
      }
    },
  })

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setSubmissionError(null)
      try {
        await loginWithGoogle(credential)
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
      // A blocked GSI script (ad blocker, offline) must not break password login.
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [handleGoogleCredential])

  return (
    <>
      <CardHeader className="gap-0 px-6 pt-8 text-center sm:px-8 sm:pt-9">
        <CardTitle className="text-3xl tracking-[-0.04em] text-[#0f172a]">
          Войти
        </CardTitle>
        <CardDescription className="sr-only text-[#475569]">
          Введите электронную почту и пароль для входа.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pt-8 sm:px-8">
        <div
          ref={googleButtonRef}
          className="flex min-h-10 w-full items-center justify-center"
        />
        <div className="my-6 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-[#e2e8f0]" />
          <span className="text-xs font-medium uppercase tracking-wide text-[#94a3b8]">
            или
          </span>
          <span className="h-px flex-1 bg-[#e2e8f0]" />
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="email"
            validators={{
              onBlur: ({ value }) => validateEmail(value),
              onSubmit: ({ value }) => validateEmail(value),
            }}
          >
            {(field) => (
              <AuthInput
                id={field.name}
                label="Электронная почта"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                error={getFieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onBlur: ({ value }) => validatePassword(value),
              onSubmit: ({ value }) => validatePassword(value),
            }}
          >
            {(field) => (
              <AuthInput
                id={field.name}
                label="Пароль"
                type="password"
                autoComplete="current-password"
                placeholder="Не менее 8 символов"
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                error={getFieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>

          <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
            <form.Field name="remember">
              {(field) => (
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[#475569]">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(event) =>
                      field.handleChange(event.target.checked)
                    }
                    className="size-4 rounded border-[#cbd5e1] accent-[#3b82f6]"
                  />
                  Запомнить меня
                </label>
              )}
            </form.Field>
            <Button
              type="button"
              variant="link"
              onClick={() => setRecoveryIsVisible((visible) => !visible)}
              className="h-auto min-h-11 p-0 text-sm font-semibold text-[#0f172a] underline decoration-[#cbd5e1] underline-offset-4 hover:decoration-[#3b82f6]"
            >
              Не помню пароль
            </Button>
          </div>

          {recoveryIsVisible ? (
            <p className="mb-4 text-sm leading-6 text-[#475569]" role="status">
              Восстановление пароля появится после подключения почтового
              сервиса.
            </p>
          ) : null}

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit || isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#3b82f6] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSubmitting ? 'Проверяем…' : 'Войти'}
              </Button>
            )}
          </form.Subscribe>

          {submissionError ? (
            <p
              className="mt-4 text-center text-sm leading-6 text-[#dc2626]"
              role="alert"
            >
              {submissionError}
            </p>
          ) : null}
        </form>
      </CardContent>

      <CardFooter className="justify-center px-6 pt-7 pb-8 sm:px-8">
        <p className="text-center text-sm text-[#475569]">
          Впервые здесь?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#0f172a] underline decoration-[#cbd5e1] underline-offset-4 hover:decoration-[#3b82f6]"
          >
            Создать аккаунт
          </Link>
        </p>
      </CardFooter>
    </>
  )
}
