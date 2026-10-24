import {
  ArrowLeft,
  Clock,
  CloseCircle,
  InfoCircle,
  Refresh2,
  TickCircle,
} from 'iconsax-react'
import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { tr } from '@/lib/i18n'
import type { SaveState } from '@/features/attempts/attempt-session'
import type {
  Attempt,
  AttemptReviewItem,
  StudentAnswer,
} from '@/features/attempts/api'

export type Option = { id: string; text: string }
export { EmptyState, type EmptyStateProps } from '@/components/ui/empty-state'

export function ExamLoadingScreen({
  label,
  description,
  badge: _badge,
  showTimerTip = true,
  className = '',
}: {
  label: string
  description?: string
  badge?: string
  showTimerTip?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-[75vh] sm:min-h-[85vh] w-full flex-1 flex-col items-center justify-center p-6 text-center select-none',
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        {/* Sleek Minimalist Spinner */}
        <div className="relative mb-4 flex size-10 items-center justify-center">
          <svg
            className="size-8 animate-spin text-primary"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-15"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          {label}
        </h2>

        {/* Subtitle */}
        {description ? (
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground max-w-[320px]">
            {description}
          </p>
        ) : null}

        {/* Minimalist Progress Line */}
        <div className="relative mt-5 h-1 w-36 sm:w-44 overflow-hidden rounded-full bg-muted">
          <div className="animate-exam-loading-bar h-full w-full rounded-full bg-primary" />
        </div>

        {/* Discreet Timer Tip */}
        {showTimerTip ? (
          <p className="mt-5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Clock
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span>The timer starts once everything has loaded</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function LibraryCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-3 md:grid-cols-2"
      aria-busy="true"
      aria-label="Loading the test list"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="rounded-[10px] border border-border bg-card shadow-none"
        >
          <CardContent className="grid gap-3 p-5 sm:p-6">
            <div className="size-10 animate-pulse rounded-[10px] bg-muted" />
            <div className="space-y-2">
              <div className="h-5 w-3/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-10 w-28 animate-pulse rounded-[9px] bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function LoadingState({
  label,
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-[140px] w-full flex-col items-center justify-center gap-3 p-6 text-center',
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <svg
          className="keep-motion size-5 animate-spin text-primary"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {label ? (
        <p className="text-sm font-medium text-muted-foreground">{tr(label)}</p>
      ) : null}
    </div>
  )
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex min-h-[60dvh] w-full flex-1 items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-[460px] rounded-xl border border-border bg-card p-7 text-center shadow-none sm:p-9">
        <CardContent className="grid justify-items-center gap-4 p-0 text-center">
          <div className="flex size-14 items-center justify-center rounded-xl border border-destructive-soft bg-destructive-soft text-destructive">
            <CloseCircle className="size-7" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {tr(title)}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tr(message)}
          </p>
          <Button onClick={onRetry} className="mt-2 w-full sm:w-auto">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  const text =
    state === 'saving'
      ? 'Saving…'
      : state === 'saved'
        ? 'Draft saved'
        : 'Saving failed'
  return (
    <span
      className={`text-xs ${state === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
      role="status"
    >
      {text}
    </span>
  )
}

export function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

export function TimeBadge({
  seconds,
  danger = false,
  label,
}: {
  seconds: number
  danger?: boolean
  label: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium tabular-nums ${
        danger
          ? 'border-destructive-soft bg-destructive-soft text-destructive'
          : 'bg-card'
      }`}
      aria-label={tr(label)}
    >
      <Clock className="size-4" aria-hidden />
      {formatClock(seconds)}
    </span>
  )
}

// Сколько вариантов можно выбрать: сначала структурные подсказки из
// content/config, затем формулировки вида "Choose TWO letters" в инструкции.
const multiSelectWords: Record<string, number> = {
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
}

export function multiSelectLimit(
  instructions: string,
  sources: Record<string, unknown>[],
) {
  for (const source of sources) {
    const raw = source.selectionLimit ?? source.maxAnswers ?? source.selectCount
    if (typeof raw === 'number' && raw > 1) return raw
  }
  const match = /\b(two|three|four|five|six)\s+letters/i.exec(instructions)
  if (!match) return null
  return multiSelectWords[match[1].toLowerCase()] ?? null
}

// Выбор вариантов: radio для одиночного ответа, checkbox для multi-select.
export function ChoiceOptions({
  name,
  options,
  limit,
  value,
  onAnswer,
}: {
  name: string
  options: Option[]
  limit: number | null
  value: StudentAnswer | undefined
  onAnswer: (answer: StudentAnswer) => void
}) {
  if (limit && limit > 1) {
    const selected = Array.isArray(value?.optionIds)
      ? (value.optionIds as unknown[]).filter(
          (id): id is string => typeof id === 'string',
        )
      : []
    return (
      <>
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer gap-2 rounded-lg border bg-card p-3 text-sm"
            >
              <input
                type="checkbox"
                name={name}
                value={option.id}
                checked={selected.includes(option.id)}
                onChange={() => {
                  const next = selected.includes(option.id)
                    ? selected.filter((id) => id !== option.id)
                    : selected.length < limit
                      ? [...selected, option.id]
                      : selected
                  const ordered = options
                    .map((item) => item.id)
                    .filter((id) => next.includes(id))
                  onAnswer({ optionIds: ordered })
                }}
              />
              <span>
                <strong>{option.id}.</strong> {option.text}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {`Choose up to ${limit} options: ${selected.length} of ${limit} selected.`}
        </p>
      </>
    )
  }

  const selectedId = typeof value?.optionId === 'string' ? value.optionId : null
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer gap-2 rounded-lg border bg-card p-3 text-sm"
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={selectedId === option.id}
            onChange={() => onAnswer({ optionId: option.id })}
          />
          <span>
            <strong>{option.id}.</strong> {option.text}
          </span>
        </label>
      ))}
    </div>
  )
}

