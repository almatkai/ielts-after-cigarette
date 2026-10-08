import { useEffect, useId, useRef } from 'react'
import { Eye, EyeSlash } from 'iconsax-react'
import { Button } from '@/components/ui/button'
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
    <div className="mt-4 border-t border-slate-200 pt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-auto whitespace-normal py-2 text-left text-blue-700"
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
        {open ? 'Скрыть ответ и объяснение' : 'Показать ответ с объяснением'}
      </Button>
      {open ? (
        <div
          id={panelId}
          ref={panelRef}
          className="mt-3 space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-sm"
          role="region"
          aria-label="Ответ и объяснение"
        >
          <div>
            <p className="font-semibold text-blue-900">Правильный ответ</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-slate-900">
              {answer === '—'
                ? 'Ответ не добавлен. Укажите его в редакторе.'
                : answer}
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Где находится ответ</p>
            {quote ? (
              <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-blue-400 pl-3 font-serif text-slate-800">
                {quote}
              </blockquote>
            ) : (
              <p className="mt-1 text-slate-600">
                Цитата не добавлена. Укажите подтверждающий фрагмент текста в
                редакторе.
              </p>
            )}
            {quoteMissing ? (
              <p className="mt-2 text-amber-800" role="status">
                Цитата не найдена в этой версии текста. Проверьте её в
                редакторе.
              </p>
            ) : null}
            {answerKey?.hint.trim() ? (
              <p className="mt-2 whitespace-pre-wrap text-slate-600">
                {answerKey.hint}
              </p>
            ) : null}
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              Почему этот ответ правильный
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-slate-700">
              {answerKey?.explanation.trim() ||
                'Объяснение не добавлено. Добавьте разбор в редакторе.'}
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
        className="rounded-sm bg-amber-200 px-0.5 text-slate-900 ring-1 ring-amber-400"
      >
        {body.slice(range.start, range.end)}
      </mark>
      {body.slice(range.end)}
    </>
  )
}
