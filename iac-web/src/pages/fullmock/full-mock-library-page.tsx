import { Clock, PlayCircle } from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState, ExamLoadingScreen } from '@/features/attempts/attempt-ui'
import { useAuth } from '@/features/auth/auth-store'
import {
  fullMockKeys,
  getFullMockOverview,
  startGeneratedFullMock,
} from '@/features/fullmock/api'
import type { FullMockSkill } from '@/features/fullmock/api'
import { getErrorMessage } from '@/lib/api/client'

const labels: Record<FullMockSkill, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

export function FullMockLibraryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: fullMockKeys.overview(user?.id, user?.examType),
    queryFn: ({ signal }) => getFullMockOverview(signal),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const start = useMutation({
    mutationFn: (restart: boolean) => startGeneratedFullMock(restart),
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ['full-mock-overview'] })
      queryClient.setQueryData(fullMockKeys.session(session.id), session)
      return navigate({
        to: '/exam/full-mock-sessions/$sessionId',
        params: { sessionId: session.id },
      })
    },
    onError: () => void query.refetch(),
  })

  if (query.isPending) {
    return (
      <ExamLoadingScreen
        badge="IELTS Full Mock"
        label="Проверяем доступные тесты…"
        description="Учитываем уже выполненные задания, чтобы подобрать новые."
        showTimerTip={false}
      />
    )
  }
  if (query.isError) {
    return (
      <ErrorState
        title="Не удалось подготовить Full Mock"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  }
  const overview = query.data
  const exhausted = overview.banks.filter((bank) => bank.isExhausted)
  const missing = overview.banks.filter((bank) => bank.total === 0)
  const active = overview.activeSession

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[960px] gap-6">
      <header>
        <Badge variant="secondary">
          Full Mock
          {overview.examType
            ? ` · ${overview.examType === 'academic' ? 'Academic' : 'General'}`
            : ''}
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Полный пробный IELTS
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69696d]">
          Мы автоматически подберём тесты из общей библиотеки. Сначала —
          задания, которые вы ещё не выполняли. Выбирать отдельный mock-тест не
          нужно.
        </p>
      </header>

      <Card className="gap-0 overflow-hidden rounded-2xl border-[#e7e7e4] bg-white py-0 shadow-none">
        <CardContent className="p-5 sm:p-7">
          <h2 className="text-lg font-semibold">
            Четыре секции в одной сессии
          </h2>
          <ol
            className="mt-5 grid gap-3 sm:grid-cols-4"
            aria-label="Порядок секций экзамена"
          >
            {overview.banks.map((bank, index) => (
              <li key={bank.skill} className="flex items-center gap-3 text-sm">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eff6ff] font-semibold text-[#2563eb]">
                  {index + 1}
                </span>
                {labels[bank.skill]}
              </li>
            ))}
          </ol>
          <p className="mt-5 flex items-center gap-2 text-sm text-[#69696d]">
            <Clock className="size-4" aria-hidden /> {overview.durationMinutes}{' '}
            минут · общий таймер
          </p>
          <p className="mt-2 text-sm leading-6 text-[#69696d]">
            После сдачи секции вы переходите к следующей. Ответы сохраняются, а
            после проверки всех четырёх секций появится общий Band Score.
          </p>
        </CardContent>
      </Card>

      {overview.examType ? (
        <section aria-labelledby="mock-bank-title">
          <h2 id="mock-bank-title" className="text-lg font-semibold">
            Ваш прогресс по доступным тестам
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#69696d]">
            Учитываются выполненные тесты и в практике, и в Full Mock. Повторные
            попытки не увеличивают счётчик.
          </p>
          <div className="mt-4 divide-y divide-[#e7e7e4] rounded-2xl border border-[#e7e7e4] bg-white px-5 sm:px-7">
            {overview.banks.map((bank) => (
              <div
                key={bank.skill}
                className="grid gap-2 py-4 sm:grid-cols-[110px_1fr_auto] sm:items-center sm:gap-5"
              >
                <h3 className="text-sm font-semibold">{labels[bank.skill]}</h3>
                <progress
                  aria-label={`${labels[bank.skill]}: выполнено тестов`}
                  max={Math.max(1, bank.total)}
                  value={bank.completed}
                  className="h-2 w-full appearance-none overflow-hidden rounded-full bg-[#e7e7e4] [&::-moz-progress-bar]:bg-[#2563eb] [&::-webkit-progress-bar]:bg-[#e7e7e4] [&::-webkit-progress-value]:bg-[#2563eb]"
                />
                <p className="text-sm text-[#69696d]">
                  {bank.completed} из {bank.total} выполнено
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div
          role="status"
          className="rounded-xl border border-[#e7e7e4] bg-white p-5 text-sm leading-6"
        >
          Выберите Academic или General в{' '}
          <Link
            to="/profile"
            className="font-semibold text-[#2563eb] underline"
          >
            профиле
          </Link>
          , чтобы мы подобрали подходящие тесты.
        </div>
      )}

      {exhausted.length > 0 ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"
        >
          <h2 className="font-semibold">
            В следующих mock-тестах будут повторы
          </h2>
          {exhausted.length === 4 ? (
            <p className="mt-1">
              Вы выполнили все доступные тесты. Full Mock будет собран из ранее
              выполненных заданий, выбранных случайно.
            </p>
          ) : (
            <p className="mt-1">
              Вы выполнили все доступные тесты по секциям:{' '}
              {exhausted
                .map(
                  (bank) =>
                    `${labels[bank.skill]} (${bank.completed} из ${bank.total})`,
                )
                .join(', ')}
              . В новых Full Mock эти секции будут выбраны случайно из ранее
              выполненных тестов. Для остальных секций сначала подберём
              непройденные задания.
            </p>
          )}
          {active ? (
            <p className="mt-1">Состав уже начатой сессии не изменится.</p>
          ) : null}
        </div>
      ) : null}

      {overview.examType && missing.length > 0 ? (
        <div
          role="status"
          className="rounded-xl border border-[#e7e7e4] bg-white p-5 text-sm leading-6"
        >
          Для нового Full Mock пока недостаточно полных опубликованных тестов:{' '}
          {missing.map((bank) => labels[bank.skill]).join(', ')}.{' '}
          {active
            ? 'Текущую сессию можно продолжить.'
            : 'Пока можно заниматься отдельными секциями в практике.'}
        </div>
      ) : null}

      <div className="grid gap-3">
        {start.isError ? (
          <p role="alert" className="text-sm text-[#e23b3b]">
            {getErrorMessage(start.error)}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          {active ? (
            <Button asChild disabled={start.isPending}>
              <Link
                to="/exam/full-mock-sessions/$sessionId"
                params={{ sessionId: active.id }}
              >
                <PlayCircle aria-hidden />
                Продолжить текущую сессию
              </Link>
            </Button>
          ) : (
            <Button
              disabled={!overview.ready || start.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Начать Full Mock? После запуска начнётся общий таймер: ${overview.durationMinutes} минут.`,
                  )
                )
                  start.mutate(false)
              }}
            >
              <PlayCircle aria-hidden />
              {start.isPending ? 'Готовим экзамен…' : 'Начать Full Mock'}
            </Button>
          )}
          {active ? (
            <Button
              variant="outline"
              disabled={!overview.ready || start.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    'Начать заново? Текущая сессия будет закрыта. Мы подберём новый набор тестов, таймер начнётся заново.',
                  )
                )
                  start.mutate(true)
              }}
            >
              {start.isPending ? 'Готовим экзамен…' : 'Начать заново'}
            </Button>
          ) : null}
          <Button asChild variant="ghost">
            <Link to="/practice">К отдельным секциям</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
