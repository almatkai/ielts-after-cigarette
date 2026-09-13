import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Clock3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAttemptSession } from '@/features/attempts/attempt-session'
import {
  AttemptResultSummary,
  AttemptSubmitBar,
  ChoiceOptions,
  ErrorState,
  LoadingState,
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
    return <LoadingState label="Готовим материал…" />
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

  // У reading нет лимита времени — показываем прошедшее время от startedAt.
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
    return <LoadingState label="Восстанавливаем сохранённые ответы…" />
  }
  const answers = session.answers

  const questions = material.questionGroups.flatMap((group) =>
    group.questions.map((question) => ({ group, question })),
  )
  const currentQuestion = questions[activeQuestionIndex]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length

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
            <TimeBadge seconds={elapsedSeconds} label="Прошедшее время" />
          </div>
        </div>
        <p className="sr-only">
          <Clock3 className="size-4" aria-hidden />
          {material.examType} · {material.difficulty} · ответы сохраняются
          автоматически
        </p>
      </div>
      {session.submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#e23b3b]"
        >
          Не удалось отправить тест: {session.submitError}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <Card className="max-h-[28dvh] shrink-0 overflow-y-auto shadow-none">
          <CardHeader>
            <CardTitle>Текст</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-6">
              {material.body}
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
              Вопрос {activeQuestionIndex + 1} из {totalQuestions}
            </p>
            <Button
              type="button"
              disabled={activeQuestionIndex === totalQuestions - 1}
              onClick={() => setActiveQuestionIndex((index) => index + 1)}
            >
              Далее
            </Button>
          </div>
          <AttemptSubmitBar
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
            isSubmitting={session.isSubmitting}
            onSubmit={session.submit}
          />
        </div>
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
              <ArrowLeft aria-hidden />К Reading
            </Link>
          )}
        </Button>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {material.title}: результат
        </h1>
      </div>
      <AttemptResultSummary attempt={attempt} review={review} />
      {detailQuery.isError ? (
        <ErrorState
          title="Не удалось загрузить разбор"
          message={getErrorMessage(detailQuery.error)}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : review === null ? (
        <LoadingState label="Загружаем разбор ответов…" />
      ) : (
        <Card className="shadow-none">
          <CardContent className="grid gap-5 p-5">
            {material.questionGroups.map((group) => (
              <section
                key={group.position}
                className="grid gap-3 rounded-xl border p-4"
              >
                <div>
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

// Общие текстовые блоки группы (например, текст summary для
// summary_completion) лежат в content.context вопросов — показываем каждый
// уникальный блок один раз.
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
    <>
      {contexts.map((context) => (
        <div
          key={context}
          className="whitespace-pre-wrap rounded-lg bg-[#f7f7f5] p-4 text-sm"
        >
          {context.replaceAll('{{answer}}', '_____')}
        </div>
      ))}
    </>
  )
}

function StudentGroup({
  group,
  activeQuestionId,
  answers,
  onAnswer,
}: {
  group: PublicReadingGroup
  activeQuestionId?: string
  answers: Record<string, StudentAnswer>
  onAnswer: (questionId: string, answer: StudentAnswer) => void
}) {
  const questions = activeQuestionId
    ? group.questions.filter((question) => question.id === activeQuestionId)
    : group.questions
  if (questions.length === 0) return null
  return (
    <section className="grid gap-3 rounded-xl border p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#3b82f6]">
          {group.type.replaceAll('_', ' ')}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{group.instructions}</p>
      </div>
      <GroupContexts group={group} />
      <div className="grid gap-4">
        {questions.map((question) => (
          <StudentQuestion
            key={question.id ?? question.position}
            group={group}
            question={question}
            value={question.id ? answers[question.id] : undefined}
            onAnswer={onAnswer}
          />
        ))}
      </div>
    </section>
  )
}

function StudentQuestion({
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
      <span className="mr-2 text-[#3b82f6]">{question.position}.</span>
      {question.prompt.replace('{{answer}}', '_____')}
    </p>
  )

  if (questionId && values) {
    const selected = typeof value?.value === 'string' ? value.value : null
    return (
      <div className="grid gap-2">
        {prompt}
        <div className="flex flex-wrap gap-2">
          {values.map((variant) => (
            <label
              key={variant}
              className="flex cursor-pointer gap-2 rounded-lg border bg-white p-3 text-sm"
            >
              <input
                type="radio"
                name={`q-${group.position}-${question.position}`}
                value={variant}
                checked={selected === variant}
                onChange={() => onAnswer(questionId, { value: variant })}
              />
              <span>{variant.replaceAll('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  if (questionId && options.length > 0) {
    const limit =
      group.type === 'multiple_choice'
        ? multiSelectLimit(group.instructions, [question.content])
        : null
    return (
      <div className="grid gap-2">
        {prompt}
        <ChoiceOptions
          name={`q-${group.position}-${question.position}`}
          options={options}
          limit={limit}
          value={value}
          onAnswer={(answer) => onAnswer(questionId, answer)}
        />
      </div>
    )
  }

  const text = typeof value?.value === 'string' ? value.value : ''
  return (
    <div className="grid gap-2">
      {prompt}
      <Input
        value={text}
        onChange={(event) => {
          if (questionId) {
            onAnswer(questionId, { value: event.target.value })
          }
        }}
        placeholder="Ваш ответ"
      />
    </div>
  )
}
