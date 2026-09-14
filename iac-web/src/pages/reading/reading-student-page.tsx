import {
  ArrowLeft,
  ArrowRight,
  Book1,
  TickCircle,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Clock3 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAttemptSession } from '@/features/attempts/attempt-session'
import {
  AttemptResultSummary,
  ErrorState,
  ExamLoadingScreen,
  ReviewQuestion,
  SaveIndicator,
  TimeBadge,
  multiSelectLimit,
} from '@/features/attempts/attempt-ui'
import type { Option } from '@/features/attempts/attempt-ui'
import {
  attemptKeys,
  getAttempt,
  startReadingAttempt,
} from '@/features/attempts/api'
import type { Attempt, StudentAnswer } from '@/features/attempts/api'
import type {
  PublicReadingGroup,
  PublicReadingMaterial,
  PublicReadingQuestion,
} from '@/features/reading/api'
import { getErrorMessage } from '@/lib/api/client'

const tfngValues = ['TRUE', 'FALSE', 'NOT_GIVEN'] as const
const ynngValues = ['YES', 'NO', 'NOT_GIVEN'] as const

export function ReadingStudentPage({ materialId }: { materialId: string }) {
  const startQuery = useQuery({
    queryKey: ['reading', 'materials', materialId, 'attempt'],
    queryFn: ({ signal }) => startReadingAttempt(materialId, signal),
  })
  if (startQuery.isPending) {
    return (
      <ExamLoadingScreen
        badge="IELTS Reading"
        label="Готовим материал…"
        description="Загружаем текст задания, формируем группы вопросов и настраиваем форму для ответов."
      />
    )
  }
  if (!startQuery.data) {
    return (
      <ErrorState
        title="Не удалось начать тест"
        message={getErrorMessage(startQuery.error)}
        onRetry={() => void startQuery.refetch()}
      />
    )
  }
  return (
    <ReadingAttemptRunner
      key={startQuery.data.attempt.id}
      attempt={startQuery.data.attempt}
      material={startQuery.data.material}
    />
  )
}

