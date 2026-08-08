import { Link, useNavigate } from '@tanstack/react-router'
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
import {
  clearPendingRegistration,
  getPendingRegistration,
  setPendingRegistration,
} from '@/features/auth/registration-flow'
import type { PendingRegistration } from '@/features/auth/registration-flow'
import {
  confirmPhoneVerification,
  requestPhoneVerification,
} from '@/features/auth/phone-verification'
import { getErrorMessage } from '@/lib/api/client'

import { AuthInput } from './auth-input'
import { formatPhoneInput } from './phone-validation'

export function RegistrationVerificationForm() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [registration, setRegistration] = useState<PendingRegistration | null>(
    getPendingRegistration,
  )
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  if (!registration) return null

  const submitCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('Введите все 6 цифр из сообщения WhatsApp.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const proof = await confirmPhoneVerification({
        verificationId: registration.verificationId,
        phone: registration.phone,
        purpose: 'registration',
        code,
      })
      const { verificationId: _, ...input } = registration
      await auth.register({
        ...input,
        verificationToken: proof.verificationToken,
      })
      clearPendingRegistration()
      await navigate({ to: '/dashboard' })
    } catch (submissionError) {
      setError(getErrorMessage(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resendCode = async () => {
    setError(null)
    setIsResending(true)
    try {
      const challenge = await requestPhoneVerification(
        registration.phone,
        'registration',
      )
      const updatedRegistration = {
        ...registration,
        verificationId: challenge.verificationId,
      }
      setPendingRegistration(updatedRegistration)
      setRegistration(updatedRegistration)
      setCode('')
    } catch (resendError) {
      setError(getErrorMessage(resendError))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <CardHeader className="gap-0 px-6 pt-8 text-center sm:px-8 sm:pt-9">
        <CardTitle className="text-3xl tracking-[-0.04em] text-[#0f172a]">
          Подтвердите номер
        </CardTitle>
        <CardDescription className="mt-2 text-[#475569]">
          Мы отправили код из 6 цифр в WhatsApp на{' '}
          {formatPhoneInput(registration.phone)}.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pt-8 sm:px-8">
        <form noValidate onSubmit={(event) => void submitCode(event)}>
          <AuthInput
            id="verification-code"
            label="Код из сообщения"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(value) => {
              setCode(value.replace(/\D/g, '').slice(0, 6))
              setError(null)
            }}
            onBlur={() => undefined}
            error={error ?? undefined}
          />

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || isResending || code.length !== 6}
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#3b82f6] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSubmitting ? 'Проверяем код…' : 'Создать аккаунт'}
          </Button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-3 text-center">
          <Button
            type="button"
            variant="link"
            disabled={isSubmitting || isResending}
            onClick={() => void resendCode()}
            className="h-auto min-h-11 p-0 text-sm font-semibold text-[#0f172a] underline decoration-[#cbd5e1] underline-offset-4 hover:decoration-[#3b82f6]"
          >
            {isResending ? 'Отправляем код…' : 'Отправить код повторно'}
          </Button>
          <p className="text-xs leading-5 text-[#64748b]">
            Код действует 5 минут. Повторная отправка доступна через минуту.
          </p>
        </div>
      </CardContent>

      <CardFooter className="justify-center px-6 pt-7 pb-8 sm:px-8">
        <Link
          to="/register"
          className="min-h-11 text-sm font-semibold text-[#475569] underline decoration-[#cbd5e1] underline-offset-4 hover:text-[#0f172a] hover:decoration-[#3b82f6]"
        >
          Изменить данные
        </Link>
      </CardFooter>
    </>
  )
}
