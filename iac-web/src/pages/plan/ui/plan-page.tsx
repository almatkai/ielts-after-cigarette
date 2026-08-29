import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { getDashboard, queryKeys } from '@/features/ielts/api'
import type { SkillId } from '@/features/ielts/api'
import { getErrorMessage } from '@/lib/api/client'

const cardClassName = 'gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none'

const skillLabels: Record<SkillId, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

const skillLibraryLinks: Partial<
  Record<
    SkillId,
    { to: '/dashboard/listening' | '/dashboard/reading'; label: string }
  >
> = {
  listening: { to: '/dashboard/listening', label: 'Открыть тесты Listening' },
  reading: { to: '/dashboard/reading', label: 'Открыть материалы Reading' },
}

export function PlanPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
  })

  if (dashboardQuery.isPending) {
    return <LoadingState label="Собираем план…" />
  }
  if (dashboardQuery.isError) {
    return (
      <ErrorState
        title="Не удалось загрузить план"
        message={getErrorMessage(dashboardQuery.error)}
        onRetry={() => void dashboardQuery.refetch()}
      />
    )
  }

  const dashboard = dashboardQuery.data
  const { targetBand, examDate } = dashboard.profile
  const daysLeft = examDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${examDate}T00:00:00`).getTime() - Date.now()) / 86_400_000,
        ),
      )
    : null

  const assessed = dashboard.skillProgress.filter(
    (progress) =>
      progress.completedTasks > 0 && progress.estimatedBand !== null,
  )
  const weakest =
    assessed.length > 0
      ? assessed.reduce((min, progress) =>
          (progress.estimatedBand ?? 9) < (min.estimatedBand ?? 9)
            ? progress
            : min,
        )
      : null
  const weakestLink = weakest ? skillLibraryLinks[weakest.skill] : undefined

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111111]">
          Следуйте плану подготовки
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#69696d]">
          Ваша цель, самый слабый навык и рекомендуемые следующие шаги.
        </p>
      </div>

      {targetBand === null || examDate === null ? (
        <Card className={cardClassName}>
          <CardContent className="grid justify-items-center gap-3 p-10 text-center">
            <Target className="size-6 text-[#3b82f6]" aria-hidden />
            <p className="font-semibold">Цель ещё не задана</p>
            <p className="max-w-md text-sm text-[#69696d]">
              Укажите целевой балл и дату экзамена — тогда план покажет, сколько
              времени осталось и на чём сфокусироваться.
            </p>
            <Button asChild className="shadow-none">
              <Link to="/dashboard/settings">Задать цель в настройках</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className={cardClassName}>
          <CardHeader className="border-b border-[#ededeb] p-5">
            <CardTitle className="text-base tracking-[-0.02em]">
              Ваша цель
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#69696d]">
                Целевой балл
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#3b82f6]">
                {targetBand.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#69696d]">
                Дата экзамена
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatExamDate(examDate)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#69696d]">
                Осталось дней
              </p>
              <p className="mt-1 text-2xl font-semibold">{daysLeft}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={cardClassName}>
        <CardHeader className="border-b border-[#ededeb] p-5">
          <CardTitle className="text-base tracking-[-0.02em]">
            На чём сфокусироваться
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5">
          {weakest === null ? (
            <div className="rounded-[12px] border border-dashed border-[#deded9] bg-[#fafaf8] px-4 py-6 text-center">
              <p className="text-sm font-semibold text-[#111111]">
                Пройдите первый тест
              </p>
              <p className="mt-1 text-xs leading-5 text-[#808084]">
                Пока нет результатов — начните с Listening или Reading, и план
                покажет самый слабый навык.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button asChild variant="outline" className="shadow-none">
                  <Link to="/dashboard/listening">Listening</Link>
                </Button>
                <Button asChild variant="outline" className="shadow-none">
                  <Link to="/dashboard/reading">Reading</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm leading-6 text-[#69696d]">
                Самый слабый навык сейчас —{' '}
                <strong className="text-[#111111]">
                  {skillLabels[weakest.skill]}
                </strong>{' '}
                (band {weakest.estimatedBand?.toFixed(1) ?? '—'}
                {targetBand !== null && weakest.estimatedBand !== null
                  ? weakest.estimatedBand >= targetBand
                    ? ', цель уже достигнута — закрепите результат'
                    : `, до цели не хватает ${(targetBand - weakest.estimatedBand).toFixed(1)}`
                  : ''}
                ).
              </p>
              <ul className="grid gap-2 text-sm leading-6 text-[#69696d]">
                <li>
                  · Делайте хотя бы одну попытку {skillLabels[weakest.skill]} в
                  день и разбирайте каждую ошибку.
                </li>
                <li>
                  · Раз в неделю проходите тест целиком, чтобы отслеживать band
                  в разделе «Прогресс».
                </li>
                <li>
                  · Ошибки собираются автоматически — возвращайтесь к ним в
                  разделе «Ошибки».
                </li>
              </ul>
              <div className="flex flex-wrap gap-3">
                {weakestLink ? (
                  <Button asChild className="shadow-none">
                    <Link to={weakestLink.to}>
                      {weakestLink.label}
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-[#69696d]">
                    Тренажёр для {skillLabels[weakest.skill]} скоро появится, а
                    пока потренируйте Listening или Reading.
                  </p>
                )}
                <Button asChild variant="outline" className="shadow-none">
                  <Link to="/dashboard/mistakes">Разобрать ошибки</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatExamDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}
