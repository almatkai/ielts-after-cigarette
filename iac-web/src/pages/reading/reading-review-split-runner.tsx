import { BrandLogo } from '@/components/landing/brand'
import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  CloseCircle,
  LampCharge,
  TickCircle,
  InfoCircle,
} from 'iconsax-react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/features/auth/auth-store'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AttemptDetail, AttemptReviewItem } from '@/features/attempts/api'
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
  const { guest } = useAuth()
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
            const item = question.id
              ? reviewByQuestionId.get(question.id)
              : undefined
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
  const [passageFontSize, setPassageFontSize] = useState<'sm' | 'md' | 'lg'>(
    'md',
  )
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'errors' | 'correct'
  >('all')
  const [retryModalItem, setRetryModalItem] =
    useState<AttemptReviewItem | null>(null)

  const currentQuestion = questions.at(activeQuestionIndex) ?? questions.at(0)
  const currentPassage =
    passages.at(currentQuestion?.passageIndex ?? 0) ?? passages.at(0)

  const totalQuestions = review.length || questions.length
  const correctCount = review.filter((i) => i.isCorrect).length
  const errorCount = review.filter((i) => !i.isCorrect).length

  const goToPassage = (passageIndex: number) => {
    const targetIndex = questions.findIndex(
      (item) => item.passageIndex === passageIndex,
    )
    if (targetIndex >= 0) {
      setActiveQuestionIndex(targetIndex)
    }
  }

  // Scroll to question on select
  useEffect(() => {
    if (!currentQuestion?.question.id) return
    const el = document.getElementById(
      `review-split-q-${currentQuestion.question.id}`,
    )
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeQuestionIndex, currentQuestion?.question.id])

  // Active quote to highlight in passage
  const activeQuote = useMemo(() => {
    const item = currentQuestion?.reviewItem
    if (!item) return ''
    if (item.quote && item.quote.trim().length > 0) return item.quote.trim()
    if (
      item.content &&
      typeof item.content.quote === 'string' &&
      item.content.quote.trim().length > 0
    ) {
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
    <div className="mx-auto flex h-dvh w-full max-w-[1780px] flex-col gap-2.5 p-2.5 sm:p-3.5 lg:p-4 overflow-hidden bg-background">
      {/* ВЕРХНЯЯ ШАПКА */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-3.5 py-2.5 sm:px-4 shadow-none shrink-0">
        <div className="flex items-center gap-3">
          <BrandLogo variant="mark" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
          >
            {guest ? (
              <Link to="/try">
                <ArrowLeft className="size-4" aria-hidden />
                <span className="hidden sm:inline">К пробному тесту</span>
              </Link>
            ) : (
              <Link to="/mistakes">
                <ArrowLeft className="size-4" aria-hidden />
                <span className="hidden sm:inline">К ошибкам</span>
              </Link>
            )}
          </Button>
          <div className="hidden md:block">
            <h1 className="font-sans text-sm font-semibold text-foreground truncate max-w-[240px] lg:max-w-[360px]">
              {material.title}
            </h1>
            <span className="text-[11px] text-muted-foreground">
              Интерактивный разбор ответов
            </span>
          </div>
        </div>

        {/* Вкладки Разделов (Passages) по центру */}
        {passages.length > 1 && (
          <div className="flex items-center gap-1 rounded-[10px] border border-border bg-card p-1">
            {passages.map((passage, passageIndex) => {
              const isCurrentPassage =
                currentQuestion?.passageIndex === passageIndex
              const pQuestions = questions.filter(
                (item) => item.passageIndex === passageIndex,
              )
              const pErrors = pQuestions.filter(
                (item) => item.reviewItem && !item.reviewItem.isCorrect,
              ).length
              return (
                <button
                  key={passage.id}
                  type="button"
                  onClick={() => goToPassage(passageIndex)}
                  className={cn(
                    'flex items-center gap-2 rounded-[8px] px-3 py-1 text-xs font-semibold transition-all select-none',
                    isCurrentPassage
                      ? 'bg-primary text-primary-foreground shadow-none'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  <span>Раздел {passageIndex + 1}</span>
                  {pErrors > 0 ? (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                        isCurrentPassage
                          ? 'bg-primary-hover text-primary-foreground'
                          : 'bg-destructive-soft text-destructive',
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
          <div className="flex items-center gap-1 rounded-[10px] border border-border bg-background p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={cn(
                'px-2.5 py-1 rounded-[7px] font-medium transition-colors',
                filterStatus === 'all'
                  ? 'bg-card text-foreground font-semibold shadow-none'
                  : 'text-muted-foreground hover:text-foreground',
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
                  ? 'bg-destructive text-primary-foreground font-semibold shadow-none'
                  : 'text-destructive hover:bg-destructive-soft',
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
                  ? 'bg-success text-primary-foreground font-semibold shadow-none'
                  : 'text-success hover:bg-success-bg',
              )}
            >
              Верно ({correctCount})
            </button>
          </div>

          <Badge
            variant="outline"
            className="hidden sm:inline-flex text-xs font-bold text-foreground bg-card"
          >
            Score: {correctCount}/{totalQuestions}
          </Badge>
        </div>
      </header>

      {/* Основная рабочая зона — сплит на 2 колонки */}
      <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-2 overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА: Текст Reading Passage с подсветкой доказательств */}
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-border bg-card shadow-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="rounded-sm bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary border border-primary-soft shrink-0">
                {passages.length > 1
                  ? `Раздел ${(currentQuestion?.passageIndex ?? 0) + 1}`
                  : 'Текст'}
              </span>
              <h2 className="text-sm font-semibold text-foreground truncate">
                {currentPassage?.title}
              </h2>
            </div>
            {/* Контролы размера шрифта */}
            <div className="flex items-center gap-1 rounded-[8px] p-0.5 border border-border bg-card shrink-0">
              <button
                type="button"
                onClick={() => setPassageFontSize('sm')}
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-[6px] transition-colors',
                  passageFontSize === 'sm'
                    ? 'bg-primary text-primary-foreground shadow-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
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
                    ? 'bg-primary text-primary-foreground shadow-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
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
                    ? 'bg-primary text-primary-foreground shadow-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
                title="Увеличить шрифт"
              >
                A+
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 select-text bg-card">
            <HighlightedPassageText
              body={currentPassage?.body ?? ''}
              quote={activeQuote}
              fontSize={passageFontSize}
            />
          </div>
        </Card>

        {/* ПРАВАЯ КОЛОНКА: Вопросы с интерактивным разбором каждого ответа */}
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-border bg-card shadow-none">
          <div className="border-b border-border px-5 py-3.5 bg-card shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-sm bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary border border-primary-soft">
                  Вопросы
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {currentPassage?.questionGroups.length}{' '}
                  {currentPassage?.questionGroups.length === 1
                    ? 'группа'
                    : 'групп'}{' '}
                  вопросов
                </span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                Активный вопрос:{' '}
                {currentQuestion?.reviewItem?.number ?? activeQuestionIndex + 1}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-background space-y-6">
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
                  <div className="border-b border-border pb-2">
                    <span className="rounded-sm bg-muted px-2.5 py-0.5 text-[11px] font-bold normal-case text-foreground border border-border">
                      {group.type.replaceAll('_', ' ')}
                    </span>
                    {group.instructions ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {group.instructions}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3.5">
                    {groupQuestions.map((q) => {
                      const item = q.id
                        ? reviewByQuestionId.get(q.id)
                        : undefined
                      if (!item || !q.id) return null
                      const globalIdx = questions.findIndex(
                        (it) => it.question.id === q.id,
                      )
                      const isCurrent = globalIdx === activeQuestionIndex

                      return (
                        <ReviewQuestionCard
                          key={q.id}
                          item={item}
                          options={(q.content.options ?? []) as Option[]}
                          isCurrent={isCurrent}
                          onSelect={() => {
                            if (globalIdx >= 0)
                              setActiveQuestionIndex(globalIdx)
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
      <footer className="rounded-[10px] border border-border bg-card p-2.5 shadow-none shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {questions.map((item, index) => {
            const isCurrent = index === activeQuestionIndex
            const isCorrect = item.reviewItem?.isCorrect
            const isAnswered =
              item.reviewItem?.answer !== null &&
              item.reviewItem?.answer !== undefined
            const num = item.reviewItem?.number ?? index + 1

            return (
              <button
                key={item.question.id ?? index}
                type="button"
                onClick={() => setActiveQuestionIndex(index)}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-[8px] text-xs font-bold transition-all select-none',
                  isCurrent &&
                    'ring-2 ring-primary ring-offset-1 ring-offset-card scale-105',
                  isCorrect
                    ? 'bg-success-bg text-success border border-success'
                    : isAnswered
                      ? 'bg-destructive-soft text-destructive border border-destructive'
                      : 'bg-muted text-muted-foreground border border-border',
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
        'rounded-[10px] border p-4 bg-card transition-all cursor-pointer shadow-none space-y-3',
        isCurrent
          ? 'border-primary ring-1 ring-primary'
          : isCorrect
            ? 'border-success-bg/80 hover:border-success'
            : 'border-destructive-soft/80 hover:border-destructive',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-[6px] text-xs font-bold',
              isCurrent
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
            )}
          >
            {item.number}
          </span>
          {isCorrect ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-success-bg px-2.5 py-0.5 text-xs font-semibold text-success border border-success-bg">
              <TickCircle className="size-3.5 text-success" />
              Верно (+{item.pointsAwarded} б.)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-sm bg-destructive-soft px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive-soft">
              <CloseCircle className="size-3.5 text-destructive" />
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
            className="h-7 text-xs font-semibold border-destructive-soft bg-destructive-soft text-destructive hover:bg-destructive-soft gap-1 rounded-[8px]"
          >
            <LampCharge className="size-3.5 text-destructive" />
            Разобрать
          </Button>
        )}
      </div>

      <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
        {item.prompt.replace('{{answer}}', '_____')}
      </p>

      {/* Ответы */}
      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <div
          className={cn(
            'rounded-[8px] border p-2.5',
            isCorrect
              ? 'border-success-bg bg-success-bg/50 text-success'
              : 'border-destructive-soft bg-destructive-soft/50 text-destructive',
          )}
        >
          <span className="block text-[10px] font-semibold normal-case text-muted-foreground mb-0.5">
            Ваш ответ
          </span>
          <span
            className={cn(
              'font-semibold',
              !isCorrect && 'line-through text-destructive',
            )}
          >
            {formatAnswer(item.answer, options)}
          </span>
        </div>

        {/* Правильный ответ */}
        <div className="rounded-[8px] border border-success-bg bg-success-bg/70 p-2.5 text-success">
          <span className="block text-[10px] font-semibold normal-case text-success mb-0.5">
            Правильный ответ
          </span>
          <span className="font-bold text-success">
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
            className="flex items-center gap-1.5 text-xs font-medium text-primary-hover hover:text-primary"
          >
            <InfoCircle className="size-3.5" />
            <span>
              {expandedExplanation
                ? 'Скрыть объяснение'
                : 'Показать разбор и цитату'}
            </span>
          </button>

          {expandedExplanation && (
            <div className="mt-2.5 rounded-[10px] border border-border-strong bg-primary-soft p-3 text-xs leading-relaxed text-foreground space-y-2">
              {item.quote ? (
                <div>
                  <span className="font-semibold text-primary block text-[11px] normal-case">
                    Цитата из текста:
                  </span>
                  <blockquote className="font-sans text-foreground mt-1 pl-2 bg-muted rounded-md px-4 py-3 border-primary">
                    «{item.quote}»
                  </blockquote>
                </div>
              ) : null}
              {item.explanation ? (
                <div>
                  <span className="font-semibold text-primary block text-[11px] normal-case">
                    Пояснение:
                  </span>
                  <p className="whitespace-pre-wrap mt-0.5 text-foreground">
                    {item.explanation}
                  </p>
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
          'whitespace-pre-wrap font-sans text-foreground space-y-4',
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
              'whitespace-pre-wrap font-sans text-foreground space-y-4',
              fontSize === 'sm' && 'text-[14px] leading-[1.65]',
              fontSize === 'md' && 'text-[15.5px] leading-[1.8]',
              fontSize === 'lg' && 'text-[17.5px] leading-[1.9]',
            )}
          >
            {before}
            <span
              ref={quoteRef}
              className="bg-highlight text-highlight-foreground font-medium px-1 rounded transition-all shadow-none ring-2 ring-warning-fg ring-offset-1 ring-offset-card"
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
          'whitespace-pre-wrap font-sans text-foreground space-y-4',
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
        'whitespace-pre-wrap font-sans text-foreground space-y-4',
        fontSize === 'sm' && 'text-[14px] leading-[1.65]',
        fontSize === 'md' && 'text-[15.5px] leading-[1.8]',
        fontSize === 'lg' && 'text-[17.5px] leading-[1.9]',
      )}
    >
      {before}
      <span
        ref={quoteRef}
        className="bg-highlight text-highlight-foreground font-medium px-1 rounded transition-all shadow-none ring-2 ring-warning-fg ring-offset-1 ring-offset-card"
      >
        {matchText}
      </span>
      {after}
    </div>
  )
}

function resolvePassages(
  material: PublicReadingMaterial,
): PublicReadingMaterial[] {
  if (material.passages && material.passages.length > 1) {
    return material.passages
  }

  const regex =
    /(?:^|\n)(?:READING\s+)?PASSAGE\s+(\d+)\s*(?:[—–-]\s*([^\n]+))?/gi
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
      const end =
        i < matches.length - 1 ? matches[i + 1].index : material.body.length
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