// Подтверждение завершения попытки и отправка финальных ответов.
export function AttemptSubmitBar({
  answeredCount,
  totalQuestions,
  isSubmitting,
  disabled = false,
  disabledMessage,
  onSubmit,
  onContinueLater,
  isSavingAndExiting = false,
}: {
  answeredCount: number
  totalQuestions: number
  isSubmitting: boolean
  disabled?: boolean
  disabledMessage?: string
  onSubmit: () => void
  onContinueLater?: () => void
  isSavingAndExiting?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        {`${answeredCount} of ${totalQuestions} questions answered.`}
        {disabledMessage ? ` ${disabledMessage}` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        {onContinueLater ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isSavingAndExiting || disabled}
            onClick={onContinueLater}
            className="rounded-[10px] border-border text-foreground hover:bg-card"
          >
            {isSavingAndExiting ? 'Saving…' : 'Save and continue later'}
          </Button>
        ) : null}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isSubmitting || isSavingAndExiting || disabled}>
              {isSubmitting ? 'Submitting…' : 'Finish test'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finish this test?</AlertDialogTitle>
              <AlertDialogDescription>
                Your answers will be submitted and can’t be changed afterwards.
                Unanswered questions: {totalQuestions - answeredCount}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue</AlertDialogCancel>
              <AlertDialogAction onClick={onSubmit}>Finish</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export function AttemptResultSummary({
  attempt,
  review,
}: {
  attempt: Attempt
  review: AttemptReviewItem[] | null
}) {
  const correctCount = review
    ? review.filter((item) => item.isCorrect).length
    : null
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-6 p-6 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold normal-case text-muted-foreground">
            Band
          </p>
          <p className="font-display mt-1 text-5xl font-semibold tracking-normal text-primary">
            {attempt.band !== null ? attempt.band.toFixed(1) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold normal-case text-muted-foreground">
            Score
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {attempt.score ?? '—'} out of {attempt.maxScore ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold normal-case text-muted-foreground">
            Correct answers
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {correctCount !== null && review !== null
              ? `${correctCount} out of ${review.length}`
              : '—'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReviewQuestion({
  item,
  options,
}: {
  item: AttemptReviewItem
  options: Option[]
}) {
  return (
    <div className="grid gap-2 rounded-lg border p-3 text-sm">
      <p className="font-medium">
        <span className="mr-2 text-primary">{item.number}.</span>
        {item.prompt.replace('{{answer}}', '_____')}
      </p>
      <p className="flex items-center gap-2">
        {item.isCorrect ? (
          <TickCircle
            className="size-4 shrink-0 text-success"
            aria-label="Correct"
          />
        ) : (
          <CloseCircle
            className="size-4 shrink-0 text-primary"
            aria-label="Incorrect"
          />
        )}
        <span>
          Your answer: <strong>{formatAnswer(item.answer, options)}</strong>
        </span>
        <span className="text-muted-foreground">+{item.pointsAwarded} б.</span>
      </p>
      {!item.isCorrect ? (
        <p>
          Correct answer:{' '}
          <strong className="text-success">
            {formatAnswer(item.correctAnswer, options)}
          </strong>
        </p>
      ) : null}
      {item.explanation ? (
        <p className="whitespace-pre-wrap text-muted-foreground">
          {tr(item.explanation)}
        </p>
      ) : null}
    </div>
  )
}

export function formatAnswer(answer: StudentAnswer | null, options: Option[]) {
  if (!answer) return '—'
  if (typeof answer.optionId === 'string') {
    return formatOption(answer.optionId, options)
  }
  if (Array.isArray(answer.optionIds)) {
    const ids = (answer.optionIds as unknown[]).filter(
      (id): id is string => typeof id === 'string',
    )
    return ids.length > 0
      ? ids.map((id) => formatOption(id, options)).join(', ')
      : '—'
  }
  if (typeof answer.value === 'string' && answer.value.trim() !== '') {
    return answer.value.replaceAll('_', ' ')
  }
  if (Array.isArray(answer.accepted)) {
    const variants = (answer.accepted as unknown[]).filter(
      (item): item is string => typeof item === 'string',
    )
    if (variants.length > 0) return variants.join(' / ')
  }
  return '—'
}

function formatOption(id: string, options: Option[]) {
  const option = options.find((item) => item.id === id)
  return option ? `${id} — ${option.text}` : id
}

export function cefrLevel(band: number | null | undefined): string {
  if (band === null || band === undefined) return '—'
  if (band >= 8.5) return 'C2 (Proficient)'
  if (band >= 7.0) return 'C1 (Advanced)'
  if (band >= 5.5) return 'B2 (Independent)'
  if (band >= 4.0) return 'B1 (Intermediate)'
  return 'A2 / B1'
}

export function isQuestionAnswered(
  questionId?: string,
  answer?: StudentAnswer | null,
): boolean {
  if (!questionId || !answer) return false
  if (Array.isArray(answer.optionIds) && answer.optionIds.length > 0)
    return true
  if (typeof answer.optionId === 'string' && answer.optionId.trim() !== '')
    return true
  if (typeof answer.value === 'string' && answer.value.trim() !== '')
    return true
  return false
}

export function AttemptResultHeader({
  skill,
  fullMockSessionId,
  onRetake,
  isRetaking,
}: {
  skill: 'reading' | 'listening' | 'writing' | 'speaking'
  fullMockSessionId?: string
  onRetake?: () => void
  isRetaking?: boolean
}) {
  const skillBackLabels: Record<string, string> = {
    reading: 'Back to Reading',
    listening: 'Back to Listening',
    writing: 'Back to Writing',
    speaking: 'Back to Speaking',
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {fullMockSessionId ? (
            <Link
              to="/exam/full-mock-sessions/$sessionId"
              params={{ sessionId: fullMockSessionId }}
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span>Back to Full Mock</span>
            </Link>
          ) : (
            <Link to={`/${skill}`}>
              <ArrowLeft className="size-4" aria-hidden />
              <span>{skillBackLabels[skill] ?? 'Back'}</span>
            </Link>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {onRetake && (
          <Button
            size="sm"
            onClick={onRetake}
            disabled={isRetaking}
            className="gap-1.5 rounded-[10px] bg-primary text-primary-foreground hover:bg-primary shadow-none"
          >
            <Refresh2
              className={cn('size-3.5', isRetaking && 'animate-spin')}
            />
            <span>{isRetaking ? 'Preparing…' : 'Retake'}</span>
          </Button>
        )}

        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-[10px] border-border text-foreground hover:bg-card"
        >
          <Link to={`/${skill}`}>Back to tests</Link>
        </Button>
      </div>
    </header>
  )
}

export type PerformanceCriterion = {
  label: string
  band: number
  displayBand?: string
  unavailable?: boolean
}

export function AttemptPerformanceReport({
  band,
  bandNote,
  score,
  maxScore,
  correctCount,
  totalQuestions,
  criteria,
  startedAt,
  submittedAt,
  durationMinutes,
  paceUnit = 'question',
}: {
  band: number | null | undefined
  bandNote?: string
  score?: number | null
  maxScore?: number | null
  correctCount?: number | null
  totalQuestions?: number | null
  criteria?: readonly PerformanceCriterion[]
  startedAt?: string
  submittedAt?: string | null
  durationMinutes?: number
  paceUnit?: string
}) {
  const cefrDescription = cefrLevel(band)

  const timeSpentSeconds = useMemo(() => {
    if (!startedAt) return null
    const start = new Date(startedAt).getTime()
    const end = submittedAt ? new Date(submittedAt).getTime() : Date.now()
    const elapsedSec = Math.max(0, Math.round((end - start) / 1000))
    if (durationMinutes && durationMinutes > 0) {
      return Math.min(elapsedSec, durationMinutes * 60)
    }
    return elapsedSec
  }, [startedAt, submittedAt, durationMinutes])

  const isTimeOverLimit = useMemo(() => {
    if (!startedAt || !durationMinutes) return false
    const start = new Date(startedAt).getTime()
    const end = submittedAt ? new Date(submittedAt).getTime() : Date.now()
    const rawSec = Math.round((end - start) / 1000)
    return rawSec >= durationMinutes * 60
  }, [startedAt, submittedAt, durationMinutes])

  const timeSpentFormatted = useMemo(() => {
    if (timeSpentSeconds === null) return '—'
    const mins = Math.floor(timeSpentSeconds / 60)
    const secs = timeSpentSeconds % 60
    const secondsLabel = 'sec'
    const minutesLabel = 'min'
    if (mins === 0) return `${secs} ${secondsLabel}`
    return `${mins} ${minutesLabel} ${secs > 0 ? `${secs} ${secondsLabel}` : ''}`
  }, [timeSpentSeconds])

  const totalCount = totalQuestions ?? (criteria ? criteria.length : 0)

  const paceFormatted = useMemo(() => {
    if (timeSpentSeconds === null || !totalCount || totalCount <= 0) return null
    const paceSec = Math.round(timeSpentSeconds / totalCount)
    const m = Math.floor(paceSec / 60)
    const s = paceSec % 60
    const secondsLabel = 'sec'
    const minutesLabel = 'min'
    if (m === 0) return `${s} ${secondsLabel} / ${paceUnit}`
    return `${m} ${minutesLabel} ${s > 0 ? `${s} ${secondsLabel}` : ''} / ${paceUnit}`
  }, [timeSpentSeconds, totalCount, paceUnit])

  const effectiveTotal = totalQuestions ?? maxScore ?? 0
  const effectiveCorrect = correctCount ?? score ?? 0
  const scorePercent =
    effectiveTotal > 0
      ? Math.min(100, Math.round((effectiveCorrect / effectiveTotal) * 100))
      : 0
  const incorrectCount = Math.max(0, effectiveTotal - effectiveCorrect)

  return (
    <div className="rounded-[10px] border border-border bg-card p-5 sm:p-7 shadow-none">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border gap-0">
        {/* ЗОНА 1: IELTS Band Score */}
        <div className="pb-4 md:pb-0 md:pr-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold normal-case text-muted-foreground">
                IELTS Band Score
              </span>
              <span className="inline-flex items-center rounded-sm bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary border border-border-strong/80">
                {cefrDescription}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-5xl sm:text-6xl font-semibold tracking-normal text-primary">
                {band !== null && band !== undefined ? band.toFixed(1) : '—'}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                out of 9.0
              </span>
            </div>
          </div>
          {bandNote ? (
            <p className="mt-3 text-xs text-muted-foreground">{bandNote}</p>
          ) : null}
        </div>

        {/* ЗОНА 2: Точность и баллы / Критерии */}
        <div className="py-4 md:py-0 md:px-8 flex flex-col justify-between">
          {criteria && criteria.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold normal-case text-muted-foreground">
                  IELTS criteria
                </span>
                <span className="text-xs font-bold text-primary">
                  {criteria.filter((c) => !c.unavailable).length <
                  criteria.length
                    ? `${criteria.filter((c) => !c.unavailable).length} criteria`
                    : `${criteria.length} criteria`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {criteria.map((c) => (
                  <div
                    key={c.label}
                    className={`rounded-[10px] border p-2 text-center ${
                      c.unavailable
                        ? 'border-warning-bg bg-warning-bg/50'
                        : 'border-border bg-card/70'
                    }`}
                  >
                    <span
                      className="block text-[11px] font-medium text-muted-foreground truncate"
                      title={c.label}
                    >
                      {c.label}
                    </span>
                    {c.unavailable ? (
                      <span
                        className="block mt-1 text-[11px] font-semibold text-warning-fg truncate"
                        title="Not assessed by our system yet"
                      >
                        {c.displayBand ?? 'Not assessed'}
                      </span>
                    ) : (
                      <span className="text-base font-bold text-foreground">
                        {c.displayBand ?? c.band.toFixed(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold normal-case text-muted-foreground">
                    Accuracy and score
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {scorePercent}% accuracy
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl sm:text-5xl font-semibold text-foreground">
                    {effectiveCorrect}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    of {effectiveTotal} correct
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-success-bg px-2.5 py-1 text-xs font-semibold text-success border border-success-bg/60">
                    <TickCircle className="size-3.5 text-success" />
                    {effectiveCorrect} correct
                  </span>
                  {incorrectCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-destructive-soft px-2.5 py-1 text-xs font-semibold text-destructive border border-destructive-soft/60">
                      <CloseCircle className="size-3.5 text-destructive" />
                      {incorrectCount}{' '}
                      {incorrectCount === 1 ? 'mistake' : 'mistakes'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-success-bg px-2.5 py-1 text-xs font-semibold text-success border border-success-bg/60">
                      No mistakes
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ЗОНА 3: Время выполнения и темп */}
        <div className="pt-4 md:pt-0 md:pl-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold normal-case text-muted-foreground">
                Time taken
              </span>
              {durationMinutes ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5 text-muted-foreground" />
                  Limit: {durationMinutes} min
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
                {timeSpentFormatted}
              </span>
              {isTimeOverLimit && (
                <span className="inline-flex items-center rounded-sm bg-warning-bg px-2 py-0.5 text-[11px] font-semibold text-warning-fg border border-warning-bg/80">
                  Time limit reached
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Average pace:</span>
            <strong className="font-semibold text-foreground">
              {paceFormatted ?? '—'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EnhancedReviewQuestion({
  item,
  options,
}: {
  item: AttemptReviewItem
  options: Option[]
}) {
  const isAnswered = isQuestionAnswered(item.questionId, item.answer)
  const isCorrect = item.isCorrect

  return (
    <div
      id={`review-q-${item.questionId}`}
      className={cn(
        'rounded-[10px] border bg-card p-5 transition-all shadow-none space-y-3.5',
        isCorrect
          ? 'border-success-bg/80 hover:border-success'
          : 'border-destructive-soft/80 hover:border-destructive',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-[7px] bg-muted text-xs font-bold text-foreground">
            {item.number}
          </span>
          {isCorrect ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-success-bg px-2.5 py-0.5 text-xs font-semibold text-success border border-success-bg">
              <TickCircle className="size-3.5 text-success" />
              Correct (+{item.pointsAwarded} pts)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-destructive-soft px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive-soft">
              <CloseCircle className="size-3.5 text-destructive" />
              {isAnswered ? 'Mistake (0 pts)' : 'Unanswered (0 pts)'}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm font-medium text-foreground leading-relaxed">
        {item.prompt.replace('{{answer}}', '_____')}
      </p>

      {/* Сравнение ответов */}
      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <div
          className={cn(
            'rounded-[10px] border p-3',
            isCorrect
              ? 'border-success-bg bg-success-bg/50 text-success'
              : 'border-destructive-soft bg-destructive-soft/50 text-destructive',
          )}
        >
          <span className="block text-[11px] font-semibold normal-case text-muted-foreground mb-1">
            Your answer
          </span>
          <span
            className={cn(
              'font-semibold text-sm',
              !isCorrect && 'line-through text-destructive',
            )}
          >
            {formatAnswer(item.answer, options)}
          </span>
        </div>

        {!isCorrect && (
          <div className="rounded-[10px] border border-success-bg bg-success-bg/70 p-3 text-success">
            <span className="block text-[11px] font-semibold normal-case text-success mb-1">
              Correct answer
            </span>
            <span className="font-bold text-sm text-success">
              {formatAnswer(item.correctAnswer, options)}
            </span>
          </div>
        )}
      </div>

      {/* Объяснение (если есть в базе) */}
      {item.explanation ? (
        <div className="rounded-[10px] border border-border-strong bg-primary-soft p-3 text-xs leading-relaxed text-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-primary-hover mb-1">
            <InfoCircle className="size-3.5" />
            <span>Explanation and quote:</span>
          </div>
          <div className="whitespace-pre-wrap text-foreground">
            {tr(item.explanation)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
