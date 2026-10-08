import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Turnstile } from '@/components/auth/turnstile'
import { Button } from '@/components/ui/button'
import { authStore, useAuth } from '@/features/auth/auth-store'
import { getGuestConfig, startGuestMock } from '@/features/auth/guest'
import { fullMockKeys } from '@/features/fullmock/api'
import { getErrorMessage } from '@/lib/api/client'

export function GuestTrialCard() {
  const { guest, initialized } = useAuth()
  const navigate = useNavigate()
  const client = useQueryClient()
  const [token, setToken] = useState('')
  const [challengeVersion, setChallengeVersion] = useState(0)
  const config = useQuery({
    queryKey: ['guest-config'],
    queryFn: ({ signal }) => getGuestConfig(signal),
  })
  const start = useMutation({
    mutationFn: () => startGuestMock('academic', token),
    onSuccess: async (session) => {
      await authStore.restoreGuest()
      client.setQueryData(fullMockKeys.session(session.id), session)
      await navigate({
        to: '/exam/full-mock-sessions/$sessionId',
        params: { sessionId: session.id },
      })
    },
    onError: () => {
      setToken('')
      setChallengeVersion((value) => value + 1)
    },
  })
  return (
    <section
      aria-label="Бесплатный Full Mock"
      className="grid gap-4 rounded-2xl border border-[#dbeafe] bg-white p-5 sm:p-7"
    >
      <div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Полный пробный IELTS
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#69696d]">
          Проверьте свой уровень IELTS — пройдите полный пробный тест.
        </p>
      </div>
      {guest?.sessionId ? (
        <Button asChild className="w-fit">
          <Link
            to="/exam/full-mock-sessions/$sessionId"
            params={{ sessionId: guest.sessionId }}
          >
            Открыть мой тест и результаты
          </Link>
        </Button>
      ) : (
        <>
          {config.data?.enabled && config.data.siteKey ? (
            <Turnstile
              key={challengeVersion}
              siteKey={config.data.siteKey}
              onToken={setToken}
            />
          ) : null}
          {config.data && !config.data.enabled ? (
            <p role="status" className="text-sm text-[#69696d]">
              Гостевой запуск пока недоступен. Войдите в аккаунт для подготовки.
            </p>
          ) : null}
          {config.isError || start.isError ? (
            <p role="alert" className="text-sm text-red-600">
              {getErrorMessage(start.error ?? config.error)}
            </p>
          ) : null}
          <Button
            className="w-fit"
            disabled={
              !initialized ||
              !config.data?.enabled ||
              !(config.data.examTypes ?? ['academic']).includes('academic') ||
              Boolean(config.data.siteKey && !token) ||
              start.isPending
            }
            onClick={() => start.mutate()}
          >
            {start.isPending ? 'Готовим тест…' : 'Начать бесплатный Full Mock'}
          </Button>
          <p className="text-xs leading-5 text-[#808084]">
            Нажимая «Начать», вы принимаете{' '}
            <Link to="/terms" className="underline">
              условия использования
            </Link>{' '}
            и{' '}
            <Link to="/privacy" className="underline">
              политику конфиденциальности
            </Link>
            , включая обработку ответов и аудио для AI-проверки. Таймер каждой
            секции начнётся при её открытии.
          </p>
        </>
      )}
      <p className="text-sm text-[#69696d]">
        Для других тестов{' '}
        <Link to="/login" className="font-semibold text-[#2563eb] underline">
          войдите в аккаунт
        </Link>
        .
      </p>
    </section>
  )
}
