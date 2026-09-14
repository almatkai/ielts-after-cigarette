import {
  ArrowRight,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { attemptKeys, listAttempts } from '@/features/attempts/api'
import type { AttemptListItem } from '@/features/attempts/api'
import { getDashboard, queryKeys } from '@/features/ielts/api'
import type { SkillId } from '@/features/ielts/api'
import { getErrorMessage } from '@/lib/api/client'

import { formatDateTime } from '@/pages/attempts/attempt-review-page'

const skillLabels: Record<SkillId, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

const cardClassName = 'gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none'

export function ProgressPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
  })
  const attemptsQuery = useQuery({
    queryKey: attemptKeys.listAll,
    queryFn: ({ signal }) => listAttempts(undefined, signal),
  })

  if (dashboardQuery.isPending) {
    return <LoadingState label="Загружаем прогресс…" />
  }
  if (dashboardQuery.isError) {
    return (
      <ErrorState
        title="Не удалось загрузить прогресс"
        message={getErrorMessage(dashboardQuery.error)}
        onRetry={() => void dashboardQuery.refetch()}
      />
    )
  }

  const dashboard = dashboardQuery.data
  const attemptsPending = attemptsQuery.isPending
  const attemptsError = attemptsQuery.error
  const attempts = [...(attemptsQuery.data?.items ?? [])].sort(bySubmittedAtDesc)

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111111]">
          Отслеживайте свою динамику
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#69696d]">
          Band-оценки по навыкам и история всех попыток с разборами.
        </p>
      </div>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-[#ededeb] p-5">
          <CardTitle className="text-base tracking-[-0.02em]">
            Уровень по навыкам
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {dashboard.skillProgress.map((progress) => (
            <div
              key={progress.skill}
              className="rounded-[12px] border border-[#ededeb] bg-[#fafaf8] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#111111]">
                  {skillLabels[progress.skill]}
                </p>
                <span className="text-sm font-semibold text-[#3b82f6]">
                  {progress.estimatedBand === null
                    ? '—'
                    : progress.estimatedBand.toFixed(1)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#808084]">
                {progress.completedTasks === 0
                  ? 'Нет выполненных заданий'
                  : `${progress.completedTasks} заданий · точность ${progress.accuracyPercent ?? 0}%`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-[#ededeb] p-5">
          <CardTitle className="text-base tracking-[-0.02em]">
            История попыток
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-5">
          {attemptsPending ? (
            <LoadingState label="Загружаем историю попыток…" />
          ) : attemptsError ? (
            <ErrorState
              title="Не удалось загрузить историю"
              message={getErrorMessage(attemptsError)}
              onRetry={() => {
                void attemptsQuery.refetch()
              }}
            />
          ) : attempts.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#deded9] bg-[#fafaf8] px-4 py-8 text-center">
              <p className="text-sm font-semibold text-[#111111]">
                Попыток пока нет
              </p>
              <p className="mt-1 text-xs leading-5 text-[#808084]">
                Пройдите первый тест в разделе Listening или Reading.
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
            attempts.map((item) => <AttemptRow key={item.id} item={item} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AttemptRow({ item }: { item: AttemptListItem }) {
  const submitted = item.status === 'SUBMITTED'
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#ededeb] bg-white p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#111111]">
          {item.testTitle}
        </p>
        <p className="mt-1 text-xs text-[#808084]">
          {skillLabel(item.materialType)} ·{' '}
          {formatDateTime(item.submittedAt ?? item.startedAt)}
          {submitted ? '' : ' · не завершена'}
        </p>
      </div>
      {submitted ? (
        <p className="text-sm text-[#69696d]">
          <span className="font-semibold text-[#111111]">
            {item.score ?? '—'}/{item.maxScore ?? '—'}
          </span>
          {' · band '}
          <span className="font-semibold text-[#3b82f6]">
            {item.band !== null ? item.band.toFixed(1) : '—'}
          </span>
        </p>
      ) : null}
      {submitted ? (
        <Button asChild variant="outline" size="sm" className="shadow-none">
          <Link
            to="/dashboard/attempts/$attemptId"
            params={{ attemptId: item.id }}
          >
            Разбор
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      ) : item.materialType === 'listening' ? (
        <Button asChild variant="outline" size="sm" className="shadow-none">
          <Link
            to="/exam/listening/$testId"
            params={{ testId: item.materialId }}
          >
            Продолжить
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      ) : item.materialType === 'reading' ? (
        <Button asChild variant="outline" size="sm" className="shadow-none">
          <Link
            to="/exam/reading/$materialId"
            params={{ materialId: item.materialId }}
          >
            Продолжить
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      ) : item.materialType === 'writing' ? (
        <Button asChild variant="outline" size="sm" className="shadow-none">
          <Link
            to="/exam/writing/$materialId"
            params={{ materialId: item.materialId }}
          >
            Продолжить
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm" className="shadow-none">
          <Link
            to="/exam/speaking/$materialId"
            params={{ materialId: item.materialId }}
          >
            Продолжить
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      )}
    </div>
  )
}

function skillLabel(materialType: AttemptListItem['materialType']) {
  return materialType === 'listening'
    ? 'Listening'
    : materialType === 'reading'
      ? 'Reading'
      : materialType === 'writing'
        ? 'Writing'
        : 'Speaking'
}

function bySubmittedAtDesc(a: AttemptListItem, b: AttemptListItem) {
  const aTime = new Date(a.submittedAt ?? a.startedAt).getTime()
  const bTime = new Date(b.submittedAt ?? b.startedAt).getTime()
  return bTime - aTime
}
