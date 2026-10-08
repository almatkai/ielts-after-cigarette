import { ArrowRight } from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { useAttemptHistory } from '@/features/attempts/use-attempt-history'
import type { AttemptListItem } from '@/features/attempts/api'
import { getDashboard, queryKeys } from '@/features/ielts/api'
import type { SkillId } from '@/features/ielts/api'
import { getErrorMessage } from '@/lib/api/client'

import { formatDateTime } from '@/lib/date'

const skillLabels: Record<SkillId, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

const cardClassName = 'gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none min-w-0 max-w-full overflow-hidden'

export function ProgressPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
  })
  const attemptsQuery = useAttemptHistory()
  const moreRef = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = attemptsQuery
  const attempts = useMemo(
    () => attemptsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [attemptsQuery.data],
  )
  useEffect(() => {
    if (
      !hasNextPage ||
      isFetchingNextPage ||
      attemptsQuery.isFetchNextPageError ||
      !moreRef.current
    )
      return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage()
      },
      { rootMargin: '600px' },
    )
    observer.observe(moreRef.current)
    return () => observer.disconnect()
  }, [
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    attemptsQuery.isFetchNextPageError,
    dashboardQuery.isPending,
  ])

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
  const attemptsError = attemptsQuery.isFetchNextPageError
    ? null
    : attemptsQuery.error

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-3.5 sm:gap-5">
      <div>
        <h2 className="text-base sm:text-lg font-semibold tracking-[-0.025em] text-[#111111]">
          Отслеживайте свою динамику
        </h2>
      </div>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-[#ededeb] p-3.5 sm:p-5">
          <CardTitle className="text-sm sm:text-base tracking-[-0.02em]">
            Уровень по навыкам
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2.5 sm:gap-3 p-3 sm:p-5 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
          {dashboard.skillProgress.map((progress) => (
            <div
              key={progress.skill}
              className="min-w-0 rounded-[10px] sm:rounded-[12px] border border-[#ededeb] bg-[#fafaf8] p-3 sm:p-4"
            >
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <p className="truncate text-xs sm:text-sm font-semibold text-[#111111]">
                  {skillLabels[progress.skill]}
                </p>
                <span className="shrink-0 text-xs sm:text-sm font-semibold text-[#3b82f6]">
                  {progress.estimatedBand === null
                    ? '—'
                    : progress.estimatedBand.toFixed(1)}
                </span>
              </div>
              <p className="mt-1 sm:mt-2 truncate text-[11px] sm:text-xs leading-4 sm:leading-5 text-[#808084]">
                {progress.completedTasks === 0
                  ? 'Нет выполненных заданий'
                  : `${progress.completedTasks} заданий · точность ${progress.accuracyPercent ?? 0}%`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-[#ededeb] p-3.5 sm:p-5">
          <CardTitle className="text-sm sm:text-base tracking-[-0.02em]">
            История попыток
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2.5 sm:gap-3 p-3 sm:p-5 min-w-0">
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
                  <Link to="/listening">Listening</Link>
                </Button>
                <Button asChild variant="outline" className="shadow-none">
                  <Link to="/reading">Reading</Link>
                </Button>
              </div>
            </div>
          ) : (
            attempts.map((item) => <AttemptRow key={item.id} item={item} />)
          )}
          {hasNextPage ? (
            <div ref={moreRef} className="flex justify-center">
              <Button
                variant="outline"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage
                  ? 'Загружаем историю…'
                  : attemptsQuery.isFetchNextPageError
                    ? 'Повторить загрузку истории'
                    : 'Показать ещё'}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function AttemptRow({ item }: { item: AttemptListItem }) {
  const submitted = item.status === 'SUBMITTED'
  const processing = item.status === 'PROCESSING'
  return (
    <div className="flex flex-col gap-2 rounded-[10px] sm:rounded-[12px] border border-[#ededeb] bg-white p-3 sm:p-4 min-w-0 w-full sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-sm font-semibold text-[#111111]" title={item.testTitle}>
          {item.testTitle}
        </p>
        <p className="mt-0.5 sm:mt-1 truncate text-[11px] sm:text-xs text-[#808084]">
          {skillLabel(item.materialType)} ·{' '}
          {formatDateTime(item.submittedAt ?? item.startedAt)}
          {submitted
            ? ''
            : processing
              ? ' · на проверке ИИ'
              : ' · не завершена'}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 shrink-0 sm:justify-end">
        {processing ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#3b82f6]">
            <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Проверяется
          </span>
        ) : null}
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
        {submitted || processing ? (
          <Button asChild variant="outline" size="sm" className="shadow-none shrink-0">
            <Link to="/attempts/$attemptId" params={{ attemptId: item.id }}>
              {processing ? 'Статус' : 'Разбор'}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : item.materialType === 'listening' ? (
          <Button asChild variant="outline" size="sm" className="shadow-none shrink-0">
            <Link
              to="/exam/listening/$testId"
              params={{ testId: item.materialId }}
            >
              Продолжить
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : item.materialType === 'reading' ? (
          <Button asChild variant="outline" size="sm" className="shadow-none shrink-0">
            <Link
              to="/exam/reading/$materialId"
              params={{ materialId: item.materialId }}
            >
              Продолжить
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : item.materialType === 'writing' ? (
          <Button asChild variant="outline" size="sm" className="shadow-none shrink-0">
            <Link
              to="/exam/writing/$materialId"
              params={{ materialId: item.materialId }}
            >
              Продолжить
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="shadow-none shrink-0">
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
