import { FullMockSectionComplete } from '@/pages/fullmock/full-mock-section-complete'
import { ArrowLeft, Book, Edit2 } from 'iconsax-react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useAttemptDetail } from '@/features/attempts/use-attempt-detail'
import { Link } from '@tanstack/react-router'
import { useEffect, useId, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  useAttemptSession,
  useContinueLater,
} from '@/features/attempts/attempt-session'
import { ExamAttemptShell } from '@/features/attempts/attempt-controller'
import { useExamTimer } from '@/features/attempts/exam-timer'
import { attemptStartQueryKey } from '@/features/attempts/exam-attempt-routes'
import {
  AttemptPerformanceReport,
  AttemptResultHeader,
  AttemptSubmitBar,
  ErrorState,
  ExamLoadingScreen,
  SaveIndicator,
  TimeBadge,
} from '@/features/attempts/attempt-ui'
import { startWritingAttempt } from '@/features/attempts/api'
import type {
  Attempt,
  AttemptDetail,
  WritingAnnotation,
  WritingEvaluation,
  WritingTaskFeedback,
} from '@/features/attempts/api'
import { getWritingMediaBlob } from '@/features/writing/api'
import type { PublicWritingMaterial, WritingTask } from '@/features/writing/api'
import { getErrorMessage } from '@/lib/api/client'
import { tr } from '@/lib/i18n'

export function WritingStudentPage({
  materialId,
  fullMockSessionId,
}: {
  materialId: string
  fullMockSessionId?: string
}) {
  return (
    <ExamAttemptShell<PublicWritingMaterial>
      skillBadge="IELTS Writing"
      loadingLabel={'Preparing Writing tasks…'}
      loadingDescription="Loading task prompts and word-count requirements, and preparing the essay editor."
      queryKey={attemptStartQueryKey('writing', materialId)}
      startAttemptFn={(signal) => startWritingAttempt(materialId, signal)}
      renderRunner={({ attempt, material, onSubmitted }) => (
        <WritingAttemptRunner
          key={attempt.id}
          attempt={attempt}
          material={material}
          fullMockSessionId={fullMockSessionId}
          onSubmitted={onSubmitted}
        />
      )}
      renderResult={({ attempt, material, onRetake, isRetaking }) => (
        <WritingAttemptResult
          attempt={attempt}
          material={material}
          fullMockSessionId={fullMockSessionId}
          onRetake={onRetake}
          isRetaking={isRetaking}
        />
      )}
    />
  )
}

