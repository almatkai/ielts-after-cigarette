import { ArrowLeft, Clock, CloseCircle, TickCircle } from 'iconsax-react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAttemptSession } from '@/features/attempts/attempt-session'
import { usePreviewSession } from '@/features/attempts/preview-session'
import type { AttemptSession } from '@/features/attempts/preview-session'
import { useExamTimer } from '@/features/attempts/exam-timer'
import { ExamAttemptShell } from '@/features/attempts/attempt-controller'
import {
  AttemptPerformanceReport,
  AttemptResultHeader,
  AttemptSubmitBar,
  ChoiceOptions,
  EnhancedReviewQuestion,
  ErrorState,
  ExamLoadingScreen,
  LoadingState,
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
import type { PreviewAnswerKeys } from '@/features/admin/preview-api'
import {
  PreviewAnswer,
  PreviewEvidenceText,
} from '@/features/admin/preview-answer'

const TIMER_DANGER_SECONDS = 300

export function ListeningStudentPage({
  testId,
  fullMockSessionId,
}: {
  testId: string
  fullMockSessionId?: string
}) {
  return (
    <ExamAttemptShell<PublicListeningTest>
      skillBadge="IELTS Listening"
      loadingLabel="Готовим аудирование…"
      loadingDescription="Загружаем аудиотрек, формируем секции вопросов и проверяем готовность плеера."
      queryKey={['listening', 'tests', testId, 'attempt']}
      startAttemptFn={(signal) => startListeningAttempt(testId, signal)}
      renderRunner={({ attempt, material, onSubmitted }) => (
        <ListeningAttemptRunner
          key={attempt.id}
          attempt={attempt}
          test={material}
          fullMockSessionId={fullMockSessionId}
          onSubmitted={onSubmitted}
        />
      )}
      renderResult={({ attempt, material, onRetake, isRetaking }) => (
        <ListeningAttemptResult
          attempt={attempt}
          test={material}
          fullMockSessionId={fullMockSessionId}
          onRetake={onRetake}
          isRetaking={isRetaking}
        />
      )}
    />
  )
}

type ListeningRunnerProps = {
  attempt: Attempt
  test: PublicListeningTest
  fullMockSessionId?: string
  onSubmitted?: (attempt: Attempt) => void
}

export function ListeningAttemptRunner(props: ListeningRunnerProps) {
  const session = useAttemptSession(props.attempt.id)
  return <ListeningTestRunner {...props} session={session} />
}

export function ListeningPreviewRunner({
  test,
  timerEnabled,
  answerKeys,
}: {
  test: PublicListeningTest
  timerEnabled: boolean
  answerKeys: PreviewAnswerKeys
}) {
  const session = usePreviewSession()
  return (
    <ListeningTestRunner
      test={test}
      session={session}
      answerKeys={answerKeys}
      preview
      timerEnabled={timerEnabled}
    />
  )
}

function ListeningTestRunner({
  attempt,
  test,
  fullMockSessionId,
  onSubmitted,
  session,
  preview = false,
  timerEnabled = true,
  answerKeys,
}: Omit<ListeningRunnerProps, 'attempt'> & {
  attempt?: Attempt
  session: AttemptSession
  preview?: boolean
  timerEnabled?: boolean
  answerKeys?: PreviewAnswerKeys
}) {
  const [revealedQuestionId, setRevealedQuestionId] = useState<string | null>(
    null,
  )
  const autoSubmitStarted = useRef(false)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [emptyPartIndex, setEmptyPartIndex] = useState(0)

  const sharedAudioAssetId = useMemo(
    () =>
      test.parts.length > 0 &&
      test.parts[0].audioAssetId &&
      test.parts.every(
        (part) => part.audioAssetId === test.parts[0].audioAssetId,
      )
        ? test.parts[0].audioAssetId
        : null,
    [test.parts],
  )

  const targetAudioIds = useMemo(() => {
    if (sharedAudioAssetId) return [sharedAudioAssetId]
    const ids: string[] = []
    for (const part of test.parts) {
      if (part.audioAssetId && !ids.includes(part.audioAssetId)) {
        ids.push(part.audioAssetId)
      }
    }
    return ids
  }, [sharedAudioAssetId, test.parts])

  const audioQueries = useQueries({
    queries: targetAudioIds.map((id) => ({
      queryKey: ['listening', 'media', id],
      queryFn: () => getListeningMediaBlob(id),
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60,
      // Media blobs either exist or they don't: a retry storm on 4xx/5xx
      // hammers the API (see the 15-request waterfall on missing audio).
      retry: false,
    })),
  })

  const targetImageIds = useMemo(() => {
    const ids: string[] = []
    for (const part of test.parts) {
      for (const group of part.groups) {
        if (group.imageAssetId && !ids.includes(group.imageAssetId)) {
          ids.push(group.imageAssetId)
        }
      }
    }
    return ids
  }, [test.parts])

  const imageQueries = useQueries({
    queries: targetImageIds.map((id) => ({
      queryKey: ['listening', 'media', id],
      queryFn: () => getListeningMediaBlob(id),
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60,
      retry: false,
    })),
  })

  const hasAudio = targetAudioIds.length > 0
  const isAudioReady = !hasAudio || audioQueries.every((q) => !q.isPending)
  const hasImages = targetImageIds.length > 0
  const isImagesReady = !hasImages || imageQueries.every((q) => !q.isPending)

  const isReady =
    session.answers !== null &&
    isAudioReady &&
    isImagesReady &&
    !session.loadError

  const durationMinutes = test.durationMinutes > 0 ? test.durationMinutes : 40
  const totalDurationSeconds = durationMinutes * 60
  const { deadline, secondsLeft } = useExamTimer({
    attempt,
    storagePrefix: 'iac_listening_deadline_',
    durationSeconds: totalDurationSeconds,
    ready: isReady,
    enabled: timerEnabled,
    finished: Boolean(session.submitted),
  })

  // Авто-submit по истечении времени.
  useEffect(() => {
    if (
      !preview &&
      deadline !== null &&
      secondsLeft === 0 &&
      session.answers !== null &&
      !session.submitted &&
      !autoSubmitStarted.current
    ) {
      autoSubmitStarted.current = true
      session.submit()
    }
  }, [
    preview,
    deadline,
    secondsLeft,
    session.answers,
    session.submitted,
    session.submit,
  ])

  useEffect(() => {
    if (session.submitted && onSubmitted) {
      onSubmitted(session.submitted)
    }
  }, [session.submitted, onSubmitted])

  if (session.submitted) {
    return (
      <ListeningAttemptResult
        attempt={session.submitted}
        test={test}
        fullMockSessionId={fullMockSessionId}
      />
    )
  }
  if (session.loadError) {
    return (
      <ErrorState
        title="Не удалось восстановить ответы"
        message={session.loadError}
        onRetry={session.retryLoad}
      />
    )
  }
  if (!isReady || session.answers === null) {
    return (
      <ExamLoadingScreen
        badge="IELTS Listening"
        label="Готовим аудирование…"
        description="Загружаем аудиотрек, формируем секции вопросов и проверяем готовность плеера…"
      />
    )
  }
  const answers = session.answers

  const questions = test.parts.flatMap((part) =>
    part.groups.flatMap((group) =>
      group.questions.map((question) => ({ group, part, question })),
    ),
  )
  const currentQuestion = questions.at(activeQuestionIndex)
  const currentPart = currentQuestion?.part ?? test.parts[emptyPartIndex]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
      <div>
        <Button asChild variant="link" className="sr-only">
          {preview ? (
            <Link
              to="/admin/listening/tests/$testId"
              params={{ testId: test.id }}
            >
              <ArrowLeft aria-hidden />К редактору
            </Link>
          ) : (
            <Link to="/listening">
              <ArrowLeft aria-hidden />К Listening
            </Link>
          )}
        </Button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="sr-only">{test.title}</h1>
          <div className="flex items-center gap-3">
            {!preview ? <SaveIndicator state={session.saveState} /> : null}
            {timerEnabled ? (
              <TimeBadge
                seconds={secondsLeft}
                danger={
                  deadline !== null && secondsLeft <= TIMER_DANGER_SECONDS
                }
                label="Оставшееся время"
              />
            ) : null}
          </div>
        </div>
        <p className="sr-only">
          <Clock className="size-4" aria-hidden />
          {test.durationMinutes} минут ·{' '}
          {preview
            ? 'пробные ответы не сохраняются'
            : 'ответы сохраняются автоматически'}
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
      {sharedAudioAssetId ? (
        <Card className="shrink-0 shadow-none">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold">Аудио полного теста</p>
            <ProtectedAudio assetId={sharedAudioAssetId} />
          </CardContent>
        </Card>
      ) : null}
      {test.parts.length === 0 ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          В тесте ещё нет частей. Добавьте их в редакторе.
        </p>
      ) : null}
      <nav aria-label="Части Listening" className="flex flex-wrap gap-2">
        {test.parts.map((part, index) => (
          <Button
            key={part.position}
            type="button"
            variant={part === currentPart ? 'default' : 'outline'}
            onClick={() => {
              setEmptyPartIndex(index)
              const target = questions.findIndex((item) => item.part === part)
              setActiveQuestionIndex(target >= 0 ? target : questions.length)
            }}
          >
            Part {part.position}
          </Button>
        ))}
      </nav>
      {test.parts.map((part) => (
        <Card
          key={part.position}
          className={
            part === currentPart
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden shadow-none'
              : 'hidden'
          }
        >
          <CardHeader>
            <CardTitle>
              Part {part.position}: {part.title}
            </CardTitle>
            {!sharedAudioAssetId && part.audioAssetId ? (
              <ProtectedAudio assetId={part.audioAssetId} />
            ) : !sharedAudioAssetId ? (
              <p className="text-sm text-amber-700">
                Аудио ещё не прикреплено.
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            {part.groups.every((group) => group.questions.length === 0) ? (
              <p role="status" className="text-sm text-amber-700">
                В этой части ещё нет вопросов. Добавьте их в редакторе.
              </p>
            ) : null}
            {part.groups.map((group) => (
              <StudentGroup
                key={group.position}
                group={group}
                activeQuestionId={currentQuestion?.question.id}
                answers={answers}
                onAnswer={session.updateAnswer}
                preview={preview}
                answerKeys={answerKeys}
                evidenceText={
                  part.transcript ||
                  part.transcriptSegments
                    ?.map((segment) => segment.text)
                    .join('\n')
                }
                revealedQuestionId={revealedQuestionId}
                onToggleExplanation={(questionId) =>
                  setRevealedQuestionId((current) =>
                    current === questionId ? null : questionId,
                  )
                }
              />
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e7e7e4] bg-white p-3">
        <Button
          type="button"
          variant="outline"
          disabled={!currentQuestion || activeQuestionIndex === 0}
          onClick={() => setActiveQuestionIndex((index) => index - 1)}
        >
          Назад
        </Button>
        <p className="text-sm text-[#69696d]">
          Вопрос {currentQuestion ? activeQuestionIndex + 1 : '—'} из{' '}
          {totalQuestions}
        </p>
        <Button
          type="button"
          disabled={
            !currentQuestion || activeQuestionIndex === totalQuestions - 1
          }
          onClick={() => setActiveQuestionIndex((index) => index + 1)}
        >
          Далее
        </Button>
      </div>
      {!preview ? (
        <AttemptSubmitBar
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          isSubmitting={session.isSubmitting}
          onSubmit={session.submit}
        />
      ) : null}
    </div>
  )
}

export function ListeningAttemptResult({
  attempt,
  test,
  fullMockSessionId,
  onRetake,
  isRetaking,
}: {
  attempt: Attempt
  test: PublicListeningTest
  fullMockSessionId?: string
  onRetake?: () => Promise<void> | void
  isRetaking?: boolean
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

  const [filterStatus, setFilterStatus] = useState<
    'all' | 'errors' | 'correct'
  >('all')

  const totalQuestions = review ? review.length : (attempt.maxScore ?? 40)
  const correctCount = review
    ? review.filter((i) => i.isCorrect).length
    : (attempt.score ?? 0)
  const incorrectCount = review ? review.filter((i) => !i.isCorrect).length : 0

  const scrollToQuestion = (questionId: string) => {
    const el = document.getElementById(`review-q-${questionId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 p-3 sm:p-6 lg:p-8">
      <AttemptResultHeader
        skill="listening"
        fullMockSessionId={fullMockSessionId}
        onRetake={onRetake}
        isRetaking={isRetaking}
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {test.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          IELTS Academic Listening · {test.parts.length} секции ·{' '}
          {totalQuestions} вопросов
        </p>
      </div>

      <AttemptPerformanceReport
        band={attempt.band}
        bandNote="Балл рассчитан по стандарту аудирования IELTS"
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        durationMinutes={test.durationMinutes}
        paceUnit="вопрос"
      />

      {/* ПАНЕЛЬ ФИЛЬТРОВ И БЫСТРОГО ПЕРЕХОДА */}
      <Card className="rounded-[16px] border border-[#e7e7e4] bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={cn(
                'rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all',
                filterStatus === 'all'
                  ? 'bg-[#3b82f6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              Все вопросы ({totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('errors')}
              className={cn(
                'flex items-center gap-1 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all',
                filterStatus === 'errors'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100',
              )}
            >
              <CloseCircle className="size-3.5" />
              <span>Ошибки ({incorrectCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('correct')}
              className={cn(
                'flex items-center gap-1 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all',
                filterStatus === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100',
              )}
            >
              <TickCircle className="size-3.5" />
              <span>Верные ({correctCount})</span>
            </button>
          </div>
        </div>

        {review && review.length > 0 && (
          <div className="pt-2 border-t border-[#ededeb]">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Навигация по номерам вопросов (клик для перехода):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {review.map((item) => {
                const isCorrect = item.isCorrect
                return (
                  <button
                    key={item.questionId}
                    type="button"
                    onClick={() => scrollToQuestion(item.questionId)}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-[7px] border text-xs font-semibold transition-all select-none',
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100',
                    )}
                    title={`Вопрос ${item.number}: ${isCorrect ? 'Верно' : 'Ошибка'}`}
                  >
                    {item.number}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {detailQuery.isError ? (
        <ErrorState
          title="Не удалось загрузить разбор"
          message={getErrorMessage(detailQuery.error)}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : review === null ? (
        <LoadingState label="Загружаем разбор ответов…" />
      ) : (
        test.parts.map((part) => {
          const partHasMatchingQuestions = part.groups.some((group) =>
            group.questions.some((q) => {
              if (!q.id) return false
              const item = reviewByQuestionId.get(q.id)
              if (!item) return false
              if (filterStatus === 'errors') return !item.isCorrect
              if (filterStatus === 'correct') return item.isCorrect
              return true
            }),
          )
          if (!partHasMatchingQuestions) return null

          return (
            <div key={part.position} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Part {part.position}: {part.title}
              </h2>
              {part.groups.map((group) => {
                const matchingQuestions = group.questions.filter((q) => {
                  if (!q.id) return false
                  const item = reviewByQuestionId.get(q.id)
                  if (!item) return false
                  if (filterStatus === 'errors') return !item.isCorrect
                  if (filterStatus === 'correct') return item.isCorrect
                  return true
                })
                if (matchingQuestions.length === 0) return null

                return (
                  <Card
                    key={group.position}
                    className="rounded-[16px] border border-[#e7e7e4] bg-white p-5 shadow-xs space-y-4"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#3b82f6]">
                        {group.type.replaceAll('_', ' ')}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {group.instructions}
                      </p>
                    </div>
                    {group.imageAssetId ? (
                      <ProtectedImage assetId={group.imageAssetId} />
                    ) : null}
                    {group.context ? (
                      <div className="whitespace-pre-wrap rounded-lg bg-[#f7f7f5] p-4 text-sm text-slate-800">
                        {group.context}
                      </div>
                    ) : null}
                    <div className="space-y-3.5">
                      {matchingQuestions.map((question) => {
                        const item = question.id
                          ? reviewByQuestionId.get(question.id)
                          : undefined
                        if (!item || !question.id) return null
                        const options = (question.content.options ??
                          group.config.options ??
                          []) as Option[]
                        return (
                          <EnhancedReviewQuestion
                            key={question.id}
                            item={item}
                            options={options}
                          />
                        )
                      })}
                    </div>
                  </Card>
                )
              })}
            </div>
          )
        })
      )}
    </div>
  )
}

function ProtectedAudio({ assetId }: { assetId: string }) {
  const query = useQuery({
    queryKey: ['listening', 'media', assetId],
    queryFn: () => getListeningMediaBlob(assetId),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    retry: false,
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
  if (query.isPending) {
    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
        <span className="inline-block size-2 animate-pulse rounded-full bg-blue-500" />
        <span>Загружаем аудио…</span>
      </div>
    )
  }
  return url ? (
    <audio className="mt-3 w-full" controls preload="metadata" src={url} />
  ) : (
    <span className="text-sm text-amber-700">Аудио недоступно</span>
  )
}

function ProtectedImage({ assetId }: { assetId: string }) {
  const query = useQuery({
    queryKey: ['listening', 'media', assetId],
    queryFn: () => getListeningMediaBlob(assetId),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    retry: false,
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
  ) : (
    <p role="status" className="text-sm text-amber-700">
      {query.isPending
        ? 'Загружаем изображение…'
        : 'Изображение недоступно. Проверьте файл в редакторе.'}
    </p>
  )
}

function StudentGroup({
  group,
  activeQuestionId,
  answers,
  onAnswer,
  preview = false,
  answerKeys,
  evidenceText,
  revealedQuestionId,
  onToggleExplanation,
}: {
  group: PublicListeningGroup
  activeQuestionId?: string
  answers: Record<string, StudentAnswer>
  onAnswer: (questionId: string, answer: StudentAnswer) => void
  preview?: boolean
  answerKeys?: PreviewAnswerKeys
  evidenceText?: string
  revealedQuestionId?: string | null
  onToggleExplanation?: (questionId: string) => void
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
        {questions.map((question) => {
          const answerKey = question.id ? answerKeys?.[question.id] : undefined
          const open = Boolean(
            question.id && revealedQuestionId === question.id,
          )
          return (
            <div key={question.id ?? question.number}>
              <StudentQuestion
                group={group}
                question={question}
                sharedOptions={shared}
                value={question.id ? answers[question.id] : undefined}
                onAnswer={onAnswer}
              />
              {preview ? (
                <>
                  <PreviewAnswer
                    answerKey={answerKey}
                    options={(question.content.options ?? shared) as Option[]}
                    open={open}
                    onToggle={() => {
                      if (question.id) onToggleExplanation?.(question.id)
                    }}
                    evidenceText={evidenceText}
                  />
                  {open && evidenceText && answerKey?.quote.trim() ? (
                    <div className="mt-3 rounded-xl border p-4">
                      <p className="mb-2 text-sm font-semibold">
                        Текст аудио — место ответа
                      </p>
                      <div className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
                        <PreviewEvidenceText
                          body={evidenceText}
                          quote={answerKey.quote}
                        />
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          )
        })}
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
