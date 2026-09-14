import {
  ArrowRight,
  Clock,
  Lock,
  PlayCircle,
  TickCircle,
} from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, ExamLoadingScreen } from '@/features/attempts/attempt-ui'
import {
  advanceFullMockSession,
  finishFullMockSession,
  fullMockKeys,
  getFullMockSession,
} from '@/features/fullmock/api'
import type { FullMockSession, FullMockSkill } from '@/features/fullmock/api'
import { getErrorMessage } from '@/lib/api/client'

const labels: Record<FullMockSkill, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

export function FullMockSessionPage({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: fullMockKeys.session(sessionId),
    queryFn: ({ signal }) => getFullMockSession(sessionId, signal),
    refetchInterval: 10_000,
  })
  const advance = useMutation({
    mutationFn: () => advanceFullMockSession(sessionId),
    onSuccess: (session) =>
      queryClient.setQueryData(fullMockKeys.session(sessionId), session),
  })
  const finish = useMutation({
    mutationFn: () => finishFullMockSession(sessionId),
    onSuccess: (session) =>
      queryClient.setQueryData(fullMockKeys.session(sessionId), session),
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
    <div className="mx-auto grid w-full min-w-0 max-w-[980px] gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="secondary">
            Full Mock · {session.mockTest.examType}
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            {session.mockTest.title}
          </h1>
        </div>
        {session.status === 'IN_PROGRESS' ? (
          <ExamTimer deadlineAt={session.deadlineAt} />
        ) : null}
      </div>
      {session.status === 'SUBMITTED' ? (
        <FullMockReport session={session} />
      ) : (
        <>
          <p className="text-sm leading-6 text-[#69696d]">
            Секции идут строго по порядку. Вернуться к прошлой секции через эту
            сессию нельзя.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {session.sections.map((section) => (
              <SectionCard
                key={section.position}
                section={section}
                currentSection={session.currentSection}
                sessionId={session.id}
              />
            ))}
          </div>
          {current?.attempt.status === 'SUBMITTED' ? (
            <Card className="border-[#dbeafe] bg-[#eff6ff] shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <p className="text-sm font-medium">
                  {labels[current.skill]} сдан. Можно перейти дальше.
                </p>
                <Button
                  disabled={advance.isPending}
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
          <Card className="border-[#f1e2c7] bg-[#fffaf0] shadow-none">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <p className="text-sm text-[#69696d]">
                Можно завершить Full Mock сейчас. Пустые секции останутся без
                band и не попадут в общий результат.
              </p>
              <Button
                variant="outline"
                disabled={finish.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      'Завершить Full Mock с незаполненными секциями?',
                    )
                  ) {
                    finish.mutate()
                  }
                }}
              >
                {finish.isPending ? 'Завершаем…' : 'Завершить досрочно'}
              </Button>
            </CardContent>
          </Card>
          {advance.isError ? (
            <p className="text-sm text-[#e23b3b]">
              {getErrorMessage(advance.error)}
            </p>
          ) : null}
          {finish.isError ? (
            <p className="text-sm text-[#e23b3b]">
              {getErrorMessage(finish.error)}
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
  const isCurrent = section.position === currentSection
  const completed = section.attempt.status === 'SUBMITTED'
  const locked = section.position > currentSection
  return (
    <Card
      className={isCurrent ? 'border-[#93c5fd] shadow-none' : 'shadow-none'}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>
            0{section.position} · {labels[section.skill]}
          </CardTitle>
          {completed ? (
            <Badge className="bg-emerald-600">
              <TickCircle aria-hidden />
              Сдано
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
        {isCurrent && !completed ? (
          <SectionLink section={section} sessionId={sessionId} />
        ) : (
          <p className="text-sm text-[#69696d]">
            {completed
              ? 'Результат сохранён в сессии.'
              : 'Станет доступна после предыдущей секции.'}
          </p>
        )}
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
      Открыть секцию
    </>
  )
  return (
    <Button asChild>
      <Link
        to="/exam/full-mock-sessions/$sessionId/sections/$sectionPosition"
        params={{ sessionId, sectionPosition: String(section.position) }}
      >
        {content}
      </Link>
    </Button>
  )
}

function FullMockReport({ session }: { session: FullMockSession }) {
  return (
    <>
      <Card className="border-[#dbeafe] bg-[#eff6ff] shadow-none">
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <span className="grid size-14 place-items-center rounded-full bg-[#3b82f6] text-2xl font-semibold text-white">
            {session.overallBand?.toFixed(1) ?? '—'}
          </span>
          <div>
            <p className="font-semibold">Итоговый IELTS band</p>
            <p className="mt-1 text-sm text-[#4b5563]">
              Среднее значение четырёх навыков, округлённое до 0,5.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {session.sections.map((section) => (
          <Card key={section.position} className="shadow-none">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold">{labels[section.skill]}</p>
                <Link
                  to="/dashboard/attempts/$attemptId"
                  params={{ attemptId: section.attempt.id }}
                  className="mt-1 inline-flex items-center gap-1 text-sm text-[#2563eb] hover:underline"
                >
                  Разбор попытки <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <span className="text-2xl font-semibold text-[#3b82f6]">
                {section.attempt.band?.toFixed(1) ?? '—'}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
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
