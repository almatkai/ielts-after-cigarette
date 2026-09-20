import { ArrowLeft, Book, Edit2 } from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAttemptSession } from '@/features/attempts/attempt-session'
import { ExamAttemptShell } from '@/features/attempts/attempt-controller'
import {
  AttemptPerformanceReport,
  AttemptResultHeader,
  AttemptSubmitBar,
  ErrorState,
  ExamLoadingScreen,
  LoadingState,
  SaveIndicator,
  TimeBadge,
} from '@/features/attempts/attempt-ui'
import {
  attemptKeys,
  getAttempt,
  startWritingAttempt,
} from '@/features/attempts/api'
import type { Attempt, WritingEvaluation } from '@/features/attempts/api'
import { getWritingMediaBlob } from '@/features/writing/api'
import type { PublicWritingMaterial, WritingTask } from '@/features/writing/api'
import { getErrorMessage } from '@/lib/api/client'

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
      loadingLabel="Готовим задания Writing…"
      loadingDescription="Загружаем темы заданий, требования к объёму слов и подготавливаем редактор эссе."
      queryKey={['writing', 'materials', materialId, 'attempt']}
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
  onSubmitted,
}: {
  attempt: Attempt
  material: PublicWritingMaterial
  fullMockSessionId?: string
  onSubmitted?: (attempt: Attempt) => void
}) {
  const session = useAttemptSession(attempt.id)
  const [activeTaskIndex, setActiveTaskIndex] = useState(0)

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
  if (session.answers === null) {
    return (
      <ExamLoadingScreen
        badge="IELTS Writing"
        label="Восстанавливаем сохранённые черновики…"
        description="Загружаем ранее сохранённый текст эссе и черновики из облака..."
      />
    )
  }
  const answeredCount = material.tasks.filter((task) => {
    const value = session.answers?.[task.id]?.value
    return typeof value === 'string' && value.trim().length > 0
  }).length
  const activeTask = material.tasks[activeTaskIndex]
  const activeTaskValue = session.answers[activeTask.id]?.value
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
          <Link to="/dashboard/writing">
            <ArrowLeft aria-hidden />К Writing
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="sr-only">{material.title}</h1>
          <div className="flex items-center gap-3">
            <SaveIndicator state={session.saveState} />
            <WritingClock
              startedAt={attempt.startedAt}
              durationMinutes={material.durationMinutes}
            />
          </div>
        </div>
        <p className="sr-only">
          {material.examType === 'academic' ? 'Academic' : 'General Training'}
          {' · '}Task 1 — 20 минут, Task 2 — 40 минут. Черновики сохраняются
          автоматически.
        </p>
      </div>
      {session.submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#e23b3b]"
        >
          Не удалось отправить работу: {session.submitError}
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
          Назад
        </Button>
        <p className="text-sm text-[#69696d]">
          Задание {activeTaskIndex + 1} из {material.tasks.length}
        </p>
        <Button
          type="button"
          disabled={activeTaskIndex === material.tasks.length - 1}
          onClick={() => setActiveTaskIndex((index) => index + 1)}
        >
          Далее
        </Button>
      </div>
      <AttemptSubmitBar
        answeredCount={answeredCount}
        totalQuestions={material.tasks.length}
        isSubmitting={session.isSubmitting}
        disabled={!allTasksAnswered}
        disabledMessage={
          allTasksAnswered
            ? undefined
            : 'Напишите ответ на оба задания. Работа короче рекомендуемого объёма будет оценена ниже.'
        }
        onSubmit={session.submit}
      />
    </div>
  )
}

