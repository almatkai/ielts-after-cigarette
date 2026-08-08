import { useNavigate } from '@tanstack/react-router'
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
import type { GoogleRegistrationRequired } from '@/features/auth/google-auth'
import { ApiError, getErrorMessage } from '@/lib/api/client'

import { AuthInput } from './auth-input'
import { getFieldError } from './auth-input-utils'
import {
  formatPhoneInput,
  normalizePhone,
  validatePhone,
} from './phone-validation'

export type PendingGoogleRegistration = Pick<
  GoogleRegistrationRequired,
  'registrationToken' | 'profile'
>

type GoogleCompleteFormProps = {
  pending: PendingGoogleRegistration
  onBack: () => void
  redirect?: '/admin' | '/dashboard'
}

function validateName(value: string) {
  if (!value.trim()) return 'Введите имя'
  if (value.trim().length < 2) return 'Имя должно содержать не менее 2 символов'
  if (value.trim().length > 100)
    return 'Имя должно содержать не более 100 символов'
  return undefined
}

function validatePassword(value: string) {
  if (!value) return 'Придумайте пароль'
  if (value.length < 8) return 'Пароль должен содержать не менее 8 символов'
  return undefined
}

export function GoogleCompleteForm({
  pending,
  onBack,
  redirect,
}: GoogleCompleteFormProps) {
  const navigate = useNavigate()
  const { completeGoogleRegistration } = useAuth()
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string>>
  >({})
  const [sessionExpired, setSessionExpired] = useState(false)

  const form = useForm({
    defaultValues: {
      name: pending.profile.name,
      phone: pending.profile.phone
        ? formatPhoneInput(pending.profile.phone)
        : '',
      password: '',
      acceptedTerms: false,
    },
    onSubmit: async ({ value }) => {
      setSubmissionError(null)
      setFieldErrors({})
      setSessionExpired(false)
      try {
        await completeGoogleRegistration({
          registrationToken: pending.registrationToken,
          name: value.name.trim(),
          phone: normalizePhone(value.phone),
          password: value.password,
          acceptedTerms: value.acceptedTerms,
        })
        await navigate({ to: redirect ?? '/dashboard' })
      } catch (error) {
        if (error instanceof ApiError && error.details) {
          setFieldErrors(error.details)
        } else if (
          error instanceof ApiError &&
          error.code === 'GOOGLE_TOKEN_INVALID'
        ) {
          setSessionExpired(true)
          setSubmissionError(
            'Сессия регистрации истекла. Войдите через Google ещё раз.',
          )
        } else if (
          error instanceof ApiError &&
          error.code === 'PHONE_ALREADY_EXISTS'
        ) {
          setFieldErrors({ phone: getErrorMessage(error) })
        } else {
          setSubmissionError(getErrorMessage(error))
        }
      }
    },
  })

  const clearFieldError = (name: string) => {
    setFieldErrors((previous) => {
      if (!(name in previous)) return previous
      const next = { ...previous }
      delete next[name]
      return next
    })
  }

  return (
    <>
      <CardHeader className="gap-0 px-6 pt-8 text-center sm:px-8 sm:pt-9">
        <CardTitle className="text-3xl tracking-[-0.04em] text-[#0f172a]">
          Давайте создадим вам аккаунт
        </CardTitle>
        <CardDescription className="mt-2 text-[#475569]">
          Вход через Google выполнен: {pending.profile.email}. Заполните данные
          ниже, чтобы завершить регистрацию.
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
                onChange={(value) => {
                  field.handleChange(value)
                  clearFieldError('name')
                }}
                onBlur={field.handleBlur}
                error={
                  fieldErrors.name ?? getFieldError(field.state.meta.errors)
                }
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
                onChange={(value) => {
                  field.handleChange(formatPhoneInput(value))
                  clearFieldError('phone')
                }}
                onBlur={field.handleBlur}
                error={
                  fieldErrors.phone ?? getFieldError(field.state.meta.errors)
                }
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
                autoComplete="new-password"
                placeholder="8+ символов"
                value={field.state.value}
                onChange={(value) => {
                  field.handleChange(value)
                  clearFieldError('password')
                }}
                onBlur={field.handleBlur}
                error={
                  fieldErrors.password ?? getFieldError(field.state.meta.errors)
                }
              />
            )}
          </form.Field>

          <form.Field
            name="acceptedTerms"
            validators={{
              onSubmit: ({ value }) =>
                value ? undefined : 'Подтвердите согласие, чтобы продолжить',
            }}
          >
            {(field) => {
              const termsError =
                fieldErrors.acceptedTerms ??
                getFieldError(field.state.meta.errors)
              return (
                <div className="mb-5">
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-[#475569]">
                    <input
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(event) => {
                        field.handleChange(event.target.checked)
                        clearFieldError('acceptedTerms')
                      }}
                      className="mt-1 size-4 shrink-0 rounded border-[#cbd5e1] accent-[#3b82f6]"
                      aria-invalid={Boolean(termsError)}
                    />
                    <span>
                      Принимаю условия использования и политику
                      конфиденциальности.
                    </span>
                  </label>
                  {termsError ? (
                    <p className="mt-1 text-xs text-[#dc2626]" role="alert">
                      {termsError}
                    </p>
                  ) : null}
                </div>
              )
            }}
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
                {isSubmitting ? 'Создаём аккаунт…' : 'Создать аккаунт'}
              </Button>
            )}
          </form.Subscribe>

          {submissionError ? (
            <div className="mt-4 text-center">
              <p className="text-sm leading-6 text-[#dc2626]" role="alert">
                {submissionError}
              </p>
              {sessionExpired ? (
                <Button
                  type="button"
                  variant="link"
                  onClick={onBack}
                  className="mt-1 inline-block h-auto p-0 text-sm font-semibold text-[#0f172a] underline decoration-[#cbd5e1] underline-offset-4 hover:decoration-[#3b82f6]"
                >
                  Вернуться ко входу
                </Button>
              ) : null}
            </div>
          ) : null}
        </form>
      </CardContent>

      <CardFooter className="justify-center px-6 pt-7 pb-8 sm:px-8">
        <p className="text-center text-sm text-[#475569]">
          Уже есть аккаунт?{' '}
          <Button
            type="button"
            variant="link"
            onClick={onBack}
            className="h-auto min-h-11 p-0 text-sm font-semibold text-[#0f172a] underline decoration-[#cbd5e1] underline-offset-4 hover:decoration-[#3b82f6]"
          >
            Вернуться ко входу
          </Button>
        </p>
      </CardFooter>
    </>
  )
}
