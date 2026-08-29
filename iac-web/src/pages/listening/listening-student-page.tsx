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
      attempt={startQuery.data.attempt}
      test={startQuery.data.test}
    />
  )
}

function ListeningAttemptRunner({
  attempt,
  test,
}: {
  attempt: Attempt
  test: PublicListeningTest
}) {
  const session = useAttemptSession(attempt.id)

  const deadline = useMemo(
    () =>
      new Date(attempt.startedAt).getTime() + test.durationMinutes * 60_000,
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
    return <ListeningAttemptResult attempt={session.submitted} test={test} />
  }
  if (session.answers === null) {
    return <LoadingState label="Восстанавливаем сохранённые ответы…" />
  }
  const answers = session.answers

  const totalQuestions = test.parts.reduce(
    (sum, part) =>
      sum + part.groups.reduce((acc, group) => acc + group.questions.length, 0),
    0,
  )
  const answeredCount = Object.keys(answers).length

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <Button asChild variant="link" className="h-auto p-0">
          <Link to="/dashboard/listening">
            <ArrowLeft aria-hidden />К Listening
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            {test.title}
          </h1>
          <div className="flex items-center gap-3">
            <SaveIndicator state={session.saveState} />
            <TimeBadge
              seconds={secondsLeft}
              danger={secondsLeft <= TIMER_DANGER_SECONDS}
              label="Оставшееся время"
            />
          </div>
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm text-[#69696d]">
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
        <Card key={part.position} className="shadow-none">
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
          <CardContent className="grid gap-5">
            {part.groups.map((group) => (
              <StudentGroup
                key={group.position}
                group={group}
                answers={answers}
                onAnswer={session.updateAnswer}
              />
            ))}
          </CardContent>
        </Card>
      ))}
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
}: {
  attempt: Attempt
  test: PublicListeningTest
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
          <Link to="/dashboard/listening">
            <ArrowLeft aria-hidden />К Listening
          </Link>
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
  answers,
  onAnswer,
}: {
  group: PublicListeningGroup
  answers: Record<string, StudentAnswer>
  onAnswer: (questionId: string, answer: StudentAnswer) => void
}) {
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
        {group.questions.map((question) => (
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
