import { BrandLogo } from '@/components/landing/brand'
import { FullMockSectionComplete } from '@/pages/fullmock/full-mock-section-complete'
import { ArrowLeft } from 'iconsax-react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useAttemptDetail } from '@/features/attempts/use-attempt-detail'
import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

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
  AttemptResultHeader,
  AttemptSubmitBar,
  ErrorState,
  ExamLoadingScreen,
  SaveIndicator,
  TimeBadge,
} from '@/features/attempts/attempt-ui'
import { startWritingAttempt } from '@/features/attempts/api'
import type { Attempt } from '@/features/attempts/api'
import { WritingReview } from '@/features/attempts/writing-review'
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
          <BrandLogo variant="mark" />
          <h1 className="font-sans sr-only">{material.title}</h1>
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
            className="gap-1.5 rounded-[10px] border-border text-xs font-semibold text-foreground hover:bg-card shadow-none"
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
          className="rounded-xl border border-destructive-soft bg-destructive-soft p-4 text-sm text-destructive"
        >
          {'Could not save draft:'} {tr(session.exitError)}
        </p>
      ) : null}
      {session.submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive-soft bg-destructive-soft p-4 text-sm text-destructive"
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-card p-3">
        <Button
          type="button"
          variant="outline"
          disabled={activeTaskIndex === 0}
          onClick={() => setActiveTaskIndex((index) => index - 1)}
        >
          {'Back'}
        </Button>
        <p className="text-sm text-muted-foreground">
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
            <p className="mt-1 text-sm text-muted-foreground">
              {task.position === 1
                ? 'Suggested time: 20 minutes'
                : 'Suggested time: 40 minutes'}
              {' · '}
              {'minimum'} {task.minimumWords} words
            </p>
          </div>
          {task.position === 1 && task.visualType ? (
            <span className="rounded-sm bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              {task.visualType.replaceAll('_', ' ')}
            </span>
          ) : task.position === 1 && task.letterTone ? (
            <span className="rounded-sm bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              {task.letterTone} {'letter'}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="whitespace-pre-wrap rounded-xl bg-background p-4 text-sm leading-6">
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
          className="resize-y font-sans text-base leading-7"
          placeholder={'Write your answer in English…'}
          aria-label={`${'Answer for'} Writing Task ${task.position}`}
        />
        <p
          className={`text-right text-xs ${words < task.minimumWords ? 'text-warning-fg' : 'text-success'}`}
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
    return <p className="text-sm text-muted-foreground">{'Loading image…'}</p>
  }
  if (!url) {
    return <p className="text-sm text-destructive">{'Image unavailable.'}</p>
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
    <Card className="rounded-[10px] border border-border bg-card p-6 sm:p-8 shadow-none">
      <div className="flex flex-col items-center text-center max-w-lg mx-auto py-4">
        <div className="size-12 rounded-full bg-primary-soft flex items-center justify-center text-primary mb-4">
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
        <h2 className="text-xl font-bold text-foreground mb-2">
          {'Your essay was submitted and is being assessed by AI'}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          'AI reviews task response, coherence and structure, vocabulary, and
          grammar. Assessment usually takes 30 to 90 seconds.'
        </p>
        <div className="rounded-xl bg-background p-4 text-xs text-muted-foreground mb-6 text-left w-full">
          💡 <strong>{'You don’t need to wait here:'}</strong> 'close this tab
          or move to another section. Assessment will finish in the background,
          and your score and feedback will be saved to your profile.'
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {fullMockSessionId ? (
            <Button asChild className="bg-primary hover:bg-primary-hover">
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
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {'Review your work'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{material.title}</p>
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
        <WritingReview
          attempt={effectiveAttempt}
          durationMinutes={material.durationMinutes}
          totalQuestions={material.tasks.length}
          evaluation={evaluation}
        />
      )}
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
