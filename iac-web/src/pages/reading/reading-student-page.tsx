import {
  ArrowLeft,
  ArrowRight,
  Book1,
  TickCircle,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

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
  const [activeMobileTab, setActiveMobileTab] = useState<'passage' | 'questions'>('questions')

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

  const questions = material.questionGroups.flatMap((group) =>
    group.questions.map((question) => ({ group, question })),
  )
  const currentQuestion = questions[activeQuestionIndex]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[1600px] flex-col overflow-hidden px-3 py-3 sm:px-6 sm:py-4">
      {/* Top Header Bar */}
      <header className="mb-3 flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-slate-600 hover:text-slate-900"
          >
            {fullMockSessionId ? (
              <Link
                to="/exam/full-mock-sessions/$sessionId"
                params={{ sessionId: fullMockSessionId }}
              >
                <ArrowLeft className="size-4" aria-hidden />
                <span className="hidden sm:inline">К Full Mock</span>
              </Link>
            ) : (
              <Link to="/dashboard/reading">
                <ArrowLeft className="size-4" aria-hidden />
                <span className="hidden sm:inline">К каталогу</span>
              </Link>
            )}
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
              {material.title}
            </h1>
            <p className="text-xs text-slate-500">
              IELTS Reading · {material.examType === 'academic' ? 'Academic' : 'General Training'}
            </p>
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

      {/* Main Split-View Workspace */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left Column: Reading Passage Text */}
        <section
          className={cn(
            'flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden',
            'w-full lg:w-[54%] xl:w-[56%]',
            activeMobileTab === 'questions' ? 'hidden lg:flex' : 'flex',
          )}
          aria-label="Текст для чтения"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Book1 className="size-4 text-[#3b82f6]" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Reading Passage
              </span>
            </div>
            <span className="text-xs text-slate-400 capitalize">
              Уровень: {material.difficulty}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-[15px] sm:text-base leading-relaxed text-slate-800 selection:bg-blue-100">
            <div className="max-w-none space-y-4 whitespace-pre-wrap font-sans">
              {material.body}
            </div>
          </div>
        </section>

        {/* Right Column: Clean Question & Right Control Panel */}
        <section
          className={cn(
            'flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden',
            'w-full lg:w-[46%] xl:w-[44%]',
            activeMobileTab === 'passage' ? 'hidden lg:flex' : 'flex',
          )}
          aria-label="Вопросы и управление"
        >
          {/* Question Group Header */}
          <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50/80 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-blue-700 uppercase">
                {currentQuestion.group.type.replaceAll('_', ' ')}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Вопрос {activeQuestionIndex + 1} из {totalQuestions}
              </span>
            </div>
            {currentQuestion.group.instructions ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {currentQuestion.group.instructions}
              </p>
            ) : null}
          </div>

          {/* Question Area - Clean, No Nested Boxes */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
            <GroupContexts group={currentQuestion.group} />

            <CleanStudentQuestion
              group={currentQuestion.group}
              question={currentQuestion.question}
              value={currentQuestion.question.id ? answers[currentQuestion.question.id] : undefined}
              onAnswer={session.updateAnswer}
            />
          </div>

          {/* Right Control Panel: Question Palette & Navigation */}
          <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-600">Навигация по вопросам:</span>
              <span className="font-semibold text-slate-700">
                Отвечено: {answeredCount} из {totalQuestions}
              </span>
            </div>

            {/* Quick Jump Palette */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-0.5">
              {questions.map((q, idx) => {
                const isCurrent = idx === activeQuestionIndex
                const isAnswered = Boolean(answers[q.question.id ?? ''])
                return (
                  <button
                    key={q.question.id ?? idx}
                    type="button"
                    onClick={() => {
                      setActiveQuestionIndex(idx)
                      setActiveMobileTab('questions')
                    }}
                    aria-current={isCurrent ? 'true' : undefined}
                    aria-label={`Вопрос ${q.question.position}${isAnswered ? ', отвечен' : ''}`}
                    className={cn(
                      'size-7 sm:size-8 rounded-lg text-xs font-semibold transition-all flex items-center justify-center select-none',
                      isCurrent
                        ? 'bg-[#3b82f6] text-white shadow-xs ring-2 ring-blue-300'
                        : isAnswered
                          ? 'border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    {q.question.position}
                  </button>
                )
              })}
            </div>

            {/* Prev / Next Buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeQuestionIndex === 0}
                onClick={() => {
                  setActiveQuestionIndex((idx) => idx - 1)
                  setActiveMobileTab('questions')
                }}
                className="gap-1.5 rounded-xl text-xs font-medium"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                <span>Назад</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeQuestionIndex === totalQuestions - 1}
                onClick={() => {
                  setActiveQuestionIndex((idx) => idx + 1)
                  setActiveMobileTab('questions')
                }}
                className="gap-1.5 rounded-xl text-xs font-medium"
              >
                <span>Далее</span>
                <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            </div>
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
          <CardHeader>
            <CardTitle>Разбор ответов</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            {material.questionGroups.map((group) => (
              <section key={group.position} className="grid gap-3">
                <h2 className="font-semibold">{group.instructions}</h2>
                <GroupContexts group={group} />
                <div className="grid gap-4">
                  {group.questions.map((question) => {
                    const item = question.id
                      ? reviewByQuestionId.get(question.id)
                      : undefined
                    if (!item || !question.id) return null
                    const options = (question.content.options ?? []) as Option[]
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
            ))}
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
  if (contexts.length === 0) return null
  return (
    <div className="space-y-3">
      {contexts.map((context) => (
        <div
          key={context}
          className="whitespace-pre-wrap rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-700"
        >
          {context.replaceAll('{{answer}}', '_____')}
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
    <div className="text-base font-semibold leading-relaxed text-slate-900">
      <span className="mr-2 inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-[#3b82f6]">
        {question.position}
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
