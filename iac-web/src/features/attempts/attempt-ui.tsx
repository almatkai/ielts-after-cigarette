import {
  Clock,
  CloseCircle,
  TickCircle,
} from 'iconsax-react'

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
  badge = 'IELTS Simulation',
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
        {/* Subtle section badge */}
        {badge ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 mb-4 tracking-wide">
            <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
            {badge}
          </div>
        ) : null}

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
