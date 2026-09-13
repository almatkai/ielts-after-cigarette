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
  startListeningAttempt,
} from '@/features/attempts/api'
import type { Attempt, StudentAnswer } from '@/features/attempts/api'
import { getListeningMediaBlob } from '@/features/listening/api'
import type {
  PublicListeningGroup,
  PublicListeningQuestion,
  PublicListeningTest,
} from '@/features/listening/api'
import { getErrorMessage } from '@/lib/api/client'

const TIMER_DANGER_SECONDS = 300

export function ListeningStudentPage({ testId }: { testId: string }) {
  const startQuery = useQuery({
    queryKey: ['listening', 'tests', testId, 'attempt'],
    queryFn: ({ signal }) => startListeningAttempt(testId, signal),
  })
  if (startQuery.isPending) {
    return <LoadingState label="Готовим тест…" />
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
    <ListeningAttemptRunner
      key={startQuery.data.attempt.id}
      attempt={startQuery.data.attempt}
      test={startQuery.data.test}
    />
  )
}

export function ListeningAttemptRunner({
  attempt,
  test,
  fullMockSessionId,
}: {
  attempt: Attempt
  test: PublicListeningTest
  fullMockSessionId?: string
}) {
  const session = useAttemptSession(attempt.id)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)

  const deadline = useMemo(
    () => new Date(attempt.startedAt).getTime() + test.durationMinutes * 60_000,
    [attempt.startedAt, test.durationMinutes],
  )
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((deadline - Date.now()) / 1000)),
  )
  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [deadline])

  // Авто-submit по истечении времени.
  useEffect(() => {
    if (secondsLeft === 0 && !session.submitted) session.submit()
  }, [secondsLeft, session])

  if (session.submitted) {
    return (
      <ListeningAttemptResult
        attempt={session.submitted}
        test={test}
        fullMockSessionId={fullMockSessionId}
      />
    )
  }
  if (session.answers === null) {
    return <LoadingState label="Восстанавливаем сохранённые ответы…" />
  }
  const answers = session.answers

  const questions = test.parts.flatMap((part) =>
    part.groups.flatMap((group) =>
      group.questions.map((question) => ({ group, part, question })),
    ),
  )
  const currentQuestion = questions[activeQuestionIndex]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
      <div>
        <Button asChild variant="link" className="sr-only">
          <Link to="/dashboard/listening">
            <ArrowLeft aria-hidden />К Listening
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="sr-only">{test.title}</h1>
          <div className="flex items-center gap-3">
            <SaveIndicator state={session.saveState} />
            <TimeBadge
              seconds={secondsLeft}
              danger={secondsLeft <= TIMER_DANGER_SECONDS}
              label="Оставшееся время"
            />
          </div>
        </div>
        <p className="sr-only">
          <Clock3 className="size-4" aria-hidden />
          {test.durationMinutes} минут · ответы сохраняются автоматически
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
      {test.parts.map((part) => (
        <Card
          key={part.position}
          className={
            part === currentQuestion.part
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden shadow-none'
              : 'hidden'
          }
        >
          <CardHeader>
            <CardTitle>
              Part {part.position}: {part.title}
            </CardTitle>
            {part.audioAssetId ? (
              <ProtectedAudio assetId={part.audioAssetId} />
            ) : (
              <p className="text-sm text-amber-700">
                Аудио ещё не прикреплено.
              </p>
            )}
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            {part.groups.map((group) => (
              <StudentGroup
                key={group.position}
                group={group}
                activeQuestionId={currentQuestion.question.id}
                answers={answers}
                onAnswer={session.updateAnswer}
              />
            ))}
          </CardContent>
        </Card>
      ))}
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
  )
}

