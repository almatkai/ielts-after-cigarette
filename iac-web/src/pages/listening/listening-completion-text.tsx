import { Fragment } from 'react'

import type { StudentAnswer } from '@/features/attempts/api'
import type { PublicListeningQuestion } from '@/features/listening/api'

export function completionQuestionNumbers(text: string) {
  return new Set(
    Array.from(text.matchAll(/\{\{\s*(\d+)\s*\}\}/g), (match) =>
      Number(match[1]),
    ),
  )
}

/** Render imported placeholders as editable, underlined gaps, not template syntax. */
export function ListeningCompletionText({
  text,
  questions,
  answers,
  defaultQuestion,
  activeQuestionId,
  readOnly = false,
  onAnswer,
  onActivate,
}: {
  text: string
  questions: PublicListeningQuestion[]
  answers: Partial<Record<string, StudentAnswer>>
  defaultQuestion?: PublicListeningQuestion
  activeQuestionId?: string
  readOnly?: boolean
  onAnswer?: (questionId: string, answer: StudentAnswer) => void
  onActivate?: (questionId: string) => void
}) {
  const segments = []
  let offset = 0
  let focusFirstGap = true
  for (const match of text.matchAll(/\{\{\s*(\d+|answer)\s*\}\}|_{3,}/g)) {
    const index = match.index
    segments.push(text.slice(offset, index))
    const question =
      match[1] && match[1] !== 'answer'
        ? questions.find((item) => item.number === Number(match[1]))
        : defaultQuestion
    const questionId = question?.id
    const value = questionId ? answers[questionId]?.value : undefined
    const answer = typeof value === 'string' ? value : ''
    segments.push(
      questionId && readOnly ? (
        <span
          key={index}
          title={`Вопрос ${question.number}`}
          aria-label={`Ответ на вопрос ${question.number}: ${answer || 'не отвечено'}`}
          className="inline-block max-w-full border-b border-slate-500 px-1 text-center"
          style={{ minWidth: '6ch' }}
        >
          {answer || '\u00a0'}
        </span>
      ) : questionId ? (
        <input
          key={index}
          aria-label={`Ответ на вопрос ${question.number}`}
          title={`Вопрос ${question.number}`}
          aria-current={questionId === activeQuestionId ? 'step' : undefined}
          className={`inline-block max-w-full rounded-none border-0 border-b bg-transparent px-1 py-0 text-center text-base leading-normal text-inherit outline-none focus:border-[#3b82f6] focus:ring-0 sm:text-sm ${questionId === activeQuestionId ? 'border-[#3b82f6]' : 'border-slate-500'}`}
          style={{ width: `${Math.max(6, answer.length + 1)}ch` }}
          value={answer}
          autoFocus={focusFirstGap}
          autoComplete="off"
          onFocus={() => onActivate?.(questionId)}
          onChange={(event) =>
            onAnswer?.(questionId, { value: event.target.value })
          }
        />
      ) : (
        <span key={index}>____</span>
      ),
    )
    if (questionId) focusFirstGap = false
    offset = index + match[0].length
  }
  segments.push(text.slice(offset))
  return (
    <>
      {segments.map((segment, index) => (
        <Fragment key={index}>{segment}</Fragment>
      ))}
    </>
  )
}