export function WritingAttemptRunner({
  attempt,
  material,
  fullMockSessionId,
  sectionDeadlineAt,
  onSubmitted,
}: {
  attempt: Attempt
  material: PublicWritingMaterial
  fullMockSessionId?: string
  sectionDeadlineAt?: string | null
  onSubmitted?: (attempt: Attempt) => void
}) {
  const session = useAttemptSession(attempt.id)
  const [activeTaskIndex, setActiveTaskIndex] = useState(0)

  const targetImageIds = useMemo(() => {
    const ids: string[] = []
    for (const task of material.tasks) {
      if (task.visualAssetId && !ids.includes(task.visualAssetId)) {
        ids.push(task.visualAssetId)
      }
    }
    return ids
  }, [material.tasks])

  const imageQueries = useQueries({
    queries: targetImageIds.map((id) => ({
      queryKey: ['writing', 'media', id],
      queryFn: () => getWritingMediaBlob(id),
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60,
      retry: false,
    })),
  })

  const hasImages = targetImageIds.length > 0
  const isImagesReady = !hasImages || imageQueries.every((q) => !q.isPending)
  const isReady =
    session.answers !== null && isImagesReady && !session.loadError

  const handleContinueLater = useContinueLater(session, { fullMockSessionId })

  const durationMinutes =
    material.durationMinutes > 0 ? material.durationMinutes : 60
  const durationSeconds = durationMinutes * 60
  // Same storage prefix as the previous hand-rolled deadline, so existing
  // drafts keep their remaining time across the migration.
  const { secondsLeft } = useExamTimer({
    attempt,
    storagePrefix: 'iac_writing_deadline_',
    durationSeconds,
    ready: isReady,
    finished: Boolean(session.submitted),
    deadlineAt: sectionDeadlineAt,
  })

  useEffect(() => {
    if (session.submitted && onSubmitted) {
      onSubmitted(session.submitted)
    }
  }, [session.submitted, onSubmitted])

  if (session.submitted) {
    return (
      <WritingAttemptResult
        attempt={session.submitted}
        material={material}
        fullMockSessionId={fullMockSessionId}
      />
    )
  }
  if (session.loadError) {
    return (
      <ErrorState
        title={'Could not restore your answers'}
        message={session.loadError}
        onRetry={session.retryLoad}
      />
    )
  }
  if (!isReady || session.answers === null) {
    return (
      <ExamLoadingScreen
        badge="IELTS Writing"
        label={'Preparing Writing…'}
        description="Loading essay tasks and images, and restoring your drafts…"
      />
    )
  }
  const answeredCount = material.tasks.filter((task) => {
    const value = session.answers?.[task.id]?.value
    return typeof value === 'string' && value.trim().length > 0
  }).length
  const activeTask = material.tasks[activeTaskIndex]
  const activeTaskValue = Object.prototype.hasOwnProperty.call(
    session.answers,
    activeTask.id,
  )
    ? session.answers[activeTask.id].value
    : undefined
  const activeTaskText =
    typeof activeTaskValue === 'string' ? activeTaskValue : ''
  const allTasksAnswered = material.tasks.every((task) => {
    const value = session.answers?.[task.id]?.value
    return typeof value === 'string' && value.trim().length > 0
  })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
      <div>
        <Button asChild variant="link" className="sr-only">
          <Link to="/writing">
            <ArrowLeft aria-hidden />
            {'Back to Writing'}
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="sr-only">{material.title}</h1>
          <div className="flex items-center gap-3">
            <SaveIndicator state={session.saveState} />
            <TimeBadge
              seconds={secondsLeft}
              danger={secondsLeft <= 5 * 60}
              label={'Time remaining'}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={session.isSavingAndExiting || session.isSubmitting}
            onClick={handleContinueLater}
            className="gap-1.5 rounded-[10px] border-[#e7e7e4] text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            {session.isSavingAndExiting ? 'Saving…' : 'Continue later'}
          </Button>
        </div>
        <p className="sr-only">
          {material.examType === 'academic' ? 'Academic' : 'General Training'}
          {' · '}
          'Task 1 — 20 minutes, Task 2 — 40 minutes. Drafts are saved
          automatically.'
        </p>
      </div>
      {session.exitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#e23b3b]"
        >
          {'Could not save draft:'} {tr(session.exitError)}
        </p>
      ) : null}
      {session.submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#e23b3b]"
        >
          {'Could not submit your work:'} {tr(session.submitError)}
        </p>
      ) : null}
      <div className="min-h-0 flex-1">
        <WritingTaskEditor
          task={activeTask}
          text={activeTaskText}
          onChange={(next) =>
            session.updateAnswer(activeTask.id, { value: next })
          }
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e7e7e4] bg-white p-3">
        <Button
          type="button"
          variant="outline"
          disabled={activeTaskIndex === 0}
          onClick={() => setActiveTaskIndex((index) => index - 1)}
        >
          {'Back'}
        </Button>
        <p className="text-sm text-[#69696d]">
          {'Task'} {activeTaskIndex + 1} {'of'} {material.tasks.length}
        </p>
        <Button
          type="button"
          disabled={activeTaskIndex === material.tasks.length - 1}
          onClick={() => setActiveTaskIndex((index) => index + 1)}
        >
          {'Next'}
        </Button>
      </div>
      <AttemptSubmitBar
        answeredCount={answeredCount}
        totalQuestions={material.tasks.length}
        isSubmitting={session.isSubmitting}
        onContinueLater={handleContinueLater}
        isSavingAndExiting={session.isSavingAndExiting}
        disabled={!allTasksAnswered}
        disabledMessage={
          allTasksAnswered
            ? undefined
            : 'Answer both tasks. Responses below the recommended word count may receive a lower score.'
        }
        onSubmit={session.submit}
      />
    </div>
  )
}

