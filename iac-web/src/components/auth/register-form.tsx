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
import {
  getPendingRegistration,
  setPendingRegistration,
} from '@/features/auth/registration-flow'
import { requestPhoneVerification } from '@/features/auth/phone-verification'
import { getErrorMessage } from '@/lib/api/client'

import { AuthInput } from './auth-input'
import { getFieldError } from './auth-input-utils'
import {
  formatPhoneInput,
  normalizePhone,
  validatePhone,
} from './phone-validation'

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
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const pendingRegistration = getPendingRegistration()

  const form = useForm({
    defaultValues: {
      name: pendingRegistration?.name ?? '',
      email: pendingRegistration?.email ?? '',
      phone: pendingRegistration?.phone ?? '',
      password: pendingRegistration?.password ?? '',
      confirmPassword: pendingRegistration?.confirmPassword ?? '',
      acceptedTerms: pendingRegistration?.acceptedTerms ?? false,
    },
    onSubmit: async ({ value }) => {
      setSubmissionError(null)
      try {
        const phone = normalizePhone(value.phone)
        const challenge = await requestPhoneVerification(phone, 'registration')
        setPendingRegistration({
          ...value,
          name: value.name.trim(),
          email: value.email.trim(),
          phone,
          verificationId: challenge.verificationId,
        })
        await navigate({ to: '/register/verify' })
      } catch (error) {
        setSubmissionError(getErrorMessage(error))
      }
    },
  })

  return (
    <>
      <CardHeader className="gap-0 px-6 pt-8 text-center sm:px-8 sm:pt-9">
        <CardTitle className="text-3xl tracking-[-0.04em] text-[#0f172a]">
          Создать аккаунт
        </CardTitle>
        <CardDescription className="mt-2 text-[#475569]">
          Заполните данные, затем подтвердите номер в WhatsApp.
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

          <form.Field
            name="phone"
            validators={{
              onBlur: ({ value }) => validatePhone(value),
              onSubmit: ({ value }) => validatePhone(value),
            }}
          >
            {(field) => (
              <AuthInput
                id={field.name}
                label="Номер WhatsApp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+7 700 123 45 67"
                value={field.state.value}
                onChange={(value) =>
                  field.handleChange(formatPhoneInput(value))
                }
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
                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-[#475569]">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(event) =>
                      field.handleChange(event.target.checked)
                    }
                    className="mt-1 size-4 shrink-0 rounded border-[#cbd5e1] accent-[#3b82f6]"
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
                  <p className="mt-1 text-xs text-[#dc2626]" role="alert">
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
                className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#3b82f6] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSubmitting ? 'Отправляем код…' : 'Продолжить'}
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
          Уже есть аккаунт?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#0f172a] underline decoration-[#cbd5e1] underline-offset-4 hover:decoration-[#3b82f6]"
          >
            Войти
          </Link>
        </p>
      </CardFooter>
    </>
  )
}
