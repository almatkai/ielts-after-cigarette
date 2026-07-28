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

import { AuthInput, getFieldError } from './auth-input'

function validateName(value: string) {
  if (!value.trim()) return 'Введите имя'
  if (value.trim().length < 2) return 'Имя должно содержать не менее 2 символов'
  return undefined
}

function validateEmail(value: string) {
  const normalizedValue = value.trim()
  if (!normalizedValue) return 'Введите электронную почту'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    return 'Проверьте формат электронной почты'
  }
  return undefined
}

function validatePassword(value: string) {
  if (!value) return 'Придумайте пароль'
  if (value.length < 8) return 'Пароль должен содержать не менее 8 символов'
  return undefined
}

export function RegisterForm() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
    onSubmit: async ({ value }) => {
      setSubmissionError(null)
      try {
        await auth.register(value)
        await navigate({ to: '/dashboard' })
      } catch (error) {
        setSubmissionError(getErrorMessage(error))
      }
    },
  })

  return (
    <>
      <CardHeader className="gap-0 px-6 pt-8 text-center sm:px-8 sm:pt-9">
        <CardTitle className="text-3xl tracking-[-0.04em]">
          Создать аккаунт
        </CardTitle>
        <CardDescription className="sr-only">
          Заполните поля для создания аккаунта.
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
            name="name"
            validators={{
              onBlur: ({ value }) => validateName(value),
              onSubmit: ({ value }) => validateName(value),
            }}
          >
            {(field) => (
              <AuthInput
                id={field.name}
                label="Имя"
                autoComplete="name"
                placeholder="Как к вам обращаться"
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                error={getFieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>

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

          <div className="grid gap-x-3 sm:grid-cols-2">
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
                  autoComplete="new-password"
                  placeholder="8+ символов"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  error={getFieldError(field.state.meta.errors)}
                />
              )}
            </form.Field>

            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ['password'],
                onBlur: ({ value, fieldApi }) =>
                  value === fieldApi.form.getFieldValue('password')
                    ? undefined
                    : 'Пароли не совпадают',
                onSubmit: ({ value, fieldApi }) => {
                  if (!value) return 'Повторите пароль'
                  return value === fieldApi.form.getFieldValue('password')
                    ? undefined
                    : 'Пароли не совпадают'
                },
              }}
            >
              {(field) => (
                <AuthInput
                  id={field.name}
                  label="Повторите пароль"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ещё раз"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  error={getFieldError(field.state.meta.errors)}
                />
              )}
            </form.Field>
          </div>

          <form.Field
            name="acceptedTerms"
            validators={{
              onSubmit: ({ value }) =>
                value ? undefined : 'Подтвердите согласие, чтобы продолжить',
            }}
          >
            {(field) => (
              <div className="mb-5">
                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-[#69696d]">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(event) =>
                      field.handleChange(event.target.checked)
                    }
                    className="mt-1 size-4 shrink-0 rounded border-[#c9c9c5] accent-[#e23b3b]"
                    aria-invalid={Boolean(
                      getFieldError(field.state.meta.errors),
                    )}
                  />
                  <span>
                    Принимаю условия использования и политику
                    конфиденциальности.
                  </span>
                </label>
                {getFieldError(field.state.meta.errors) ? (
                  <p className="mt-1 text-xs text-[#c92f2f]" role="alert">
                    {getFieldError(field.state.meta.errors)}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit || isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#e23b3b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#c92f2f] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSubmitting ? 'Проверяем…' : 'Создать аккаунт'}
              </Button>
            )}
          </form.Subscribe>

          {submissionError ? (
            <p
              className="mt-4 text-center text-sm leading-6 text-[#c92f2f]"
              role="alert"
            >
              {submissionError}
            </p>
          ) : null}
        </form>
      </CardContent>

      <CardFooter className="justify-center px-6 pt-7 pb-8 sm:px-8">
        <p className="text-center text-sm text-[#69696d]">
          Уже есть аккаунт?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#111111] underline decoration-[#c9c9c5] underline-offset-4 hover:decoration-[#e23b3b]"
          >
            Войти
          </Link>
        </p>
      </CardFooter>
    </>
  )
}
