import { ArrowLeft, Clock, Lock, PlayCircle, TickCircle } from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { useAuth } from '@/features/auth/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, ExamLoadingScreen } from '@/features/attempts/attempt-ui'
import {
  advanceFullMockSession,
  fullMockKeys,
  getFullMockSession,
  pauseFullMockSession,
} from '@/features/fullmock/api'
import type { FullMockSession, FullMockSkill } from '@/features/fullmock/api'
import { getErrorMessage } from '@/lib/api/client'
import { FullMockReport } from './full-mock-report'

const labels: Record<FullMockSkill, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

export function FullMockSessionPage({ sessionId }: { sessionId: string }) {
  // Rebind the mounted query observer when sign-in clears the guest's cache.
  const { initialized } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: fullMockKeys.session(sessionId),
    enabled: initialized,
    queryFn: ({ signal }) => getFullMockSession(sessionId, signal),
    refetchInterval: (cachedQuery) => {
      const session = cachedQuery.state.data
      return session?.status === 'IN_PROGRESS' ||
        session?.sections.some(
          (section) => section.attempt.status === 'PROCESSING',
        )
        ? 10_000
        : false
    },
  })
  const currentSection = query.data?.currentSection
  const deadline = query.data?.sections.find(
    (section) => section.position === currentSection,
  )?.deadlineAt
  const sessionStatus = query.data?.status
  const refetchSession = query.refetch
  useEffect(() => {
    if (sessionStatus !== 'IN_PROGRESS' || !deadline) return
    const timer = window.setTimeout(
      () => void refetchSession(),
      Math.max(0, new Date(deadline).getTime() - Date.now()) + 50,
    )
    return () => window.clearTimeout(timer)
  }, [deadline, sessionStatus, refetchSession])
  const advance = useMutation({
    mutationFn: () => advanceFullMockSession(sessionId),
    onSuccess: (session) =>
      queryClient.setQueryData(fullMockKeys.session(sessionId), session),
  })
  const returnToSite = useMutation({
    mutationFn: async () => {
      const session = query.data
      const current = session?.sections.find(
        (section) => section.position === session.currentSection,
      )
      if (
        session?.status === 'IN_PROGRESS' &&
        current?.attempt.status === 'IN_PROGRESS' &&
        current.deadlineAt
      ) {
        const paused = await pauseFullMockSession(sessionId)
        queryClient.setQueryData(fullMockKeys.session(sessionId), paused)
        queryClient.removeQueries({
          queryKey: [...fullMockKeys.session(sessionId), 'sections'],
        })
      }
    },
    onSuccess: () => navigate({ to: '/' }),
  })
  if (query.isPending) {
    return (
      <ExamLoadingScreen
        badge="IELTS Full Mock"
        label="Загружаем экзаменационную сессию…"
        description="Получаем статус секций, таймеры и расписание Full Mock..."
      />
    )
  }
  if (query.isError)
    return (
      <ErrorState
        title="Не удалось загрузить Full Mock"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  const session = query.data
  const current = session.sections.find(
    (section) => section.position === session.currentSection,
  )
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] content-start gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="secondary">
            Full Mock ·{' '}
            {session.mockTest.examType === 'academic'
              ? 'Academic'
              : 'General Training'}
          </Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            {session.mockTest.title}
          </h1>
        </div>
        <Button
          variant="outline"
          disabled={returnToSite.isPending || advance.isPending}
          onClick={() => returnToSite.mutate()}
        >
          <ArrowLeft aria-hidden />
          {returnToSite.isPending ? 'Сохраняем…' : 'Вернуться на сайт'}
        </Button>
      </div>
      {returnToSite.isError ? (
        <p role="alert" className="text-sm text-[#e23b3b]">
          Не удалось приостановить тест: {getErrorMessage(returnToSite.error)}
        </p>
      ) : null}
      {session.status === 'SUBMITTED' ? (
        <FullMockReport key={session.id} session={session} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {session.sections.map((section) => (
              <SectionCard
                key={section.position}
                section={section}
                currentSection={session.currentSection}
                sessionId={session.id}
              />
            ))}
          </div>
          {current &&
          ['SUBMITTED', 'PROCESSING', 'ABANDONED'].includes(
            current.attempt.status,
          ) ? (
            <Card className="border-[#dbeafe] bg-[#eff6ff] shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <p className="text-sm font-medium">
                  {labels[current.skill]} завершён. Можно перейти дальше.
                </p>
                <Button
                  disabled={advance.isPending || returnToSite.isPending}
                  onClick={() => advance.mutate()}
                >
                  {advance.isPending
                    ? 'Переходим…'
                    : session.currentSection === 4
                      ? 'Завершить и показать отчёт'
                      : 'Продолжить к следующей секции'}
                </Button>
              </CardContent>
            </Card>
          ) : null}
          {advance.isError ? (
            <p className="text-sm text-[#e23b3b]">
              {getErrorMessage(advance.error)}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

function SectionCard({
  section,
  currentSection,
  sessionId,
}: {
  section: FullMockSession['sections'][number]
  currentSection: number
  sessionId: string
}) {
  const client = useQueryClient()
  const pause = useMutation({
    mutationFn: () => pauseFullMockSession(sessionId),
    onSuccess: (session) =>
      client.setQueryData(fullMockKeys.session(sessionId), session),
  })
  const isCurrent = section.position === currentSection
  const completed = ['SUBMITTED', 'PROCESSING', 'ABANDONED'].includes(
    section.attempt.status,
  )
  const locked = section.position > currentSection
  return (
    <Card
      className={isCurrent ? 'border-[#93c5fd] shadow-none' : 'shadow-none'}
    >
      <CardHeader>
        <div className="flex flex-col items-start gap-2">
          <CardTitle className="text-base">
            0{section.position} · {labels[section.skill]}
          </CardTitle>
          {completed ? (
            <Badge className="bg-emerald-600">
              <TickCircle aria-hidden />
              {section.attempt.status === 'ABANDONED'
                ? 'Время вышло'
                : section.attempt.status === 'PROCESSING'
                  ? 'Проверяется'
                  : 'Сдано'}
            </Badge>
          ) : locked ? (
            <Badge variant="outline">
              <Lock aria-hidden />
              Закрыто
            </Badge>
          ) : (
            <Badge variant="secondary">Текущая</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-[#69696d]">
          {section.durationMinutes ??
            (section.skill === 'listening'
              ? 30
              : section.skill === 'speaking'
                ? 15
                : 60)}{' '}
          минут
        </p>
        {isCurrent && !completed ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionLink section={section} sessionId={sessionId} />
            {section.remainingMilliseconds != null ? (
              <Badge variant="outline">
                На паузе · {formatRemainingTime(section.remainingMilliseconds)}
              </Badge>
            ) : section.deadlineAt ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={pause.isPending}
                  onClick={() => pause.mutate()}
                >
                  На паузу
                </Button>
                <ExamTimer deadlineAt={section.deadlineAt} />
              </div>
            ) : null}
          </div>
        ) : null}
        {pause.isError ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {getErrorMessage(pause.error)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SectionLink({
  section,
  sessionId,
}: {
  section: FullMockSession['sections'][number]
  sessionId: string
}) {
  const content = (
    <>
      <PlayCircle aria-hidden />
      Продолжить
    </>
  )
  return (
    <Button asChild>
      <Link
        to="/exam/full-mock-sessions/$sessionId/sections/$sectionPosition"
        params={{ sessionId, sectionPosition: String(section.position) }}
        preload={false}
      >
        {content}
      </Link>
    </Button>
  )
}

function formatRemainingTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function ExamTimer({ deadlineAt }: { deadlineAt: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const seconds = Math.max(
    0,
    Math.ceil((new Date(deadlineAt).getTime() - now) / 1000),
  )
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return (
    <Badge variant="outline" className="gap-2 px-3 py-2 text-sm">
      <Clock className="size-4" aria-hidden />
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
      {String(remainder).padStart(2, '0')}
    </Badge>
  )
}