export function ReadingAttemptRunner({
  attempt,
  material,
  fullMockSessionId,
}: {
  attempt: Attempt
  material: PublicReadingMaterial
  fullMockSessionId?: string
}) {
  const session = useAttemptSession(attempt.id)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const autoSubmitStarted = useRef(false)

  const startedAt = useMemo(
    () => new Date(attempt.startedAt).getTime(),
    [attempt.startedAt],
  )
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
  )
  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      )
    }, 1000)
    return () => window.clearInterval(interval)
  }, [startedAt])
  const durationSeconds = (material.durationMinutes ?? 0) * 60
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds)
  useEffect(() => {
    if (
      durationSeconds > 0 &&
      remainingSeconds === 0 &&
      !session.submitted &&
      !session.isSubmitting &&
      !autoSubmitStarted.current
    ) {
      autoSubmitStarted.current = true
      void session.submit()
    }
  }, [durationSeconds, remainingSeconds, session])

  if (session.submitted) {
    return (
      <ReadingAttemptResult
        attempt={session.submitted}
        material={material}
        fullMockSessionId={fullMockSessionId}
      />
    )
  }
  if (session.answers === null) {
    return (
      <ExamLoadingScreen
        badge="IELTS Reading"
        label="Восстанавливаем сохранённые ответы…"
        description="Синхронизируем ваш прогресс и последние введённые ответы с сервером..."
      />
    )
  }
  const answers = session.answers

  const passages =
    material.passages && material.passages.length > 0
      ? material.passages
      : [material]
  const questions = passages.flatMap((passage, passageIndex) =>
    passage.questionGroups.flatMap((group) =>
      group.questions.map((question) => ({
        passage,
        passageIndex,
        group,
        question,
      })),
    ),
  )
  const currentQuestion = questions[activeQuestionIndex]
  const totalQuestions = questions.reduce(
    (total, item) => total + item.question.points,
    0,
  )
  const answeredCount = questions.reduce((total, item) => {
    if (!item.question.id) return total
    const answer = answers[item.question.id] ?? {}
    if (Array.isArray(answer.optionIds)) {
      return total + Math.min(answer.optionIds.length, item.question.points)
    }
    if (answer.optionId || answer.value) return total + 1
    return total
  }, 0)
  const currentNumber = questionNumberLabel(currentQuestion.question)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
      <div>
        <Button asChild variant="link" className="sr-only">
          <Link to="/dashboard/reading">
            <ArrowLeft aria-hidden />К Reading
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="sr-only">{material.title}</h1>
          <div className="flex items-center gap-3">
            <SaveIndicator state={session.saveState} />
            <TimeBadge
              seconds={durationSeconds > 0 ? remainingSeconds : elapsedSeconds}
              label={durationSeconds > 0 ? 'Осталось' : 'Прошедшее время'}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <SaveIndicator state={session.saveState} />
          <TimeBadge seconds={elapsedSeconds} label="Прошедшее время" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                disabled={session.isSubmitting}
                className="bg-[#3b82f6] text-white hover:bg-blue-600 shadow-xs"
              >
                {session.isSubmitting ? 'Отправляем…' : 'Завершить тест'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Завершить попытку?</AlertDialogTitle>
                <AlertDialogDescription>
                  {answeredCount < totalQuestions
                    ? `Вы ответили на ${answeredCount} из ${totalQuestions} вопросов. Неотвеченные вопросы будут засчитаны как неверные.`
                    : 'Все вопросы отвечены. Вы уверены, что хотите завершить тест и перейти к результатам?'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Продолжить тест</AlertDialogCancel>
                <AlertDialogAction onClick={session.submit}>
                  Завершить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="mb-3 flex shrink-0 rounded-xl bg-slate-100 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setActiveMobileTab('passage')}
          className={cn(
            'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all',
            activeMobileTab === 'passage'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          Текст задания
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('questions')}
          className={cn(
            'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all',
            activeMobileTab === 'questions'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          Вопрос {activeQuestionIndex + 1} из {totalQuestions}
          {answers[currentQuestion.question.id ?? ''] ? ' ✓' : ''}
        </button>
      </div>

      {session.submitError ? (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#e23b3b]"
        >
          Не удалось отправить тест: {session.submitError}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {passages.map((passage, passageIndex) => (
            <Button
              key={passage.id}
              type="button"
              size="sm"
              variant={
                currentQuestion.passageIndex === passageIndex
                  ? 'default'
                  : 'outline'
              }
              onClick={() => {
                const index = questions.findIndex(
                  (item) => item.passageIndex === passageIndex,
                )
                if (index >= 0) setActiveQuestionIndex(index)
              }}
            >
              Passage {passageIndex + 1}
            </Button>
          ))}
        </div>
        <Card className="max-h-[28dvh] shrink-0 overflow-y-auto shadow-none">
          <CardHeader>
            <CardTitle>{currentQuestion.passage.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-6">
              {currentQuestion.passage.body}
            </div>
          </CardContent>
        </Card>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <Card className="min-h-0 flex-1 overflow-y-auto shadow-none">
            <CardHeader>
              <CardTitle>Вопросы</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <StudentGroup
                group={currentQuestion.group}
                activeQuestionId={currentQuestion.question.id}
                answers={answers}
                onAnswer={session.updateAnswer}
              />
            </CardContent>
          </Card>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e7e7e4] bg-white p-3">
            <Button
              type="button"
              variant="outline"
              disabled={activeQuestionIndex === 0}
              onClick={() => setActiveQuestionIndex((index) => index - 1)}
            >
              Назад
            </Button>
            <p className="text-sm text-[#69696d]">
              Вопрос {currentNumber} из {totalQuestions}
            </p>
            <Button
              type="button"
              disabled={activeQuestionIndex === totalQuestions - 1}
              onClick={() => setActiveQuestionIndex((index) => index + 1)}
            >
              Далее
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

function ReadingAttemptResult({
  attempt,
  material,
  fullMockSessionId,
}: {
  attempt: Attempt
  material: PublicReadingMaterial
  fullMockSessionId?: string
}) {
  const detailQuery = useQuery({
    queryKey: attemptKeys.detail(attempt.id),
    queryFn: ({ signal }) => getAttempt(attempt.id, signal),
  })
  const review =
    detailQuery.data?.status === 'SUBMITTED'
      ? (detailQuery.data.review ?? [])
      : null
  const reviewByQuestionId = useMemo(
    () => new Map((review ?? []).map((item) => [item.questionId, item])),
    [review],
  )

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <Button asChild variant="link" className="h-auto p-0">
          {fullMockSessionId ? (
            <Link
              to="/exam/full-mock-sessions/$sessionId"
              params={{ sessionId: fullMockSessionId }}
            >
              <ArrowLeft aria-hidden />К Full Mock
            </Link>
          ) : (
            <Link to="/dashboard/reading">
              <ArrowLeft aria-hidden />К материалам
            </Link>
          )}
        </Button>
        <h1 className="mt-3 text-2xl font-bold">{material.title}</h1>
        <p className="text-sm text-[#69696d]">
          {material.examType} · {material.difficulty}
        </p>
      </div>

      <AttemptResultSummary attempt={attempt} review={review} />

      {detailQuery.isPending ? (
        <p className="text-sm text-[#69696d]">Загружаем разбор ответов…</p>
      ) : detailQuery.isError ? (
        <p className="text-sm text-[#e23b3b]">
          Не удалось загрузить подробный разбор:
          {getErrorMessage(detailQuery.error)}
        </p>
      ) : (
        <Card className="shadow-none">
          <CardContent className="grid gap-5 p-5">
            {(material.passages && material.passages.length > 0
              ? material.passages
              : [material]
            ).flatMap((passage, passageIndex) =>
              passage.questionGroups.map((group) => (
                <section
                  key={`${passage.id}-${group.position}`}
                  className="grid gap-3 rounded-xl border p-4"
                >
                  <div>
                    <p className="mb-2 text-sm font-semibold">
                      Passage {passageIndex + 1}: {passage.title}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#3b82f6]">
                      {group.type.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {group.instructions}
                    </p>
                  </div>
                  <GroupContexts group={group} />
                  <div className="grid gap-3">
                    {group.questions.map((question) => {
                      const item = question.id
                        ? reviewByQuestionId.get(question.id)
                        : undefined
                      if (!item || !question.id) return null
                      const options = (question.content.options ??
                        []) as Option[]
                      return (
                        <ReviewQuestion
                          key={question.id}
                          item={item}
                          options={options}
                        />
                      )
                    })}
                  </div>
                </section>
              )),
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function GroupContexts({ group }: { group: PublicReadingGroup }) {
  const contexts = Array.from(
    new Set(
      group.questions
        .map((question) => question.content.context)
        .filter(
          (context): context is string =>
            typeof context === 'string' && context.trim() !== '',
        ),
    ),
  )
  const images = Array.from(
    new Set(
      group.questions
        .map((question) => question.content.imageUrl)
        .filter(
          (imageUrl): imageUrl is string =>
            typeof imageUrl === 'string' && imageUrl.trim() !== '',
        ),
    ),
  )
  if (contexts.length === 0 && images.length === 0) return null
  return (
    <>
      {images.map((imageUrl) => (
        <img
          key={imageUrl}
          src={imageUrl}
          alt="Diagram for the question group"
          className="max-h-[420px] w-auto max-w-full rounded-lg border object-contain"
        />
      ))}
      {contexts.map((context) => (
        <div
          key={context}
          className="whitespace-pre-wrap rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-700"
        >
          {context
            .replaceAll('{{answer}}', '_____')
            .replace(/\{\{(\d+)\}\}/g, '($1) _____')}
        </div>
      ))}
    </div>
  )
}

// Clean question rendering without nested bordered boxes
function CleanStudentQuestion({
  group,
  question,
  value,
  onAnswer,
}: {
  group: PublicReadingGroup
  question: PublicReadingQuestion
  value: StudentAnswer | undefined
  onAnswer: (questionId: string, answer: StudentAnswer) => void
}) {
  const questionId = question.id
  const options = (question.content.options ?? []) as Option[]
  const values =
    group.type === 'true_false_not_given'
      ? tfngValues
      : group.type === 'yes_no_not_given'
        ? ynngValues
        : null

  const prompt = (
    <p className="font-medium">
      <span className="mr-2 text-[#3b82f6]">
        {questionNumberLabel(question)}.
      </span>
      {question.prompt.replace('{{answer}}', '_____')}
    </div>
  )

  // True / False / Not Given & Yes / No / Not Given
  if (questionId && values) {
    const selected = typeof value?.value === 'string' ? value.value : null
    return (
      <div className="space-y-4">
        {prompt}
        <div className="grid gap-2.5 pt-1">
          {values.map((variant) => {
            const isSelected = selected === variant
            return (
              <label
                key={variant}
                onClick={() => onAnswer(questionId, { value: variant })}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition-all select-none',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50',
                )}
              >
                <span>{variant.replaceAll('_', ' ')}</span>
                <div
                  className={cn(
                    'size-4 rounded-full border flex items-center justify-center transition-colors',
                    isSelected
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300 bg-white',
                  )}
                >
                  {isSelected ? <div className="size-1.5 rounded-full bg-white" /> : null}
                </div>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  // Multiple Choice Options
  if (questionId && options.length > 0) {
    const limit =
      group.type === 'multiple_choice'
        ? multiSelectLimit(group.instructions, [question.content])
        : null

    const isMulti = limit && limit > 1
    const selectedIds = isMulti
      ? Array.isArray(value?.optionIds)
        ? (value.optionIds as unknown[]).filter((id): id is string => typeof id === 'string')
        : []
      : typeof value?.optionId === 'string'
        ? [value.optionId]
        : []

    return (
      <div className="space-y-4">
        {prompt}
        {isMulti ? (
          <p className="text-xs font-medium text-slate-500">
            Выберите до {limit} вариантов:
          </p>
        ) : null}
        <div className="grid gap-2.5 pt-1">
          {options.map((option) => {
            const isSelected = selectedIds.includes(option.id)
            return (
              <label
                key={option.id}
                onClick={() => {
                  if (isMulti) {
                    const next = isSelected
                      ? selectedIds.filter((id) => id !== option.id)
                      : selectedIds.length < limit
                        ? [...selectedIds, option.id]
                        : selectedIds
                    onAnswer(questionId, { optionIds: next })
                  } else {
                    onAnswer(questionId, { optionId: option.id })
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm transition-all select-none',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-medium shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors',
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {option.id}
                  </span>
                  <span>{option.text}</span>
                </div>
                <div
                  className={cn(
                    'size-4 shrink-0 rounded-full border flex items-center justify-center transition-colors',
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white',
                  )}
                >
                  {isSelected ? (
                    <TickCircle className="size-3.5 text-white" aria-hidden />
                  ) : null}
                </div>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  // Text Input (sentence completion / short answer)
  const text = typeof value?.value === 'string' ? value.value : ''
  return (
    <div className="space-y-4">
      {prompt}
      <div className="pt-1">
        <Input
          value={text}
          onChange={(event) => {
            if (questionId) {
              onAnswer(questionId, { value: event.target.value })
            }
          }}
          placeholder="Введите ваш ответ здесь…"
          className="h-11 rounded-xl border-slate-200 bg-white px-4 text-base focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Ответ автоматически сохраняется по мере ввода
        </p>
      </div>
    </div>
  )
}

function questionNumberLabel(question: PublicReadingQuestion) {
  const start =
    typeof question.content.number === 'number'
      ? question.content.number
      : question.position
  const end =
    typeof question.content.numberEnd === 'number'
      ? question.content.numberEnd
      : null
  return end && end > start ? `${start}–${end}` : String(start)
}