function WritingTaskEditor({
  task,
  text,
  onChange,
}: {
  task: WritingTask
  text: string
  onChange: (next: string) => void
}) {
  const words = countWords(text)
  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Task {task.position}</CardTitle>
            <p className="mt-1 text-sm text-[#69696d]">
              {task.position === 1
                ? 'Suggested time: 20 minutes'
                : 'Suggested time: 40 minutes'}
              {' · '}
              {'minimum'} {task.minimumWords} words
            </p>
          </div>
          {task.position === 1 && task.visualType ? (
            <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]">
              {task.visualType.replaceAll('_', ' ')}
            </span>
          ) : task.position === 1 && task.letterTone ? (
            <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]">
              {task.letterTone} {'letter'}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="whitespace-pre-wrap rounded-xl bg-[#f7f7f5] p-4 text-sm leading-6">
          {task.prompt}
        </div>
        {task.visualAssetId ? (
          <ProtectedWritingImage
            assetId={task.visualAssetId}
            taskPosition={task.position}
          />
        ) : task.visualUrl ? (
          <img
            src={task.visualUrl}
            alt={`Visual for Writing Task ${task.position}`}
            className="max-h-[520px] w-full rounded-xl border object-contain"
          />
        ) : null}
        <Textarea
          value={text}
          onChange={(event) => onChange(event.target.value)}
          rows={15}
          className="resize-y font-serif text-base leading-7"
          placeholder={'Write your answer in English…'}
          aria-label={`${'Answer for'} Writing Task ${task.position}`}
        />
        <p
          className={`text-right text-xs ${words < task.minimumWords ? 'text-amber-700' : 'text-emerald-700'}`}
        >
          {words} {wordEnding(words)} · {'recommended minimum'}{' '}
          {task.minimumWords}
        </p>
      </CardContent>
    </Card>
  )
}

