import { useState } from 'react'

import { FullMockSectionComplete } from '@/pages/fullmock/full-mock-section-complete'
import { AttemptResultHeader, ErrorState, LoadingState } from './attempt-ui'
import { MistakeRetryDialog } from './mistake-retry-dialog'
import { MistakeRow } from './mistake-list'
import { useAttemptDetail } from './use-attempt-detail'
import { withReviewMaterial } from './review-material'
import { mistakeCountLabel } from '@/pages/mistakes/model'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'
import type { AttemptDetail, AttemptReviewItem } from './api'
import type { ReviewMaterial } from './review-material'
import '@/lib/i18n-content'

export function ObjectiveAttemptReview({
  attempt,
  material,
  title,
  showHeading = true,
  showBand = false,
}: {
  attempt: AttemptDetail
  material?: ReviewMaterial | null
  title?: string
  showHeading?: boolean
  showBand?: boolean
}) {
  const { t, language } = useLanguage()
  const [selected, setSelected] = useState<AttemptReviewItem | null>(null)
  const review = attempt.review ?? []
  const mistakes = review
    .filter((item) => !item.isCorrect)
    .map((item) => withReviewMaterial(item, material))
  const skill = attempt.materialType === 'reading' ? 'Reading' : 'Listening'
  const selectedIndex = mistakes.findIndex(
    (item) => item.questionId === selected?.questionId,
  )
  const nextMistake =
    selectedIndex < 0
      ? undefined
      : mistakes
          .slice(selectedIndex + 1)
          .find((item) => !item.locked && Boolean(item.correctAnswer))
  return (
    <section className="grid min-w-0 gap-5">
      {showHeading ? (
        <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">
          {t('Работа над ошибками')}
        </h1>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {title ? (
            <h2 className="break-words text-base font-semibold">{title}</h2>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">
            {skill} · {mistakeCountLabel(mistakes.length, language)}
          </p>
        </div>
        {!showBand ? (
          <p className="shrink-0 text-sm text-muted-foreground">
            {t('Результат')}: {attempt.score ?? '—'}/{attempt.maxScore ?? '—'}
          </p>
        ) : attempt.band !== null ? (
          <p className="shrink-0 text-sm font-semibold text-primary">
            Band {attempt.band.toFixed(1)}
            <span className="ml-3 font-normal text-muted-foreground">
              {review.filter((item) => item.isCorrect).length}/{review.length}
            </span>
          </p>
        ) : null}
      </div>
      {mistakes.length ? (
        <section aria-label={t('Ошибки в ответах')} className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{t('Разбор ответов')}</h2>
            <span className="text-sm tabular-nums text-muted-foreground">
              {mistakeCountLabel(mistakes.length, language)} / {review.length}
            </span>
          </div>
          <div
            className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={t('Доля ошибок')}
            aria-valuenow={mistakes.length}
            aria-valuemin={0}
            aria-valuemax={review.length}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${review.length ? (mistakes.length / review.length) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="grid gap-3">
            {mistakes.map((item) => (
              <div
                key={item.questionId}
                data-testid={
                  attempt.guestPreview
                    ? `guest-mistake-${item.number}`
                    : undefined
                }
              >
                <MistakeRow
                  item={item}
                  attemptId={attempt.id}
                  guestPreview={Boolean(attempt.guestPreview)}
                  onRetry={() => setSelected(item)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="py-6 text-sm text-muted-foreground">{t('Нет ошибок')}</p>
      )}
      <MistakeRetryDialog
        item={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        testTitle={title}
        attemptId={attempt.id}
        materialType={attempt.materialType}
        onNext={nextMistake ? () => setSelected(nextMistake) : undefined}
      />
    </section>
  )
}

export function ObjectiveAttemptResult({
  attemptId,
  material,
  fullMockSessionId,
  onRetake,
  isRetaking,
}: {
  attemptId: string
  material: ReviewMaterial
  fullMockSessionId?: string
  onRetake?: () => void
  isRetaking?: boolean
}) {
  const { t } = useLanguage()
  const query = useAttemptDetail(attemptId)
  if (fullMockSessionId || query.data?.reviewLocked) {
    const sessionId = fullMockSessionId ?? query.data?.fullMockSessionId
    return sessionId ? <FullMockSectionComplete sessionId={sessionId} /> : null
  }
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5 p-3 sm:p-6 lg:p-8">
      <AttemptResultHeader
        skill={'parts' in material ? 'listening' : 'reading'}
        fullMockSessionId={fullMockSessionId}
        onRetake={onRetake}
        isRetaking={isRetaking}
      />
      {query.isError ? (
        <ErrorState
          title={t('Не удалось загрузить разбор')}
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <LoadingState label={t('Загрузка…')} />
      ) : (
        <ObjectiveAttemptReview
          key={attemptId}
          attempt={query.data}
          material={material}
          title={material.title}
        />
      )}
    </div>
  )
}
