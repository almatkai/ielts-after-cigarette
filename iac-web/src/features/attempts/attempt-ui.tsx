import { CheckCircle2, Clock3, XCircle } from 'lucide-react'

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
import type { SaveState } from '@/features/attempts/attempt-session'
import type {
  Attempt,
  AttemptReviewItem,
  StudentAnswer,
} from '@/features/attempts/api'

export type Option = { id: string; text: string }

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="grid gap-4" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-[#f0f0ed]" />
      <div className="h-40 animate-pulse rounded-xl bg-[#f0f0ed]" />
      <div className="h-40 animate-pulse rounded-xl bg-[#f0f0ed]" />
      <p className="text-sm text-[#69696d]">{label}</p>
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
    <Card className="shadow-none">
      <CardContent className="grid justify-items-center gap-3 p-10 text-center">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-[#69696d]">{message}</p>
        <Button onClick={onRetry}>Повторить</Button>
      </CardContent>
    </Card>
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
      <Clock3 className="size-4" aria-hidden />
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
    const raw = source.maxAnswers ?? source.selectCount
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

  const selectedId =
    typeof value?.optionId === 'string' ? value.optionId : null
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
  onSubmit,
}: {
  answeredCount: number
  totalQuestions: number
  isSubmitting: boolean
  onSubmit: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4">
      <p className="text-sm text-[#69696d]">
        Отвечено на {answeredCount} из {totalQuestions} вопросов.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={isSubmitting}>
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
          <p className="mt-1 text-5xl font-semibold tracking-[-0.04em] text-[#e23b3b]">
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
        <span className="mr-2 text-[#e23b3b]">{item.number}.</span>
        {item.prompt.replace('{{answer}}', '_____')}
      </p>
      <p className="flex items-center gap-2">
        {item.isCorrect ? (
          <CheckCircle2
            className="size-4 shrink-0 text-emerald-600"
            aria-label="Верно"
          />
        ) : (
          <XCircle
            className="size-4 shrink-0 text-[#e23b3b]"
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
