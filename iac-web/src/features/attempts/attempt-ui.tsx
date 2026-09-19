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
            className="size-8 animate-spin text-blue-600"
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
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
          {label}
        </h2>

        {/* Subtitle */}
        {description ? (
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-500 max-w-[320px]">
            {description}
          </p>
        ) : null}

        {/* Minimalist Progress Line */}
        <div className="relative mt-5 h-1 w-36 sm:w-44 overflow-hidden rounded-full bg-slate-100">
          <div className="animate-exam-loading-bar h-full w-full rounded-full bg-blue-600" />
        </div>

        {/* Discreet Timer Tip */}
        {showTimerTip ? (
          <p className="mt-5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Clock className="size-3.5 text-slate-400" aria-hidden="true" />
            <span>Таймер запустится только после загрузки</span>
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
      aria-label="Загрузка списка тестов"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-[16px] border border-[#e7e7e4] bg-white shadow-[0_10px_36px_rgba(17,17,17,0.035)]">
          <CardContent className="grid gap-3 p-5 sm:p-6">
            <div className="size-10 animate-pulse rounded-[10px] bg-[#f1f5f9]" />
            <div className="space-y-2">
              <div className="h-5 w-3/5 animate-pulse rounded bg-[#f1f5f9]" />
              <div className="h-4 w-2/5 animate-pulse rounded bg-[#f1f5f9]" />
            </div>
            <div className="h-10 w-28 animate-pulse rounded-[9px] bg-[#f1f5f9]" />
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
      <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <svg
          className="keep-motion size-5 animate-spin text-blue-600"
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
      {label ? <p className="text-sm font-medium text-[#64748b]">{label}</p> : null}
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
      <Card className="w-full max-w-[460px] rounded-2xl border border-[#e2e8f0] bg-white p-7 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-9">
        <CardContent className="grid justify-items-center gap-4 p-0 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-[#e23b3b]">
            <CloseCircle className="size-7" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#0f172a]">{title}</h2>
          <p className="text-sm leading-relaxed text-[#64748b]">{message}</p>
          <Button onClick={onRetry} className="mt-2 w-full sm:w-auto">Повторить попытку</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  const text =
    state === 'saving'
      ? 'Сохраняется…'
      : state === 'saved'
        ? 'Черновик сохранён'
        : 'Не удалось сохранить'
  return (
    <span
      className={`text-xs ${state === 'error' ? 'text-[#e23b3b]' : 'text-[#69696d]'}`}
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
        danger ? 'border-red-200 bg-red-50 text-[#e23b3b]' : 'bg-white'
      }`}
      aria-label={label}
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
              className="flex cursor-pointer gap-2 rounded-lg border bg-white p-3 text-sm"
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
        <p className="text-xs text-[#69696d]">
          Выберите {limit} варианта: {selected.length} из {limit}.
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
          className="flex cursor-pointer gap-2 rounded-lg border bg-white p-3 text-sm"
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
}: {
  answeredCount: number
  totalQuestions: number
  isSubmitting: boolean
  disabled?: boolean
  disabledMessage?: string
  onSubmit: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4">
      <p className="text-sm text-[#69696d]">
        Отвечено на {answeredCount} из {totalQuestions} вопросов.
        {disabledMessage ? ` ${disabledMessage}` : ''}
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={isSubmitting || disabled}>
            {isSubmitting ? 'Отправляем…' : 'Завершить тест'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершить тест?</AlertDialogTitle>
            <AlertDialogDescription>
              Ответы будут отправлены на проверку, изменить их после завершения
              нельзя. Без ответа останется {totalQuestions - answeredCount}{' '}
              вопросов.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Продолжить</AlertDialogCancel>
            <AlertDialogAction onClick={onSubmit}>Завершить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#69696d]">
            Band
          </p>
          <p className="mt-1 text-5xl font-semibold tracking-[-0.04em] text-[#3b82f6]">
            {attempt.band !== null ? attempt.band.toFixed(1) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#69696d]">
            Баллы
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {attempt.score ?? '—'} из {attempt.maxScore ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#69696d]">
            Верных ответов
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {correctCount !== null && review !== null
              ? `${correctCount} из ${review.length}`
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
        <span className="mr-2 text-[#3b82f6]">{item.number}.</span>
        {item.prompt.replace('{{answer}}', '_____')}
      </p>
      <p className="flex items-center gap-2">
        {item.isCorrect ? (
          <TickCircle
            className="size-4 shrink-0 text-emerald-600"
            aria-label="Верно"
          />
        ) : (
          <CloseCircle
            className="size-4 shrink-0 text-[#3b82f6]"
            aria-label="Неверно"
          />
        )}
        <span>
          Ваш ответ: <strong>{formatAnswer(item.answer, options)}</strong>
        </span>
        <span className="text-[#69696d]">+{item.pointsAwarded} б.</span>
      </p>
      {!item.isCorrect ? (
        <p>
          Правильный ответ:{' '}
          <strong className="text-emerald-700">
            {formatAnswer(item.correctAnswer, options)}
          </strong>
        </p>
      ) : null}
      {item.explanation ? (
        <p className="whitespace-pre-wrap text-[#69696d]">{item.explanation}</p>
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
  if (Array.isArray(answer.optionIds) && answer.optionIds.length > 0) return true
  if (typeof answer.optionId === 'string' && answer.optionId.trim() !== '') return true
  if (typeof answer.value === 'string' && answer.value.trim() !== '') return true
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
    reading: 'К материалам Reading',
    listening: 'К материалам Listening',
    writing: 'К материалам Writing',
    speaking: 'К материалам Speaking',
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 rounded-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          {fullMockSessionId ? (
            <Link
              to="/exam/full-mock-sessions/$sessionId"
              params={{ sessionId: fullMockSessionId }}
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span>К Full Mock</span>
            </Link>
          ) : (
            <Link to={`/dashboard/${skill}`}>
              <ArrowLeft className="size-4" aria-hidden />
              <span>{skillBackLabels[skill] ?? 'Назад'}</span>
            </Link>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2.5">
        {onRetake && (
          <Button
            size="sm"
            onClick={onRetake}
            disabled={isRetaking}
            className="gap-1.5 rounded-[10px] bg-[#3b82f6] text-white hover:bg-blue-600 shadow-xs"
          >
            <Refresh2 className={cn('size-3.5', isRetaking && 'animate-spin')} />
            <span>{isRetaking ? 'Подготовка…' : 'Пройти заново'}</span>
          </Button>
        )}

        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-[10px] border-[#e7e7e4] text-slate-700 hover:bg-slate-50"
        >
          <Link to={`/dashboard/${skill}`}>К списку тестов</Link>
        </Button>
      </div>
    </header>
  )
}

export type PerformanceCriterion = {
  label: string
  band: number
}

export function AttemptPerformanceReport({
  band,
  bandNote = 'Балл рассчитан по стандарту академического IELTS',
  score,
  maxScore,
  correctCount,
  totalQuestions,
  criteria,
  startedAt,
  submittedAt,
  durationMinutes,
  paceUnit = 'вопрос',
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
    if (mins === 0) return `${secs} сек`
    return `${mins} мин ${secs > 0 ? `${secs} сек` : ''}`
  }, [timeSpentSeconds])

  const totalCount = totalQuestions ?? (criteria ? criteria.length : 0)

  const paceFormatted = useMemo(() => {
    if (timeSpentSeconds === null || !totalCount || totalCount <= 0) return null
    const paceSec = Math.round(timeSpentSeconds / totalCount)
    const m = Math.floor(paceSec / 60)
    const s = paceSec % 60
    if (m === 0) return `${s} сек / ${paceUnit}`
    return `${m} мин ${s > 0 ? `${s} сек` : ''} / ${paceUnit}`
  }, [timeSpentSeconds, totalCount, paceUnit])

  const effectiveTotal = totalQuestions ?? maxScore ?? 0
  const effectiveCorrect = correctCount ?? score ?? 0
  const scorePercent =
    effectiveTotal > 0
      ? Math.min(100, Math.round((effectiveCorrect / effectiveTotal) * 100))
      : 0
  const incorrectCount = Math.max(0, effectiveTotal - effectiveCorrect)

  return (
    <div className="rounded-[20px] border border-[#e7e7e4] bg-white p-6 sm:p-7 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-6 md:gap-0">
        {/* ЗОНА 1: IELTS Band Score */}
        <div className="md:pr-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                IELTS Band Score
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#3b82f6] border border-blue-100/80">
                {cefrDescription}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#3b82f6]">
                {band !== null && band !== undefined ? band.toFixed(1) : '—'}
              </span>
              <span className="text-sm font-semibold text-slate-400">из 9.0</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">{bandNote}</p>
        </div>

        {/* ЗОНА 2: Точность и баллы / Критерии */}
        <div className="md:px-8 flex flex-col justify-between pt-6 md:pt-0">
          {criteria && criteria.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Критерии IELTS
                </span>
                <span className="text-xs font-bold text-[#3b82f6]">
                  {criteria.length} критерия
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {criteria.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-[10px] border border-slate-100 bg-slate-50/70 p-2 text-center"
                  >
                    <span className="block text-[11px] font-medium text-slate-500 truncate" title={c.label}>
                      {c.label}
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {c.band.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Точность и баллы
                  </span>
                  <span className="text-xs font-bold text-[#3b82f6]">
                    {scorePercent}% точности
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold text-slate-900">
                    {effectiveCorrect}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    из {effectiveTotal} правильных
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#3b82f6] transition-all duration-500"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                    <TickCircle className="size-3.5 text-emerald-600" />
                    {effectiveCorrect} верно
                  </span>
                  {incorrectCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200/60">
                      <CloseCircle className="size-3.5 text-rose-600" />
                      {incorrectCount} {incorrectCount === 1 ? 'ошибка' : 'ошибок'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                      Без ошибок
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ЗОНА 3: Время выполнения и темп */}
        <div className="md:pl-8 flex flex-col justify-between pt-6 md:pt-0">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Время выполнения
              </span>
              {durationMinutes ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="size-3.5 text-slate-400" />
                  Лимит: {durationMinutes} мин
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900">
                {timeSpentFormatted}
              </span>
              {isTimeOverLimit && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200/80">
                  Лимит исчерпан
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Средний темп:</span>
            <strong className="font-semibold text-slate-700">
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
        'rounded-[14px] border bg-white p-5 transition-all shadow-2xs space-y-3.5',
        isCorrect
          ? 'border-emerald-200/80 hover:border-emerald-300'
          : 'border-rose-200/80 hover:border-rose-300',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-[7px] bg-slate-100 text-xs font-bold text-slate-800">
            {item.number}
          </span>
          {isCorrect ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <TickCircle className="size-3.5 text-emerald-600" />
              Верно (+{item.pointsAwarded} б.)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
              <CloseCircle className="size-3.5 text-rose-600" />
              {isAnswered ? 'Ошибка (0 б.)' : 'Не отвечено (0 б.)'}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm font-medium text-slate-800 leading-relaxed">
        {item.prompt.replace('{{answer}}', '_____')}
      </p>

      {/* Сравнение ответов */}
      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <div
          className={cn(
            'rounded-[10px] border p-3',
            isCorrect
              ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
              : 'border-rose-200 bg-rose-50/50 text-rose-950',
          )}
        >
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Ваш ответ
          </span>
          <span
            className={cn(
              'font-semibold text-sm',
              !isCorrect && 'line-through text-rose-800',
            )}
          >
            {formatAnswer(item.answer, options)}
          </span>
        </div>

        {!isCorrect && (
          <div className="rounded-[10px] border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-950">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-1">
              Правильный ответ
            </span>
            <span className="font-bold text-sm text-emerald-900">
              {formatAnswer(item.correctAnswer, options)}
            </span>
          </div>
        )}
      </div>

      {/* Объяснение (если есть в базе) */}
      {item.explanation ? (
        <div className="rounded-[10px] border border-blue-100 bg-[#f0f7ff] p-3 text-xs leading-relaxed text-slate-700">
          <div className="flex items-center gap-1.5 font-semibold text-[#2563eb] mb-1">
            <InfoCircle className="size-3.5" />
            <span>Разбор и цитата:</span>
          </div>
          <div className="whitespace-pre-wrap text-slate-700">
            {item.explanation}
          </div>
        </div>
      ) : null}
    </div>
  )
}
