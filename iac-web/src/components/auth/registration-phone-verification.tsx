import { useReducer, useRef } from 'react'

import { Button } from '@/components/ui/button'
import {
  confirmPhoneVerification,
  requestPhoneVerification,
} from '@/features/auth/phone-verification'
import type { VerifiedPhone } from '@/features/auth/phone-verification'
import { getErrorMessage } from '@/lib/api/client'

import { AuthInput } from './auth-input'
import { validatePhone } from './phone-validation'

type VerificationStatus =
  'idle' | 'sending' | 'sent' | 'confirming' | 'verified'

type VerificationState = {
  status: VerificationStatus
  phone: string
  verificationId: string | null
  code: string
  message: string | null
  error: string | null
}

type VerificationAction =
  | { type: 'sending'; phone: string }
  | { type: 'invalid'; phone: string; message: string }
  | { type: 'sent'; phone: string; verificationId: string }
  | { type: 'code'; code: string }
  | { type: 'confirming' }
  | { type: 'verified' }
  | { type: 'failed'; message: string }

const initialState: VerificationState = {
  status: 'idle',
  phone: '',
  verificationId: null,
  code: '',
  message: null,
  error: null,
}

function verificationReducer(
  state: VerificationState,
  action: VerificationAction,
): VerificationState {
  switch (action.type) {
    case 'sending':
      return {
        ...initialState,
        status: 'sending',
        phone: action.phone,
      }
    case 'invalid':
      return {
        ...initialState,
        phone: action.phone,
        error: action.message,
      }
    case 'sent':
      return {
        status: 'sent',
        phone: action.phone,
        verificationId: action.verificationId,
        code: '',
        message: 'Код из 6 цифр отправлен в WhatsApp.',
        error: null,
      }
    case 'code':
      return { ...state, code: action.code, error: null }
    case 'confirming':
      return { ...state, status: 'confirming', error: null }
    case 'verified':
      return {
        ...state,
        status: 'verified',
        message: 'Номер подтверждён. Можно создавать аккаунт.',
        error: null,
      }
    case 'failed':
      return {
        ...state,
        status: state.verificationId ? 'sent' : 'idle',
        error: action.message,
      }
  }
}

type RegistrationPhoneVerificationProps = {
  phone: string
  onVerified: (proof: VerifiedPhone | null) => void
}

export function RegistrationPhoneVerification({
  phone,
  onVerified,
}: RegistrationPhoneVerificationProps) {
  const [state, dispatch] = useReducer(verificationReducer, initialState)
  const requestGeneration = useRef(0)
  const isCurrentPhone = state.phone === phone
  const status = isCurrentPhone ? state.status : 'idle'
  const isBusy = status === 'sending' || status === 'confirming'

  const sendCode = async () => {
    const phoneError = validatePhone(phone)
    if (phoneError) {
      dispatch({ type: 'invalid', phone, message: phoneError })
      return
    }

    const generation = ++requestGeneration.current
    onVerified(null)
    dispatch({ type: 'sending', phone })
    try {
      const challenge = await requestPhoneVerification(phone, 'registration')
      if (generation !== requestGeneration.current) return
      dispatch({
        type: 'sent',
        phone,
        verificationId: challenge.verificationId,
      })
    } catch (error) {
      if (generation !== requestGeneration.current) return
      dispatch({ type: 'failed', message: getErrorMessage(error) })
    }
  }

  const confirmCode = async () => {
    if (!isCurrentPhone || !state.verificationId) return
    if (!/^\d{6}$/.test(state.code)) {
      dispatch({
        type: 'failed',
        message: 'Введите все 6 цифр из сообщения WhatsApp.',
      })
      return
    }

    dispatch({ type: 'confirming' })
    try {
      const proof = await confirmPhoneVerification({
        verificationId: state.verificationId,
        phone,
        purpose: 'registration',
        code: state.code,
      })
      dispatch({ type: 'verified' })
      onVerified({ phone, verificationToken: proof.verificationToken })
    } catch (error) {
      dispatch({ type: 'failed', message: getErrorMessage(error) })
    }
  }

  return (
    <div className="mb-5 rounded-[12px] border border-[#dededb] bg-[#fafaf8] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#111111]">
            Подтверждение номера
          </p>
          <p className="mt-1 text-xs leading-5 text-[#69696d]">
            Отправим одноразовый код в WhatsApp. Он действует 5 минут.
          </p>
        </div>
        {status === 'verified' ? (
          <span className="shrink-0 rounded-full bg-[#e7f7ec] px-2.5 py-1 text-xs font-semibold text-[#24733f]">
            Подтверждён
          </span>
        ) : null}
      </div>

      {status !== 'verified' ? (
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => void sendCode()}
          className="mt-3 h-10 w-full rounded-[9px] border-[#c9c9c5] bg-white text-sm font-semibold text-[#111111] hover:bg-[#f4f4f1]"
        >
          {status === 'sending'
            ? 'Отправляем…'
            : status === 'sent' || status === 'confirming'
              ? 'Отправить новый код'
              : 'Получить код в WhatsApp'}
        </Button>
      ) : null}

      {(status === 'sent' || status === 'confirming') &&
      state.verificationId ? (
        <div className="mt-4 border-t border-[#e5e5e1] pt-4">
          <AuthInput
            id="verification-code"
            label="Код из сообщения"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={state.code}
            onChange={(value) =>
              dispatch({
                type: 'code',
                code: value.replace(/\D/g, '').slice(0, 6),
              })
            }
            onBlur={() => undefined}
          />
          <Button
            type="button"
            disabled={isBusy || state.code.length !== 6}
            onClick={() => void confirmCode()}
            className="h-10 w-full rounded-[9px] bg-[#111111] text-sm font-semibold text-white hover:bg-[#2a2a2a]"
          >
            {status === 'confirming' ? 'Проверяем…' : 'Подтвердить код'}
          </Button>
        </div>
      ) : null}

      {isCurrentPhone && state.message ? (
        <p className="mt-3 text-xs leading-5 text-[#24733f]" role="status">
          {state.message}
        </p>
      ) : null}
      {isCurrentPhone && state.error ? (
        <p className="mt-3 text-xs leading-5 text-[#c92f2f]" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  )
}
