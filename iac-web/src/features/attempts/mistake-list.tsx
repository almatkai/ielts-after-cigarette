import { LampCharge, Lock } from 'iconsax-react'
import { Link } from '@tanstack/react-router'

import { GuestSignInButton } from '@/components/auth/guest-results-access'
import { formatAnswer } from './attempt-ui'
import { useMistakeReviewStatus } from './use-mistake-review-status'
import type { Option } from './attempt-ui'
import type { AttemptReviewItem } from './api'

export function reviewOptions(item: AttemptReviewItem): Option[] {
  const options = item.content?.options
  return Array.isArray(options)
    ? options.filter(
        (option): option is Option =>
          typeof option === 'object' &&
          option !== null &&
          typeof option.id === 'string' &&
          typeof option.text === 'string',
      )
    : []
}

export function MistakeRow({
  item,
  attemptId,
  onRetry,
  guestPreview = false,
}: {
  item: AttemptReviewItem
  attemptId: string
  onRetry: () => void
  guestPreview?: boolean
}) {
  const { reviewed } = useMistakeReviewStatus(attemptId, item.questionId)
  const content = (
    <>
      <span className="flex flex-wrap items-center justify-between gap-3">
        <span className="min-w-0 flex-1 basis-[200px] font-semibold text-foreground group-hover:text-primary">
          <span className="mr-2 text-primary">{item.number}.</span>
          <span>{item.prompt.replaceAll('{{answer}}', '_____')}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary">
          {item.locked ? (
            <Lock className="size-4" aria-hidden />
          ) : (
            <LampCharge className="size-4" aria-hidden />
          )}
          Разобрать ошибку
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
        Ваш ответ:{' '}
        <strong className="text-foreground">
          {formatAnswer(item.answer, reviewOptions(item))}
        </strong>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${reviewed ? 'border-success-bg bg-success-bg text-success' : 'border-destructive-soft bg-destructive-soft text-destructive'}`}
        >
          {reviewed ? 'Разобрано' : 'Ошибка'}
        </span>
      </span>
    </>
  )
  const className =
    'group grid w-full gap-2.5 rounded-[10px] border border-border bg-card p-4 text-left text-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
  return item.locked && guestPreview ? (
    <GuestSignInButton
      className={className}
      label={`Разобрать ошибку ${item.number}: войти в аккаунт`}
    >
      {content}
    </GuestSignInButton>
  ) : item.locked ? (
    <Link to="/login" className={className}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onRetry}
      className={className}
      aria-label={`Разобрать ошибку ${item.number}`}
    >
      {content}
    </button>
  )
}
