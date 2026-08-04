import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-store'
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
  const auth = useAuth()
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [recoveryIsVisible, setRecoveryIsVisible] = useState(false)
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
    onSubmit: async ({ value }) => {
      setSubmissionError(null)
      try {
        await auth.login(value)
        await navigate({ to: '/dashboard' })
      } catch (error) {
        setSubmissionError(getErrorMessage(error))
      }
    },
  })

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