function ProtectedWritingImage({
  assetId,
  taskPosition,
}: {
  assetId: string
  taskPosition: number
}) {
  const query = useQuery({
    queryKey: ['writing', 'media', assetId],
    queryFn: () => getWritingMediaBlob(assetId),
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
    return <p className="text-sm text-[#69696d]">{'Loading image…'}</p>
  }
  if (!url) {
    return <p className="text-sm text-[#e23b3b]">{'Image unavailable.'}</p>
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" title={'Open full size'}>
      <img
        src={url}
        alt={`${'Visual for Writing Task'} ${taskPosition}`}
        className="max-h-[520px] w-full rounded-xl border object-contain"
      />
    </a>
  )
}

function WritingProcessingCard({
  fullMockSessionId,
}: {
  fullMockSessionId?: string
}) {
  return (
    <Card className="rounded-[16px] border border-[#e7e7e4] bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col items-center text-center max-w-lg mx-auto py-4">
        <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-[#3b82f6] mb-4">
          <svg
            className="size-6 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {'Your essay was submitted and is being assessed by AI'}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          'AI reviews task response, coherence and structure, vocabulary, and
          grammar. Assessment usually takes 30 to 90 seconds.'
        </p>
        <div className="rounded-xl bg-[#f7f7f5] p-4 text-xs text-slate-500 mb-6 text-left w-full">
          💡 <strong>{'You don’t need to wait here:'}</strong> 'close this tab
          or move to another section. Assessment will finish in the background,
          and your score and feedback will be saved to your profile.'
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {fullMockSessionId ? (
            <Button asChild className="bg-[#3b82f6] hover:bg-[#2563eb]">
              <Link
                to="/exam/full-mock-sessions/$sessionId"
                params={{ sessionId: fullMockSessionId }}
              >
                {'Continue to the next Full Mock section'}
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/">{'Go to dashboard'}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/writing">{'Back to Writing'}</Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function WritingAttemptResult({
  attempt,
  material,
  fullMockSessionId,
  onRetake,
  isRetaking,
}: {
  attempt: Attempt
  material: PublicWritingMaterial
  fullMockSessionId?: string
  onRetake?: () => Promise<void> | void
  isRetaking?: boolean
}) {
  const detailQuery = useAttemptDetail(attempt.id)
  const evaluation = detailQuery.data?.writingEvaluation
  const assessment = detailQuery.data?.writingAssessment
  const effectiveAttempt = detailQuery.data ?? attempt
  if (fullMockSessionId || effectiveAttempt.reviewLocked) {
    const sessionId = fullMockSessionId ?? effectiveAttempt.fullMockSessionId
    return sessionId ? <FullMockSectionComplete sessionId={sessionId} /> : null
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 p-3 sm:p-6 lg:p-8">
      <AttemptResultHeader
        skill="writing"
        fullMockSessionId={fullMockSessionId}
        onRetake={onRetake}
        isRetaking={isRetaking}
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {'Review your work'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{material.title}</p>
      </div>

      {detailQuery.isError ? (
        <ErrorState
          title={'Could not load feedback'}
          message={tr(getErrorMessage(detailQuery.error))}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : assessment?.status === 'FAILED' ? (
        <ErrorState
          title={'Could not assess the essay'}
          message={
            assessment.errorMessage ||
            'Automatic assessment failed. Start a new attempt or try again later.'
          }
          onRetry={() => void detailQuery.refetch()}
        />
      ) : !evaluation ? (
        <WritingProcessingCard fullMockSessionId={fullMockSessionId} />
      ) : (
        <WritingEvaluationView
          attempt={effectiveAttempt}
          material={material}
          evaluation={evaluation}
        />
      )}
    </div>
  )
}

function WritingEvaluationView({
  attempt,
  material,
  evaluation,
}: {
  attempt: AttemptDetail
  material: PublicWritingMaterial
  evaluation: WritingEvaluation
}) {
  const criteriaList = [
    {
      label: 'Task Achievement / Response',
      band: evaluation.criteria.taskResponse.band,
    },
    { label: 'Coherence & Cohesion', band: evaluation.criteria.coherence.band },
    {
      label: 'Lexical Resource',
      band: evaluation.criteria.lexicalResource.band,
    },
    { label: 'Grammar Accuracy', band: evaluation.criteria.grammar.band },
  ] as const

  return (
    <div className="space-y-6">
      <AttemptPerformanceReport
        band={evaluation.overallBand}
        bandNote={'Score based on the 4 IELTS Writing criteria'}
        criteria={criteriaList}
        totalQuestions={material.tasks.length}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        durationMinutes={material.durationMinutes}
        paceUnit={'essay'}
      />

      {evaluation.summary ? (
        <Card className="rounded-[16px] border border-[#e7e7e4] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {'Assessment summary'}
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            {evaluation.summary}
          </p>
        </Card>
      ) : null}

      {[...evaluation.tasks]
        .sort((left, right) => left.position - right.position)
        .map((task) => {
          const taskAnswer = attempt.answers?.find(
            (answer) => answer.questionId === task.taskId,
          )
          const answerValue = taskAnswer?.answer.value
          const candidateText =
            typeof answerValue === 'string' ? answerValue : ''

          return (
            <WritingTaskReview
              key={task.taskId}
              task={task}
              taskAnswerText={candidateText}
            />
          )
        })}

      <p className="flex items-center gap-2 text-xs text-[#808084]">
        <Book className="size-4" aria-hidden />
        {
          'This score is for practice only; your official IELTS result is determined by an examiner.'
        }
      </p>
    </div>
  )
}

function WritingTaskReview({
  task,
  taskAnswerText,
}: {
  task: WritingTaskFeedback
  taskAnswerText?: string
}) {
  return (
    <Card
      role="region"
      aria-label={`Writing Task ${task.position}`}
      className="rounded-[16px] border border-[#e7e7e4] bg-white shadow-xs overflow-hidden"
    >
      <CardHeader className="border-b border-slate-100 bg-[#fafafa]/80 py-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-slate-900 text-lg">
            <Edit2 className="size-4 text-[#3b82f6]" aria-hidden />
            Task {task.position}
          </CardTitle>
          <span className="rounded-md bg-blue-50 px-2.5 py-1 text-sm font-bold text-[#3b82f6]">
            Band {task.band.toFixed(1)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 sm:p-6 text-sm leading-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {'Criterion scores'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                task.position === 1 ? 'Task Achievement' : 'Task Response',
                task.criteria.taskResponse,
              ],
              ['Coherence & Cohesion', task.criteria.coherence],
              ['Lexical Resource', task.criteria.lexicalResource],
              ['Grammar Range & Accuracy', task.criteria.grammar],
            ].map(([label, criterion]) => {
              const typedCriterion = criterion as {
                band: number
                feedback: string
              }
              return (
                <div
                  key={label as string}
                  className="flex flex-col justify-between rounded-xl border border-[#ecece8] bg-[#fbfbf9] p-3.5 transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {label as string}
                    </span>
                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-[#3b82f6]">
                      {typedCriterion.band.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700">
                    {typedCriterion.feedback}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {task.feedback && (
          <div className="rounded-xl bg-[#f7f7f5] p-4 text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {'Overall feedback'}
            </p>
            <p className="text-sm leading-relaxed">{task.feedback}</p>
          </div>
        )}

        {taskAnswerText ? (
          <AnnotatedEssayView
            text={taskAnswerText}
            annotations={task.annotations ?? []}
          />
        ) : null}

        {task.modelParagraph ? (
          <ModelParagraphCard modelParagraph={task.modelParagraph} />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
          <FeedbackList title={'Strengths'} items={task.strengths} />
          <FeedbackList title={'Areas to improve'} items={task.improvements} />
        </div>
      </CardContent>
    </Card>
  )
}

function AnnotatedEssayView({
  text,
  annotations: suppliedAnnotations,
}: {
  text: string
  annotations: WritingAnnotation[]
}) {
  const annotationPrefix = useId()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Previously saved evaluations may predate server-side quote validation.
  const annotations = useMemo(
    () =>
      suppliedAnnotations
        .filter((ann) => ann.quote.trim() !== '' && text.includes(ann.quote))
        .map((ann, index) => ({ ...ann, id: index + 1 })),
    [suppliedAnnotations, text],
  )

  const handleSelect = (id: number) => {
    setSelectedId(id)
    const el = document.getElementById(
      `annotation-card-${annotationPrefix}-${id}`,
    )
    if (el) {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  const segments = useMemo(() => {
    if (!text || !annotations.length) {
      return [{ text, annotation: null }]
    }

    type Match = {
      start: number
      end: number
      annotation: WritingAnnotation
    }

    const matches: Match[] = []

    for (const ann of annotations) {
      const quote = ann.quote.trim()
      if (!quote) continue
      let searchIdx = 0
      while (searchIdx < text.length) {
        const found = text.indexOf(quote, searchIdx)
        if (found === -1) break
        matches.push({
          start: found,
          end: found + quote.length,
          annotation: ann,
        })
        searchIdx = found + quote.length
      }
    }

    matches.sort(
      (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start),
    )

    const filtered: Match[] = []
    let lastEnd = 0
    for (const m of matches) {
      if (m.start >= lastEnd) {
        filtered.push(m)
        lastEnd = m.end
      }
    }

    const res: { text: string; annotation: WritingAnnotation | null }[] = []
    let cur = 0
    for (const m of filtered) {
      if (m.start > cur) {
        res.push({ text: text.slice(cur, m.start), annotation: null })
      }
      res.push({
        text: text.slice(m.start, m.end),
        annotation: m.annotation,
      })
      cur = m.end
    }
    if (cur < text.length) {
      res.push({ text: text.slice(cur), annotation: null })
    }
    return res
  }, [text, annotations])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e7e7e4] bg-[#fbfbf9] p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/70">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {'Your essay with feedback'}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-500" />
              {'Errors'}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" />
              {'Suggestions'}
            </span>
          </div>
        </div>

        <div className="font-serif text-base sm:text-lg leading-relaxed sm:leading-loose text-slate-800 whitespace-pre-wrap">
          {segments.map((seg, idx) => {
            if (!seg.annotation) {
              return <span key={idx}>{seg.text}</span>
            }
            const ann = seg.annotation
            const isError = ann.severity === 'error'
            const isSelected = selectedId === ann.id

            return (
              <button
                key={idx}
                type="button"
                aria-label={`${isError ? 'Error' : 'Suggestion'} ${ann.id}: ${seg.text}`}
                aria-controls={`annotation-card-${annotationPrefix}-${ann.id}`}
                aria-pressed={isSelected}
                onClick={() => handleSelect(ann.id)}
                title={
                  ann.replacement
                    ? `Suggested wording: ${ann.replacement}`
                    : undefined
                }
                className={`inline text-left font-serif text-base sm:text-lg cursor-pointer transition-all duration-150 rounded px-1 -mx-0.5 ${
                  isError
                    ? `underline decoration-wavy decoration-red-500 decoration-2 underline-offset-4 text-red-950 hover:bg-red-100/90 ${
                        isSelected
                          ? 'bg-red-100 ring-2 ring-red-400'
                          : 'bg-red-50/80'
                      }`
                    : `underline decoration-wavy decoration-amber-500 decoration-2 underline-offset-4 text-amber-950 hover:bg-amber-100/90 ${
                        isSelected
                          ? 'bg-amber-100 ring-2 ring-amber-400'
                          : 'bg-amber-50/80'
                      }`
                }`}
              >
                <span>{seg.text}</span>
                <sup
                  className="ml-1 inline-flex items-center justify-center font-sans font-bold text-[10px] size-4 rounded-full text-white align-top select-none shadow-xs"
                  style={{ backgroundColor: isError ? '#ef4444' : '#f59e0b' }}
                >
                  {ann.id}
                </sup>
              </button>
            )
          })}
        </div>
      </div>

      {annotations.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {'Feedback and improvements'} ({annotations.length})
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {annotations.map((ann) => {
              const isError = ann.severity === 'error'
              const isSelected = selectedId === ann.id
              return (
                <div
                  key={ann.id}
                  id={`annotation-card-${annotationPrefix}-${ann.id}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${isError ? 'Error' : 'Suggestion'} ${ann.id}`}
                  aria-pressed={isSelected}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedId(ann.id)
                    }
                  }}
                  onClick={() => setSelectedId(ann.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    isSelected
                      ? isError
                        ? 'border-red-400 bg-red-50/50 shadow-xs ring-1 ring-red-400'
                        : 'border-amber-400 bg-amber-50/50 shadow-xs ring-1 ring-amber-400'
                      : 'border-[#e7e7e4] bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-2xs ${
                        isError ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                    >
                      {ann.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="font-serif text-sm line-through text-slate-400">
                          {ann.quote}
                        </span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="font-serif text-sm font-bold text-emerald-700">
                          {ann.replacement}
                        </span>
                        <span
                          className={`ml-auto text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isError
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isError ? 'Error' : 'Suggestion'} · {ann.type}
                        </span>
                      </div>

                      {ann.explanationRu && (
                        <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                          {ann.explanationRu}
                        </p>
                      )}

                      {ann.alternatives && ann.alternatives.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400">
                            {'Alternatives'}:
                          </span>
                          {ann.alternatives.map((alt, i) => (
                            <span
                              key={i}
                              className="rounded bg-slate-100 px-1.5 py-0.2 text-[11px] font-medium text-slate-700"
                            >
                              {alt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ModelParagraphCard({ modelParagraph }: { modelParagraph: string }) {
  const [isOpen, setIsOpen] = useState(true)

  if (!modelParagraph) return null

  return (
    <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs text-xs font-bold">
            ★
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {'Model paragraph aiming at Band 8'}
            </h4>
            <p className="text-xs text-slate-500">
              An example using precise vocabulary and varied sentence structures
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          {isOpen ? 'Hide' : 'Show'}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-3.5 rounded-xl border border-blue-200 bg-white/95 p-4 font-serif text-sm sm:text-base leading-relaxed text-slate-800 shadow-2xs">
          <p className="italic">“{modelParagraph}”</p>
        </div>
      )}
    </div>
  )
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-[#69696d]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function countWords(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function wordEnding(value: number) {
  return value === 1 ? 'word' : 'words'
}
