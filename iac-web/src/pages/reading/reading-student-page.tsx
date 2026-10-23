import { BrandLogo } from '@/components/landing/brand'
import { ObjectiveAttemptResult } from '@/features/attempts/objective-attempt-review'
import { ArrowLeft, TickCircle } from 'iconsax-react'
import { Link } from '@tanstack/react-router'
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
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  useAttemptSession,
  useContinueLater,
} from '@/features/attempts/attempt-session'
import { usePreviewSession } from '@/features/attempts/preview-session'
import type { AttemptSession } from '@/features/attempts/preview-session'
import { useExamTimer } from '@/features/attempts/exam-timer'
import { ExamAttemptShell } from '@/features/attempts/attempt-controller'
import { attemptStartQueryKey } from '@/features/attempts/exam-attempt-routes'
import {
  ErrorState,
  ExamLoadingScreen,
  SaveIndicator,
  TimeBadge,
  isQuestionAnswered,
  multiSelectLimit,
} from '@/features/attempts/attempt-ui'
import type { Option } from '@/features/attempts/attempt-ui'
import { startReadingAttempt } from '@/features/attempts/api'
import type { Attempt, StudentAnswer } from '@/features/attempts/api'
import type {
  PublicReadingGroup,
  PublicReadingMaterial,
  PublicReadingQuestion,
} from '@/features/reading/api'
import type { PreviewAnswerKeys } from '@/features/admin/preview-api'
import {
  PreviewAnswer,
  PreviewEvidenceText,
} from '@/features/admin/preview-answer'
import { tr } from '@/lib/i18n'

const tfngValues = ['TRUE', 'FALSE', 'NOT_GIVEN'] as const
const ynngValues = ['YES', 'NO', 'NOT_GIVEN'] as const

