import { useEffect, useId, useRef } from 'react'
import { Eye, EyeSlash } from 'iconsax-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n'
import { formatAnswer } from '@/features/attempts/attempt-ui'
import type { Option } from '@/features/attempts/attempt-ui'
import type { PreviewAnswerKey } from './preview-api'
import { findQuoteRange } from './preview-evidence'

export function PreviewAnswer({
  answerKey,
  options,
  open,
  onToggle,
  evidenceText,
}: {
  answerKey?: PreviewAnswerKey
  options: Option[]
  open: boolean
  onToggle: () => void
  evidenceText?: string
}) {
  const { t } = useLanguage()
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open)
      panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }, [open])
  const quote = answerKey?.quote.trim() ?? ''
  const quoteMissing = Boolean(
    quote && evidenceText && !findQuoteRange(evidenceText, quote),
  )
  const answer = formatAnswer(answerKey?.answer ?? null, options)
  return (
    <div className="mt-4 border-t border-border pt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-auto whitespace-normal py-2 text-left text-primary"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
      >
        {open ? (
          <EyeSlash className="size-4 shrink-0" aria-hidden />
        ) : (
          <Eye className="size-4 shrink-0" aria-hidden />
        )}
        {open
          ? t('Скрыть ответ и объяснение')
          : t('Показать ответ с объяснением')}
      </Button>
      {open ? (
        <div
          id={panelId}
          ref={panelRef}
          className="mt-3 space-y-4 rounded-xl border border-border-strong bg-primary-soft/50 p-4 text-sm"
          role="region"
          aria-label={t('Ответ и объяснение')}
        >
          <div>
            <p className="font-semibold text-primary">
              {t('Правильный ответ')}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-foreground">
              {answer === '—'
                ? t('Ответ не добавлен. Укажите его в редакторе.')
                : answer}
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {t('Где находится ответ')}
            </p>
            {quote ? (
              <blockquote className="mt-2 whitespace-pre-wrap bg-muted rounded-md px-4 py-3 border-primary pl-3 font-sans text-foreground">
                {quote}
              </blockquote>
            ) : (
              <p className="mt-1 text-muted-foreground">
                {t(
                  'Цитата не добавлена. Укажите подтверждающий фрагмент текста в редакторе.',
                )}
              </p>
            )}
            {quoteMissing ? (
              <p className="mt-2 text-warning-fg" role="status">
                {t(
                  'Цитата не найдена в этой версии текста. Проверьте её в редакторе.',
                )}
              </p>
            ) : null}
            {answerKey?.hint.trim() ? (
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {answerKey.hint}
              </p>
            ) : null}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {t('Почему этот ответ правильный')}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-foreground">
              {answerKey?.explanation.trim() ||
                t('Объяснение не добавлено. Добавьте разбор в редакторе.')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function PreviewEvidenceText({
  body,
  quote,
}: {
  body: string
  quote: string
}) {
  const markRef = useRef<HTMLElement>(null)
  const range = findQuoteRange(body, quote)
  useEffect(() => {
    markRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' })
  }, [body, quote])
  if (!range) return <>{body}</>
  return (
    <>
      {body.slice(0, range.start)}
      <mark
        ref={markRef}
        data-testid="answer-evidence"
        className="rounded-sm bg-highlight px-0.5 text-highlight-foreground ring-1 ring-warning-fg"
      >
        {body.slice(range.start, range.end)}
      </mark>
      {body.slice(range.end)}
    </>
  )
}