function WritingClock({
  startedAt,
  durationMinutes,
}: {
  startedAt: string
  durationMinutes: number
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])
  const secondsRemaining = Math.max(
    0,
    durationMinutes * 60 -
      Math.floor((now - new Date(startedAt).getTime()) / 1000),
  )
  return (
    <TimeBadge
      seconds={secondsRemaining}
      danger={secondsRemaining < 5 * 60}
      label={`Осталось ${durationMinutes} минут на Writing`}
    />
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
                ? 'Рекомендуемое время: 20 минут'
                : 'Рекомендуемое время: 40 минут'}
              {' · минимум '}
              {task.minimumWords} слов
            </p>
          </div>
          {task.position === 1 && task.visualType ? (
            <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]">
              {task.visualType.replaceAll('_', ' ')}
            </span>
          ) : task.position === 1 && task.letterTone ? (
            <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]">
              {task.letterTone} letter
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
          placeholder="Напишите свой ответ на английском…"
          aria-label={`Ответ на Writing Task ${task.position}`}
        />
        <p
          className={`text-right text-xs ${words < task.minimumWords ? 'text-amber-700' : 'text-emerald-700'}`}
        >
          {words} {wordEnding(words)} · рекомендуемый минимум{' '}
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
    return <p className="text-sm text-[#69696d]">Загружаем изображение…</p>
  }
  if (!url) {
    return <p className="text-sm text-[#e23b3b]">Изображение недоступно.</p>
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title="Открыть в полном размере"
    >
      <img
        src={url}
        alt={`Визуальные данные для Writing Task ${taskPosition}`}
        className="max-h-[520px] w-full rounded-xl border object-contain"
      />
    </a>
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
  const detailQuery = useQuery({
    queryKey: attemptKeys.detail(attempt.id),
    queryFn: ({ signal }) => getAttempt(attempt.id, signal),
  })
  const evaluation = detailQuery.data?.writingEvaluation
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
          {material.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          IELTS Academic Writing · {material.tasks.length} задания ·{' '}
          {material.durationMinutes} минут
        </p>
      </div>

      {detailQuery.isError ? (
        <ErrorState
          title="Не удалось загрузить разбор"
          message={getErrorMessage(detailQuery.error)}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : !evaluation ? (
        <LoadingState label="Загружаем результаты проверки…" />
      ) : (
        <WritingEvaluationView
          attempt={attempt}
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
  attempt: Attempt
  material: PublicWritingMaterial
  evaluation: WritingEvaluation
}) {
  const criteriaList = [
    { label: 'Task Response', band: evaluation.criteria.taskResponse.band },
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
        bandNote="Оценка сформирована по 4 критериям IELTS Writing"
        criteria={criteriaList}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        durationMinutes={material.durationMinutes}
        paceUnit="эссе"
      />

      {evaluation.summary ? (
        <Card className="rounded-[16px] border border-[#e7e7e4] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Резюме проверки
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            {evaluation.summary}
          </p>
        </Card>
      ) : null}

      {evaluation.tasks
        .toSorted((left, right) => left.position - right.position)
        .map((task) => (
          <Card
            key={task.taskId}
            className="rounded-[16px] border border-[#e7e7e4] bg-white shadow-xs"
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Edit2 className="size-4 text-[#3b82f6]" aria-hidden />
                  Task {task.position}
                </CardTitle>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-sm font-bold text-[#3b82f6]">
                  Band {task.band.toFixed(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm leading-6">
              <p className="text-slate-700">{task.feedback}</p>
              <div className="grid gap-3 sm:grid-cols-2">
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
                      className="rounded-xl bg-[#f7f7f5] p-3"
                    >
                      <div className="flex items-center justify-between gap-2 font-semibold">
                        <span>{label as string}</span>
                        <span>{typedCriterion.band.toFixed(1)}</span>
                      </div>
                      <p className="mt-1 text-[#69696d]">
                        {typedCriterion.feedback}
                      </p>
                    </div>
                  )
                })}
              </div>
              <FeedbackList title="Сильные стороны" items={task.strengths} />
              <FeedbackList title="Что улучшить" items={task.improvements} />
            </CardContent>
          </Card>
        ))}

      <p className="flex items-center gap-2 text-xs text-[#808084]">
        <Book className="size-4" aria-hidden />
        Оценка носит учебный характер; фактический результат IELTS определяет
        экзаменатор.
      </p>
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
  return value === 1 ? 'слово' : value >= 2 && value <= 4 ? 'слова' : 'слов'
}