export function ReadingStudentPage({
  materialId,
  fullMockSessionId,
}: {
  materialId: string
  fullMockSessionId?: string
}) {
  return (
    <ExamAttemptShell<PublicReadingMaterial>
      skillBadge="IELTS Reading"
      loadingLabel={'Preparing your test…'}
      loadingDescription="Loading the passage, organising the questions, and preparing your answer sheet."
      queryKey={attemptStartQueryKey('reading', materialId)}
      startAttemptFn={(signal) => startReadingAttempt(materialId, signal)}
      renderRunner={({ attempt, material, onSubmitted }) => (
        <ReadingAttemptRunner
          key={attempt.id}
          attempt={attempt}
          material={material}
          fullMockSessionId={fullMockSessionId}
          onSubmitted={onSubmitted}
        />
      )}
      renderResult={({ attempt, material, onRetake, isRetaking }) => (
        <ReadingAttemptResult
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

function resolvePassages(
  material: PublicReadingMaterial,
): PublicReadingMaterial[] {
  if (material.passages && material.passages.length > 1) {
    return material.passages
  }

  // Check if material.body has multiple passage markers
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

type ReadingRunnerProps = {
  attempt: Attempt
  material: PublicReadingMaterial
  fullMockSessionId?: string
  sectionDeadlineAt?: string | null
  onSubmitted?: (attempt: Attempt) => void
}

export function ReadingAttemptRunner(props: ReadingRunnerProps) {
  const session = useAttemptSession(props.attempt.id)
  return <ReadingTestRunner {...props} session={session} />
}

export function ReadingPreviewRunner({
  material,
  timerEnabled,
  answerKeys,
}: {
  material: PublicReadingMaterial
  timerEnabled: boolean
  answerKeys: PreviewAnswerKeys
}) {
  const session = usePreviewSession()
  return (
    <ReadingTestRunner
      material={material}
      session={session}
      answerKeys={answerKeys}
      preview
      timerEnabled={timerEnabled}
    />
  )
}

function ReadingTestRunner({
  attempt,
  material,
  fullMockSessionId,
  sectionDeadlineAt,
  onSubmitted,
  session,
  preview = false,
  timerEnabled = true,
  answerKeys,
}: Omit<ReadingRunnerProps, 'attempt'> & {
  attempt?: Attempt
  session: AttemptSession
  preview?: boolean
  timerEnabled?: boolean
  answerKeys?: PreviewAnswerKeys
}) {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [revealedQuestionId, setRevealedQuestionId] = useState<string | null>(
    null,
  )
  const [passageFontSize, setPassageFontSize] = useState<'sm' | 'md' | 'lg'>(
    'md',
  )
  const autoSubmitStarted = useRef(false)

  const passages = useMemo(() => resolvePassages(material), [material])

  const questions = useMemo(
    () =>
      passages.flatMap((passage, passageIndex) =>
        passage.questionGroups.flatMap((group) =>
          group.questions.map((question) => ({
            passage,
            passageIndex,
            group,
            question,
          })),
        ),
      ),
    [passages],
  )

  const [emptyPassageIndex, setEmptyPassageIndex] = useState(0)
  const currentQuestion = questions.at(activeQuestionIndex)
  const currentPassageIndex = currentQuestion?.passageIndex ?? emptyPassageIndex
  const currentPassage = passages[currentPassageIndex] ?? passages[0]
  const revealedInCurrentPassage =
    preview &&
    currentPassage.questionGroups.some((group) =>
      group.questions.some((question) => question.id === revealedQuestionId),
    )
  const revealedQuote =
    revealedInCurrentPassage && revealedQuestionId
      ? (answerKeys?.[revealedQuestionId]?.quote ?? '')
      : ''

  const activePassageQuestions = useMemo(
    () => questions.filter((q) => q.passageIndex === currentPassageIndex),
    [questions, currentPassageIndex],
  )

  const goToPassage = (passageIndex: number) => {
    const targetIndex = questions.findIndex(
      (item) => item.passageIndex === passageIndex,
    )
    setEmptyPassageIndex(passageIndex)
    setActiveQuestionIndex(targetIndex >= 0 ? targetIndex : questions.length)
  }

  useEffect(() => {
    if (!currentQuestion?.question.id) return
    const el = document.getElementById(
      `reading-q-${currentQuestion.question.id}`,
    )
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeQuestionIndex, currentQuestion?.question.id])

  const isReady = session.answers !== null && !session.loadError

  const handleContinueLater = useContinueLater(session, { fullMockSessionId })

  const durationMinutes =
    (material.durationMinutes ?? 0) > 0 ? material.durationMinutes! : 60
  const durationSeconds = durationMinutes * 60
  const { deadline, secondsLeft } = useExamTimer({
    attempt,
    storagePrefix: 'iac_reading_deadline_',
    durationSeconds,
    ready: isReady,
    enabled: timerEnabled,
    finished: Boolean(session.submitted),
    deadlineAt: sectionDeadlineAt,
  })

  useEffect(() => {
    if (
      !preview &&
      deadline !== null &&
      durationSeconds > 0 &&
      secondsLeft === 0 &&
      session.answers !== null &&
      !session.submitted &&
      !session.isSubmitting &&
      !autoSubmitStarted.current
    ) {
      autoSubmitStarted.current = true
      void session.submit()
    }
  }, [
    preview,
    deadline,
    durationSeconds,
    secondsLeft,
    session.submitted,
    session.isSubmitting,
    session.answers,
    session.submit,
  ])

  useEffect(() => {
    if (session.submitted && onSubmitted) {
      onSubmitted(session.submitted)
    }
  }, [session.submitted, onSubmitted])

  if (session.submitted) {
    return (
      <ReadingAttemptResult
        attempt={session.submitted}
        material={material}
        fullMockSessionId={fullMockSessionId}
        onRetake={async () => {
          window.location.reload()
        }}
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
        badge="IELTS Reading"
        label={'Preparing Reading…'}
        description="Loading passages and questions, and restoring your saved answers…"
      />
    )
  }
  const answers = session.answers

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
  const activePassageAnsweredCount = activePassageQuestions.filter((item) =>
    isQuestionAnswered(item.question.id, answers[item.question.id ?? '']),
  ).length
  const currentNumber = currentQuestion
    ? questionNumberLabel(currentQuestion.question)
    : '—'

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-[1780px] flex-col gap-2.5 p-2.5 sm:p-3.5 lg:p-4 overflow-hidden',
        preview
          ? 'min-h-[920px] lg:h-[calc(100dvh-100px)] lg:min-h-[560px]'
          : 'h-dvh',
      )}
    >
      {/* ВЕРХНЯЯ ШАПКА */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-none shrink-0">
        <div className="flex items-center gap-3">
          <BrandLogo variant="mark" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
          >
            {preview ? (
              <Link
                to="/admin/reading/materials/$materialId"
                params={{ materialId: material.id }}
              >
                <ArrowLeft className="size-4" aria-hidden />
                <span>{'Back to editor'}</span>
              </Link>
            ) : fullMockSessionId ? (
              <Link
                to="/exam/full-mock-sessions/$sessionId"
                params={{ sessionId: fullMockSessionId }}
              >
                <ArrowLeft className="size-4" aria-hidden />
                <span className="hidden sm:inline">{'Back to Full Mock'}</span>
              </Link>
            ) : (
              <Link to="/reading">
                <ArrowLeft className="size-4" aria-hidden />
                <span className="hidden sm:inline">{'Back to Reading'}</span>
              </Link>
            )}
          </Button>
          <div className="hidden md:block">
            <h1 className="font-sans text-sm font-semibold text-foreground truncate max-w-[240px] lg:max-w-[360px]">
              {material.title}
            </h1>
          </div>
        </div>

        {/* Вкладки Разделов (Passages) по центру */}
        {passages.length > 1 && (
          <div className="flex items-center gap-1 rounded-[10px] border border-border bg-card p-1">
            {passages.map((passage, passageIndex) => {
              const isCurrentPassage = currentPassageIndex === passageIndex
              const pQuestions = questions.filter(
                (item) => item.passageIndex === passageIndex,
              )
              const pAnswered = pQuestions.filter((item) =>
                isQuestionAnswered(
                  item.question.id,
                  answers[item.question.id ?? ''],
                ),
              ).length
              return (
                <button
                  key={passage.id}
                  type="button"
                  onClick={() => goToPassage(passageIndex)}
                  className={cn(
                    'flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all select-none',
                    isCurrentPassage
                      ? 'bg-primary text-primary-foreground shadow-none'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  <span>
                    {'Passage'} {passageIndex + 1}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      isCurrentPassage
                        ? 'bg-primary-hover text-primary-foreground'
                        : pAnswered === pQuestions.length &&
                            pQuestions.length > 0
                          ? 'bg-success-bg text-success'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {pAnswered}/{pQuestions.length}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Правая часть шапки: Сохранение, Таймер, Кнопка Завершить */}
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2.5 sm:gap-3">
          {!preview ? <SaveIndicator state={session.saveState} /> : null}
          {timerEnabled ? (
            <TimeBadge seconds={secondsLeft} label="Time remaining" />
          ) : null}
          {!preview ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={session.isSavingAndExiting || session.isSubmitting}
              onClick={handleContinueLater}
              className="rounded-[10px] border-border text-xs font-semibold text-foreground hover:bg-card shadow-none"
            >
              {session.isSavingAndExiting ? 'Saving…' : 'Continue later'}
            </Button>
          ) : null}
          {!preview ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={session.isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary shadow-none"
                >
                  {session.isSubmitting ? 'Submitting…' : 'Finish test'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{'Finish this attempt?'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {answeredCount < totalQuestions
                      ? `You answered ${answeredCount} of ${totalQuestions} questions. Unanswered questions will be marked incorrect.`
                      : 'All questions are answered. Finish the test and view your results?'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{'Continue test'}</AlertDialogCancel>
                  <AlertDialogAction onClick={session.submit}>
                    {'Finish'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </header>

      {session.exitError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive-soft bg-destructive-soft p-3 text-xs text-destructive shrink-0"
        >
          {'Could not save draft:'} {tr(session.exitError)}
        </p>
      ) : null}

      {session.submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive-soft bg-destructive-soft p-3 text-xs text-destructive shrink-0"
        >
          {'Could not submit test:'} {tr(session.submitError)}
        </p>
      ) : null}

      {/* Основная рабочая зона — сплит на 2 колонки на desktop */}
      <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-2 overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА: Текст отрывка (Reading Passage) */}
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-border bg-card shadow-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="rounded-sm bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary border border-primary-soft shrink-0">
                {passages.length > 1
                  ? `${'Passage'} ${currentPassageIndex + 1}`
                  : 'Passage'}
              </span>
              <h2 className="text-sm font-semibold text-foreground truncate">
                {currentPassage.title}
              </h2>
            </div>
            {/* Контролы размера текста */}
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
                title={'Decrease text size'}
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
                title={'Default text size'}
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
                title={'Increase text size'}
              >
                A+
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 select-text bg-card">
            <div
              className={cn(
                'whitespace-pre-wrap font-sans text-foreground space-y-4',
                passageFontSize === 'sm' && 'text-[14px] leading-[1.65]',
                passageFontSize === 'md' && 'text-[15.5px] leading-[1.8]',
                passageFontSize === 'lg' && 'text-[17.5px] leading-[1.9]',
              )}
            >
              {currentPassage.body.trim() ? (
                <PreviewEvidenceText
                  body={currentPassage.body}
                  quote={revealedQuote}
                />
              ) : (
                'This passage has no text yet. Return to the editor.'
              )}
            </div>
          </div>
        </Card>

        {/* ПРАВАЯ КОЛОНКА: Вопросы и ответы */}
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-border bg-card shadow-none">
          <div className="border-b border-border px-5 py-3.5 bg-card shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-sm bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary border border-primary-soft">
                  {passages.length > 1
                    ? `${'Passage'} ${currentPassageIndex + 1}`
                    : 'Questions'}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  `${currentPassage.questionGroups.length} question groups`
                </span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {'Question'} {currentNumber} {'of'} {totalQuestions}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 bg-card space-y-7">
            {currentPassage.questionGroups.every(
              (group) => group.questions.length === 0,
            ) ? (
              <p role="status" className="text-sm text-warning-fg">
                {'This passage has no questions yet. Add them in the editor.'}
              </p>
            ) : null}
            {currentPassage.questionGroups.map((group) => (
              <div key={group.id ?? group.position} className="space-y-3.5">
                <div className="border-b border-border pb-2.5">
                  <span className="rounded-sm bg-muted px-2.5 py-0.5 text-[11px] font-bold normal-case text-foreground border border-border">
                    {group.type.replaceAll('_', ' ')}
                  </span>
                  {group.instructions ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {group.instructions}
                    </p>
                  ) : null}
                </div>
                <StudentGroup
                  group={group}
                  activeQuestionId={currentQuestion?.question.id}
                  answers={answers}
                  onAnswer={session.updateAnswer}
                  preview={preview}
                  answerKeys={answerKeys}
                  evidenceText={currentPassage.body}
                  revealedQuestionId={revealedQuestionId}
                  onToggleExplanation={(questionId) => {
                    setRevealedQuestionId((current) =>
                      current === questionId ? null : questionId,
                    )
                    const index = questions.findIndex(
                      (item) => item.question.id === questionId,
                    )
                    if (index >= 0) setActiveQuestionIndex(index)
                  }}
                  onSelectQuestion={(qId) => {
                    const idx = questions.findIndex(
                      (item) => item.question.id === qId,
                    )
                    if (idx >= 0) setActiveQuestionIndex(idx)
                  }}
                />
              </div>
            ))}
          </div>

          {/* Навигация внизу правой колонки */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-card shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!currentQuestion || activeQuestionIndex === 0}
              onClick={() => setActiveQuestionIndex((index) => index - 1)}
              className="gap-1.5 rounded-[10px] text-xs font-medium border-border bg-card hover:bg-card"
            >
              ← {'Back'}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                {'Question'} {currentNumber} {'of'} {totalQuestions}
              </span>
              {passages.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  · {'Passage'} {currentPassageIndex + 1}
                </span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              disabled={
                !currentQuestion || activeQuestionIndex === questions.length - 1
              }
              onClick={() => setActiveQuestionIndex((index) => index + 1)}
              className="gap-1.5 rounded-[10px] bg-primary text-primary-foreground hover:bg-primary text-xs font-medium shadow-none"
            >
              {'Next'} →
            </Button>
          </div>
        </Card>
      </div>

      {/* НИЖНИЙ НАВИГАТОР ПО ВОПРОСАМ (Question Palette) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-3.5 py-2 sm:px-4 shadow-none shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-0.5 max-w-full">
          {/* Переключение разделов внизу (если больше 1 раздела) */}
          {passages.length > 1 && (
            <div className="flex items-center gap-1 border-r border-border pr-2.5 sm:pr-3 shrink-0">
              {passages.map((passage, pIdx) => {
                const isCurrentPassage = currentPassageIndex === pIdx
                const pQuestions = questions.filter(
                  (q) => q.passageIndex === pIdx,
                )
                const pAnswered = pQuestions.filter((item) =>
                  isQuestionAnswered(
                    item.question.id,
                    answers[item.question.id ?? ''],
                  ),
                ).length
                return (
                  <button
                    key={passage.id}
                    type="button"
                    onClick={() => goToPassage(pIdx)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-xs font-semibold transition-all shrink-0 select-none',
                      isCurrentPassage
                        ? 'bg-primary text-primary-foreground shadow-none'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    title={`${'Passage'} ${pIdx + 1}: ${pAnswered}/${pQuestions.length} ${'answered'}`}
                  >
                    <span>
                      {'Passage'} {pIdx + 1}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                        isCurrentPassage
                          ? 'bg-primary-hover text-primary-foreground'
                          : pAnswered === pQuestions.length &&
                              pQuestions.length > 0
                            ? 'bg-success-bg text-success'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {pAnswered}/{pQuestions.length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Вопросы ТОЛЬКО активного раздела */}
          <div className="flex items-center gap-1 shrink-0">
            {activePassageQuestions.map((item) => {
              const idx = questions.indexOf(item)
              const isCurrent = idx === activeQuestionIndex
              const answered = isQuestionAnswered(
                item.question.id,
                answers[item.question.id ?? ''],
              )
              const label = questionNumberLabel(item.question)
              return (
                <button
                  key={item.question.id ?? idx}
                  type="button"
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-[7px] border text-xs font-semibold transition-all select-none',
                    isCurrent
                      ? 'border-foreground bg-foreground text-background shadow-none scale-105'
                      : answered
                        ? 'border-border-strong bg-primary-soft text-primary hover:bg-primary-soft'
                        : 'border-border-strong bg-card text-muted-foreground hover:border-border-strong hover:bg-muted',
                  )}
                  title={`${'Question'} ${label}${answered ? ` (${'answered'})` : ''}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Счётчик ответов */}
        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground font-medium">
          {passages.length > 1 && (
            <span className="text-muted-foreground hidden sm:inline">
              {'Passage:'}{' '}
              <strong className="text-foreground">
                {activePassageAnsweredCount}
              </strong>{' '}
              {'of'} {activePassageQuestions.length}
              <span className="mx-2 text-muted-foreground">|</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            {'Total:'}{' '}
            <strong className="text-foreground">{answeredCount}</strong> {'of'}{' '}
            {totalQuestions}
          </span>
        </div>
      </div>
    </div>
  )
}

function ReadingAttemptResult({
  attempt,
  material,
  fullMockSessionId,
  onRetake,
  isRetaking,
}: {
  attempt: Attempt
  material: PublicReadingMaterial
  fullMockSessionId?: string
  onRetake?: () => Promise<void> | void
  isRetaking?: boolean
}) {
  return (
    <ObjectiveAttemptResult
      attemptId={attempt.id}
      material={material}
      fullMockSessionId={fullMockSessionId}
      onRetake={onRetake}
      isRetaking={isRetaking}
    />
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
          className="whitespace-pre-wrap rounded-[10px] border border-border bg-background p-4 text-sm leading-relaxed text-foreground"
        >
          {context
            .replaceAll('{{answer}}', '_____')
            .replace(/\{\{(\d+)\}\}/g, '($1) _____')}
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
  onSelectQuestion,
  preview = false,
  answerKeys,
  evidenceText,
  revealedQuestionId,
  onToggleExplanation,
}: {
  group: PublicReadingGroup
  activeQuestionId?: string
  answers: Record<string, StudentAnswer>
  onAnswer: (questionId: string, answer: StudentAnswer) => void
  onSelectQuestion?: (questionId: string) => void
  preview?: boolean
  answerKeys?: PreviewAnswerKeys
  evidenceText?: string
  revealedQuestionId?: string | null
  onToggleExplanation?: (questionId: string) => void
}) {
  if (group.questions.length === 0) return null
  return (
    <div className="space-y-4">
      <GroupContexts group={group} />
      <div className="space-y-3.5">
        {group.questions.map((question) => {
          const isCurrent = question.id === activeQuestionId
          return (
            <div
              key={question.id ?? question.position}
              id={`reading-q-${question.id}`}
              onClick={() => {
                if (question.id && onSelectQuestion)
                  onSelectQuestion(question.id)
              }}
              className={cn(
                'rounded-[10px] border p-4 sm:p-5 transition-all duration-150 cursor-pointer bg-card',
                isCurrent
                  ? 'border-primary ring-2 ring-primary/20 shadow-none'
                  : 'border-border hover:border-border-strong hover:shadow-none',
              )}
            >
              <CleanStudentQuestion
                group={group}
                question={question}
                value={question.id ? answers[question.id] : undefined}
                onAnswer={onAnswer}
                preview={preview}
              />
              {preview ? (
                <PreviewAnswer
                  answerKey={
                    question.id ? answerKeys?.[question.id] : undefined
                  }
                  options={(question.content.options ?? []) as Option[]}
                  open={Boolean(
                    question.id && revealedQuestionId === question.id,
                  )}
                  onToggle={() => {
                    if (question.id) onToggleExplanation?.(question.id)
                  }}
                  evidenceText={evidenceText}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Clean question rendering without nested bordered boxes
function CleanStudentQuestion({
  group,
  question,
  value,
  onAnswer,
  preview = false,
}: {
  group: PublicReadingGroup
  question: PublicReadingQuestion
  value: StudentAnswer | undefined
  onAnswer: (questionId: string, answer: StudentAnswer) => void
  preview?: boolean
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
      <span className="mr-2 text-primary">
        {questionNumberLabel(question)}.
      </span>
      {question.prompt.replace('{{answer}}', '_____')}
    </p>
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
                    ? 'border-primary bg-primary-soft/60 text-primary shadow-none ring-1 ring-primary/20'
                    : 'border-border bg-card text-foreground hover:border-border-strong hover:bg-card/50',
                )}
              >
                <span>{variant.replaceAll('_', ' ')}</span>
                <div
                  className={cn(
                    'size-4 rounded-full border flex items-center justify-center transition-colors',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-border-strong bg-card',
                  )}
                >
                  {isSelected ? (
                    <div className="size-1.5 rounded-full bg-card" />
                  ) : null}
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
        ? (value.optionIds as unknown[]).filter(
            (id): id is string => typeof id === 'string',
          )
        : []
      : typeof value?.optionId === 'string'
        ? [value.optionId]
        : []

    return (
      <div className="space-y-4">
        {prompt}
        {isMulti ? (
          <p className="text-xs font-medium text-muted-foreground">
            `Choose up to ${limit} options:`
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
                    ? 'border-primary bg-primary-soft/60 text-primary font-medium shadow-none ring-1 ring-primary/20'
                    : 'border-border bg-card text-foreground hover:border-border-strong hover:bg-card/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
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
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-strong bg-card',
                  )}
                >
                  {isSelected ? (
                    <TickCircle
                      className="size-3.5 text-primary-foreground"
                      aria-hidden
                    />
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
          placeholder={'Enter your answer here…'}
          className="h-11 rounded-xl border-border bg-card px-4 text-base focus-visible:border-primary focus-visible:ring-ring"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {preview
            ? 'Practice answers are only saved on this page'
            : 'Your answer is saved automatically as you type'}
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