function ListeningAttemptResult({
  attempt,
  test,
  fullMockSessionId,
}: {
  attempt: Attempt
  test: PublicListeningTest
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
            <Link to="/dashboard/listening">
              <ArrowLeft aria-hidden />К Listening
            </Link>
          )}
        </Button>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {test.title}: результат
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
        test.parts.map((part) => (
          <Card key={part.position} className="shadow-none">
            <CardHeader>
              <CardTitle>
                Part {part.position}: {part.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              {part.groups.map((group) => (
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
                  {group.imageAssetId ? (
                    <ProtectedImage assetId={group.imageAssetId} />
                  ) : null}
                  {group.context ? (
                    <div className="whitespace-pre-wrap rounded-lg bg-[#f7f7f5] p-4 text-sm">
                      {group.context}
                    </div>
                  ) : null}
                  <div className="grid gap-3">
                    {group.questions.map((question) => {
                      const item = question.id
                        ? reviewByQuestionId.get(question.id)
                        : undefined
                      if (!item || !question.id) return null
                      const options = (question.content.options ??
                        group.config.options ??
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
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function ProtectedAudio({ assetId }: { assetId: string }) {
  const query = useQuery({
    queryKey: ['listening', 'media', assetId],
    queryFn: () => getListeningMediaBlob(assetId),
  })
  const url = useMemo(
    () => (query.data ? URL.createObjectURL(query.data) : null),
    [query.data],
  )
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  if (query.isPending) return <span className="text-sm">Загружаем аудио…</span>
  return url ? (
    <audio className="mt-3 w-full" controls preload="metadata" src={url} />
  ) : (
    <span>Аудио недоступно</span>
  )
}

function ProtectedImage({ assetId }: { assetId: string }) {
  const query = useQuery({
    queryKey: ['listening', 'media', assetId],
    queryFn: () => getListeningMediaBlob(assetId),
  })
  const url = useMemo(
    () => (query.data ? URL.createObjectURL(query.data) : null),
    [query.data],
  )
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  return url ? (
    <img
      className="max-h-[520px] w-full rounded-lg border object-contain"
      src={url}
      alt="Схема задания Listening"
    />
  ) : null
}

function StudentGroup({
  group,
  activeQuestionId,
  answers,
  onAnswer,
}: {
  group: PublicListeningGroup
  activeQuestionId?: string
  answers: Record<string, StudentAnswer>
  onAnswer: (questionId: string, answer: StudentAnswer) => void
}) {
  const questions = activeQuestionId
    ? group.questions.filter((question) => question.id === activeQuestionId)
    : group.questions
  if (questions.length === 0) return null
  const shared = (group.config.options ?? []) as Option[]
  return (
    <section className="grid gap-3 rounded-xl border p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#3b82f6]">
          {group.type.replaceAll('_', ' ')}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{group.instructions}</p>
      </div>
      {group.imageAssetId ? (
        <ProtectedImage assetId={group.imageAssetId} />
      ) : null}
      {group.context ? (
        <div className="whitespace-pre-wrap rounded-lg bg-[#f7f7f5] p-4 text-sm">
          {group.context}
        </div>
      ) : null}
      <div className="grid gap-4">
        {questions.map((question) => (
          <StudentQuestion
            key={question.id ?? question.number}
            group={group}
            question={question}
            sharedOptions={shared}
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
  sharedOptions,
  value,
  onAnswer,
}: {
  group: PublicListeningGroup
  question: PublicListeningQuestion
  sharedOptions: Option[]
  value: StudentAnswer | undefined
  onAnswer: (questionId: string, answer: StudentAnswer) => void
}) {
  const options = (question.content.options ?? sharedOptions) as Option[]
  const questionId = question.id
  const limit = multiSelectLimit(group.instructions, [
    question.content,
    group.config,
  ])

  const prompt = (
    <p className="font-medium">
      <span className="mr-2 text-[#3b82f6]">{question.number}.</span>
      {question.prompt.replace('{{answer}}', '_____')}
    </p>
  )

  if (!questionId || options.length === 0) {
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

  return (
    <div className="grid gap-2">
      {prompt}
      <ChoiceOptions
        name={`q-${question.number}`}
        options={options}
        limit={limit}
        value={value}
        onAnswer={(answer) => onAnswer(questionId, answer)}
      />
    </div>
  )
}
