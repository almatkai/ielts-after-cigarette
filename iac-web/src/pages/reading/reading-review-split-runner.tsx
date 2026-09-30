import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  CloseCircle,
  LampCharge,
  TickCircle,
  InfoCircle,
} from 'iconsax-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  AttemptDetail,
  AttemptReviewItem,
} from '@/features/attempts/api'
import type { PublicReadingMaterial } from '@/features/reading/api'
import { formatAnswer } from '@/features/attempts/attempt-ui'
import type { Option } from '@/features/attempts/attempt-ui'
import { MistakeRetryDialog } from '@/features/attempts/mistake-retry-dialog'

export function ReadingReviewSplitRunner({
  attempt,
  material,
}: {
  attempt: AttemptDetail
  material: PublicReadingMaterial
}) {
  const review = attempt.review ?? []
  const reviewByQuestionId = useMemo(
    () => new Map(review.map((item) => [item.questionId, item])),
    [review],
  )

  const passages = useMemo(() => resolvePassages(material), [material])

  // Flat questions list with passage index
  const questions = useMemo(
    () =>
      passages.flatMap((passage, passageIndex) =>
        passage.questionGroups.flatMap((group) =>
          group.questions.map((question) => {
            const item = question.id ? reviewByQuestionId.get(question.id) : undefined
            return {
              passage,
              passageIndex,
              group,
              question,
              reviewItem: item,
            }
          }),
        ),
      ),
    [passages, reviewByQuestionId],
  )

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [passageFontSize, setPassageFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [filterStatus, setFilterStatus] = useState<'all' | 'errors' | 'correct'>('all')
  const [retryModalItem, setRetryModalItem] = useState<AttemptReviewItem | null>(null)

  const currentQuestion = questions[activeQuestionIndex] ?? questions[0]
  const currentPassage = passages[currentQuestion?.passageIndex ?? 0] ?? passages[0]

  const totalQuestions = review.length || questions.length
  const correctCount = review.filter((i) => i.isCorrect).length
  const errorCount = review.filter((i) => !i.isCorrect).length

  const goToPassage = (passageIndex: number) => {
    const targetIndex = questions.findIndex((item) => item.passageIndex === passageIndex)
    if (targetIndex >= 0) {
      setActiveQuestionIndex(targetIndex)
    }
  }

  // Scroll to question on select
  useEffect(() => {
    if (!currentQuestion?.question.id) return
    const el = document.getElementById(`review-split-q-${currentQuestion.question.id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeQuestionIndex, currentQuestion?.question.id])

  // Active quote to highlight in passage
  const activeQuote = useMemo(() => {
    const item = currentQuestion?.reviewItem
    if (!item) return ''
    if (item.quote && item.quote.trim().length > 0) return item.quote.trim()
    if (item.content && typeof item.content.quote === 'string' && item.content.quote.trim().length > 0) {
      return item.content.quote.trim()
    }
    // Try extract quote in quotes from explanation
    if (item.explanation) {
      const match = item.explanation.match(/["“«]([^"”»]{12,250})["”»]/)
      if (match && match[1]) return match[1].trim()
    }
    return ''
  }, [currentQuestion])

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[1780px] flex-col gap-2.5 p-2.5 sm:p-3.5 lg:p-4 overflow-hidden bg-[#fafaf8]">
      {/* ВЕРХНЯЯ ШАПКА */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e7e7e4] bg-white px-3.5 py-2.5 sm:px-4 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-slate-600 hover:text-slate-900"
          >
            <Link to="/mistakes">
              <ArrowLeft className="size-4" aria-hidden />
              <span className="hidden sm:inline">К ошибкам</span>
            </Link>
          </Button>
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold text-slate-900 truncate max-w-[240px] lg:max-w-[360px]">
              {material.title}
            </h1>
            <span className="text-[11px] text-slate-500">Интерактивный разбор ответов</span>
          </div>
        </div>

        {/* Вкладки Разделов (Passages) по центру */}
        {passages.length > 1 && (
          <div className="flex items-center gap-1 rounded-[10px] border border-[#e7e7e4] bg-white p-1">
            {passages.map((passage, passageIndex) => {
              const isCurrentPassage = currentQuestion.passageIndex === passageIndex
              const pQuestions = questions.filter((item) => item.passageIndex === passageIndex)
              const pErrors = pQuestions.filter((item) => item.reviewItem && !item.reviewItem.isCorrect).length
              return (
                <button
                  key={passage.id}
                  type="button"
                  onClick={() => goToPassage(passageIndex)}
                  className={cn(
                    'flex items-center gap-2 rounded-[8px] px-3 py-1 text-xs font-semibold transition-all select-none',
                    isCurrentPassage
                      ? 'bg-[#3b82f6] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                  )}
                >
                  <span>Раздел {passageIndex + 1}</span>
                  {pErrors > 0 ? (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                        isCurrentPassage ? 'bg-white/30 text-white' : 'bg-rose-100 text-rose-700',
                      )}
                    >
                      {pErrors} ош.
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {/* Фильтры и статистика */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-[10px] border border-[#e7e7e4] bg-[#fafaf9] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={cn(
                'px-2.5 py-1 rounded-[7px] font-medium transition-colors',
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Все ({totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('errors')}
              className={cn(
                'px-2.5 py-1 rounded-[7px] font-medium transition-colors',
                filterStatus === 'errors'
                  ? 'bg-rose-500 text-white font-semibold shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50',
              )}
            >
              Ошибки ({errorCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('correct')}
              className={cn(
                'px-2.5 py-1 rounded-[7px] font-medium transition-colors',
                filterStatus === 'correct'
                  ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50',
              )}
            >
              Верно ({correctCount})
            </button>
          </div>

          <Badge variant="outline" className="hidden sm:inline-flex text-xs font-bold text-slate-800 bg-white">
            Score: {correctCount}/{totalQuestions}
          </Badge>
        </div>
      </header>

      {/* Основная рабочая зона — сплит на 2 колонки */}
      <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-2 overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА: Текст Reading Passage с подсветкой доказательств */}
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border border-[#e7e7e4] bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-[#ededeb] px-5 py-3.5 bg-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-xs font-bold text-[#3b82f6] border border-[#dbeafe] shrink-0">
                {passages.length > 1 ? `Раздел ${currentQuestion?.passageIndex + 1}` : 'Текст'}
              </span>
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {currentPassage?.title}
              </h2>
            </div>
            {/* Контролы размера шрифта */}
            <div className="flex items-center gap-1 rounded-[8px] p-0.5 border border-[#e7e7e4] bg-white shrink-0">
              <button
                type="button"
                onClick={() => setPassageFontSize('sm')}
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-[6px] transition-colors',
                  passageFontSize === 'sm'
                    ? 'bg-[#3b82f6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                )}
                title="Уменьшить шрифт"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setPassageFontSize('md')}
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-[6px] transition-colors',
                  passageFontSize === 'md'
                    ? 'bg-[#3b82f6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                )}
                title="Стандартный шрифт"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setPassageFontSize('lg')}
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-[6px] transition-colors',
                  passageFontSize === 'lg'
                    ? 'bg-[#3b82f6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                )}
                title="Увеличить шрифт"
              >
                A+
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 select-text bg-white">
            <HighlightedPassageText
              body={currentPassage?.body ?? ''}
              quote={activeQuote}
              fontSize={passageFontSize}
            />
          </div>
        </Card>

        {/* ПРАВАЯ КОЛОНКА: Вопросы с интерактивным разбором каждого ответа */}
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border border-[#e7e7e4] bg-white shadow-xs">
          <div className="border-b border-[#ededeb] px-5 py-3.5 bg-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-xs font-bold text-[#3b82f6] border border-[#dbeafe]">
                  Вопросы
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentPassage?.questionGroups.length}{' '}
                  {currentPassage?.questionGroups.length === 1 ? 'группа' : 'групп'} вопросов
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Активный вопрос: {currentQuestion?.reviewItem?.number ?? activeQuestionIndex + 1}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-[#fcfcfb] space-y-6">
            {currentPassage?.questionGroups.map((group) => {
              const groupQuestions = group.questions.filter((q) => {
                const item = q.id ? reviewByQuestionId.get(q.id) : undefined
                if (filterStatus === 'errors' && item?.isCorrect) return false
                if (filterStatus === 'correct' && !item?.isCorrect) return false
                return true
              })

              if (groupQuestions.length === 0) return null

              return (
                <div key={group.id ?? group.position} className="space-y-3">
                  <div className="border-b border-[#ededeb] pb-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 border border-slate-200">
                      {group.type.replaceAll('_', ' ')}
                    </span>
                    {group.instructions ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-[#69696d]">
                        {group.instructions}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3.5">
                    {groupQuestions.map((q) => {
                      const item = q.id ? reviewByQuestionId.get(q.id) : undefined
                      if (!item || !q.id) return null
                      const globalIdx = questions.findIndex((it) => it.question.id === q.id)
                      const isCurrent = globalIdx === activeQuestionIndex

                      return (
                        <ReviewQuestionCard
                          key={q.id}
                          item={item}
                          options={(q.content.options ?? []) as Option[]}
                          isCurrent={isCurrent}
                          onSelect={() => {
                            if (globalIdx >= 0) setActiveQuestionIndex(globalIdx)
                          }}
                          onRetry={() => setRetryModalItem(item)}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ (Сетка 1-40) */}
      <footer className="rounded-[14px] border border-[#e7e7e4] bg-white p-2.5 shadow-xs shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {questions.map((item, index) => {
            const isCurrent = index === activeQuestionIndex
            const isCorrect = item.reviewItem?.isCorrect
            const isAnswered = item.reviewItem?.answer !== null && item.reviewItem?.answer !== undefined
            const num = item.reviewItem?.number ?? index + 1

            return (
              <button
                key={item.question.id ?? index}
                type="button"
                onClick={() => setActiveQuestionIndex(index)}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-[8px] text-xs font-bold transition-all select-none',
                  isCurrent && 'ring-2 ring-[#3b82f6] ring-offset-1 scale-105',
                  isCorrect
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isAnswered
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200',
                )}
                title={`Вопрос ${num}: ${isCorrect ? 'Верно' : 'Ошибка'}`}
              >
                {num}
              </button>
            )
          })}
        </div>
      </footer>

      {/* Модальное окно повторной попытки / Guided Retry */}
      <MistakeRetryDialog
        item={retryModalItem}
        open={Boolean(retryModalItem)}
        onOpenChange={(open) => {
          if (!open) setRetryModalItem(null)
        }}
        testTitle={material.title}
        attemptId={attempt.id}
        materialType="reading"
      />
    </div>
  )
}

function ReviewQuestionCard({
  item,
  options,
  isCurrent,
  onSelect,
  onRetry,
}: {
  item: AttemptReviewItem
  options: Option[]
  isCurrent: boolean
  onSelect: () => void
  onRetry: () => void
}) {
  const [expandedExplanation, setExpandedExplanation] = useState(false)
  const isCorrect = item.isCorrect

  return (
    <div
      id={`review-split-q-${item.questionId}`}
      onClick={onSelect}
      className={cn(
        'rounded-[14px] border p-4 bg-white transition-all cursor-pointer shadow-2xs space-y-3',
        isCurrent
          ? 'border-[#3b82f6] ring-1 ring-[#3b82f6]'
          : isCorrect
            ? 'border-emerald-200/80 hover:border-emerald-300'
            : 'border-rose-200/80 hover:border-rose-300',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-[6px] text-xs font-bold',
              isCurrent ? 'bg-[#3b82f6] text-white' : 'bg-slate-100 text-slate-800',
            )}
          >
            {item.number}
          </span>
          {isCorrect ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <TickCircle className="size-3.5 text-emerald-600" />
              Верно (+{item.pointsAwarded} б.)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
              <CloseCircle className="size-3.5 text-rose-600" />
              Ошибка (0 б.)
            </span>
          )}
        </div>

        {/* Кнопка "Разобрать ошибку" / "Попробовать снова" */}
        {!isCorrect && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onRetry()
            }}
            className="h-7 text-xs font-semibold border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 gap-1 rounded-[8px]"
          >
            <LampCharge className="size-3.5 text-rose-600" />
            Разобрать
          </Button>
        )}
      </div>

      <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
        {item.prompt.replace('{{answer}}', '_____')}
      </p>

      {/* Ответы */}
      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <div
          className={cn(
            'rounded-[8px] border p-2.5',
            isCorrect
              ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
              : 'border-rose-200 bg-rose-50/50 text-rose-950',
          )}
        >
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
            Ваш ответ
          </span>
          <span className={cn('font-semibold', !isCorrect && 'line-through text-rose-800')}>
            {formatAnswer(item.answer, options)}
          </span>
        </div>

        {/* Правильный ответ */}
        <div className="rounded-[8px] border border-emerald-200 bg-emerald-50/70 p-2.5 text-emerald-950">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-0.5">
            Правильный ответ
          </span>
          <span className="font-bold text-emerald-900">
            {formatAnswer(item.correctAnswer, options)}
          </span>
        </div>
      </div>

      {/* Объяснение (аккордеон) */}
      {item.explanation || item.quote ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedExplanation((v) => !v)
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb] hover:text-blue-700"
          >
            <InfoCircle className="size-3.5" />
            <span>{expandedExplanation ? 'Скрыть объяснение' : 'Показать разбор и цитату'}</span>
          </button>

          {expandedExplanation && (
            <div className="mt-2.5 rounded-[10px] border border-blue-100 bg-[#f0f7ff] p-3 text-xs leading-relaxed text-slate-700 space-y-2">
              {item.quote ? (
                <div>
                  <span className="font-semibold text-[#1d4ed8] block text-[11px] uppercase tracking-wider">
                    Цитата из текста:
                  </span>
                  <blockquote className="font-serif italic text-slate-800 mt-1 pl-2 border-l-2 border-blue-400">
                    «{item.quote}»
                  </blockquote>
                </div>
              ) : null}
              {item.explanation ? (
                <div>
                  <span className="font-semibold text-[#1d4ed8] block text-[11px] uppercase tracking-wider">
                    Пояснение:
                  </span>
                  <p className="whitespace-pre-wrap mt-0.5 text-slate-700">{item.explanation}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function HighlightedPassageText({
  body,
  quote,
  fontSize,
}: {
  body: string
  quote: string
  fontSize: 'sm' | 'md' | 'lg'
}) {
  const quoteRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (quote && quoteRef.current) {
      quoteRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [quote])

  if (!quote || quote.length < 5) {
    return (
      <div
        className={cn(
          'whitespace-pre-wrap font-serif text-slate-800 space-y-4',
          fontSize === 'sm' && 'text-[14px] leading-[1.65]',
          fontSize === 'md' && 'text-[15.5px] leading-[1.8]',
          fontSize === 'lg' && 'text-[17.5px] leading-[1.9]',
        )}
      >
        {body}
      </div>
    )
  }

  // Find quote occurrence in body (case-insensitive)
  const lowerBody = body.toLowerCase()
  const lowerQuote = quote.toLowerCase()
  const idx = lowerBody.indexOf(lowerQuote)

  if (idx === -1) {
    // Try shorter match if quote has multiple sentences
    const firstSentence = quote.split(/[.?!]/)[0]?.trim() || ''
    if (firstSentence.length > 15) {
      const subIdx = lowerBody.indexOf(firstSentence.toLowerCase())
      if (subIdx !== -1) {
        const before = body.slice(0, subIdx)
        const matchText = body.slice(subIdx, subIdx + firstSentence.length)
        const after = body.slice(subIdx + firstSentence.length)
        return (
          <div
            className={cn(
              'whitespace-pre-wrap font-serif text-slate-800 space-y-4',
              fontSize === 'sm' && 'text-[14px] leading-[1.65]',
              fontSize === 'md' && 'text-[15.5px] leading-[1.8]',
              fontSize === 'lg' && 'text-[17.5px] leading-[1.9]',
            )}
          >
            {before}
            <span
              ref={quoteRef}
              className="bg-amber-200/90 text-amber-950 font-medium px-1 rounded transition-all shadow-xs ring-2 ring-amber-300 ring-offset-1"
            >
              {matchText}
            </span>
            {after}
          </div>
        )
      }
    }

    return (
      <div
        className={cn(
          'whitespace-pre-wrap font-serif text-slate-800 space-y-4',
          fontSize === 'sm' && 'text-[14px] leading-[1.65]',
          fontSize === 'md' && 'text-[15.5px] leading-[1.8]',
          fontSize === 'lg' && 'text-[17.5px] leading-[1.9]',
        )}
      >
        {body}
      </div>
    )
  }

  const before = body.slice(0, idx)
  const matchText = body.slice(idx, idx + quote.length)
  const after = body.slice(idx + quote.length)

  return (
    <div
      className={cn(
        'whitespace-pre-wrap font-serif text-slate-800 space-y-4',
        fontSize === 'sm' && 'text-[14px] leading-[1.65]',
        fontSize === 'md' && 'text-[15.5px] leading-[1.8]',
        fontSize === 'lg' && 'text-[17.5px] leading-[1.9]',
      )}
    >
      {before}
      <span
        ref={quoteRef}
        className="bg-amber-200/90 text-amber-950 font-medium px-1 rounded transition-all shadow-xs ring-2 ring-amber-300 ring-offset-1"
      >
        {matchText}
      </span>
      {after}
    </div>
  )
}

function resolvePassages(material: PublicReadingMaterial): PublicReadingMaterial[] {
  if (material.passages && material.passages.length > 1) {
    return material.passages
  }

  const regex = /(?:^|\n)(?:READING\s+)?PASSAGE\s+(\d+)\s*(?:[—–-]\s*([^\n]+))?/gi
  const matches: { index: number; number: number; title: string }[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(material.body)) !== null) {
    matches.push({
      index: match.index,
      number: parseInt(match[1], 10),
      title: match.at(2)?.trim() || `Passage ${match[1]}`,
    })
  }

  if (matches.length > 1) {
    return matches.map((item, i) => {
      const start = item.index
      const end = i < matches.length - 1 ? matches[i + 1].index : material.body.length
      const bodyChunk = material.body.slice(start, end).trim()
      const groups = material.questionGroups.filter((g) => {
        const instr = g.instructions || ''
        const matchP = instr.match(/(?:Passage|Раздел)\s+(\d+)/i)
        if (matchP) return parseInt(matchP[1], 10) === item.number
        const firstNum =
          (g.questions.at(0)?.content.number as number | undefined) ??
          g.questions.at(0)?.position ??
          1
        if (item.number === 1) return firstNum <= 13
        if (item.number === 2) return firstNum > 13 && firstNum <= 26
        return firstNum > 26
      })
      return {
        ...material,
        id: `${material.id}-passage-${item.number}`,
        title: item.title,
        body: bodyChunk,
        questionGroups: groups,
      }
    })
  }

  return material.passages && material.passages.length > 0
    ? material.passages
    : [material]
}
