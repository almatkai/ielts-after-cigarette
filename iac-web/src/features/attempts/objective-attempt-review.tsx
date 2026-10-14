import { useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { FullMockSectionComplete } from '@/pages/fullmock/full-mock-section-complete'
import { AttemptResultHeader, ErrorState, LoadingState } from './attempt-ui'
import { MistakeRetryDialog } from './mistake-retry-dialog'
import { MistakeRow } from './mistake-list'
import { useAttemptDetail } from './use-attempt-detail'
import { withReviewMaterial } from './review-material'
import { mistakeCountLabel } from '@/pages/mistakes/model'
import { getErrorMessage } from '@/lib/api/client'
import type { AttemptDetail, AttemptReviewItem } from './api'
import type { ReviewMaterial } from './review-material'

export function ObjectiveAttemptReview({
  attempt,
  material,
  title,
  showHeading = true,
}: {
  attempt: AttemptDetail
  material?: ReviewMaterial | null
  title?: string
  showHeading?: boolean
}) {
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
        <h1 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          Работа над ошибками
        </h1>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {title ? (
            <h2 className="break-words text-lg font-semibold tracking-[-0.02em]">
              {title}
            </h2>
          ) : null}
          <p className="mt-1 text-sm text-[#69696d]">
            {skill} · {mistakeCountLabel(mistakes.length)}
          </p>
        </div>
        {attempt.band !== null ? (
          <p className="shrink-0 text-sm font-semibold text-[#3b82f6]">
            Band {attempt.band.toFixed(1)}
            <span className="ml-3 font-normal text-[#69696d]">
              {review.filter((item) => item.isCorrect).length}/{review.length}
            </span>
          </p>
        ) : null}
      </div>
      {mistakes.length ? (
        <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
          <CardContent className="grid gap-3 p-4 sm:p-5">
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
          </CardContent>
        </Card>
      ) : (
        <p className="py-6 text-sm text-[#69696d]">Нет ошибок</p>
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
          title="Не удалось загрузить разбор"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <LoadingState label="Загрузка…" />
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
