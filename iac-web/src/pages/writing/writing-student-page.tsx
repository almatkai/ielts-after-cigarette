import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, BookOpenText, PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAttemptSession } from '@/features/attempts/attempt-session'
import {
  AttemptSubmitBar,
  ErrorState,
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
import type { PublicWritingMaterial, WritingTask } from '@/features/writing/api'
import { getErrorMessage } from '@/lib/api/client'

export function WritingStudentPage({ materialId }: { materialId: string }) {
  const startQuery = useQuery({
    queryKey: ['writing', 'materials', materialId, 'attempt'],
    queryFn: ({ signal }) => startWritingAttempt(materialId, signal),
  })
  if (startQuery.isPending) {
    return <LoadingState label="Готовим Writing-тренировку…" />
  }
  if (!startQuery.data) {
    return (
      <ErrorState
        title="Не удалось начать Writing"
        message={getErrorMessage(startQuery.error)}
        onRetry={() => void startQuery.refetch()}
      />
    )
  }
  return (
    <WritingAttemptRunner
      attempt={startQuery.data.attempt}
      material={startQuery.data.material}
    />
  )
}

function WritingAttemptRunner({
  attempt,
  material,
}: {
  attempt: Attempt
  material: PublicWritingMaterial
}) {
  const session = useAttemptSession(attempt.id)

  if (session.submitted) {
    return (
      <WritingAttemptResult attempt={session.submitted} material={material} />
    )
  }
  if (session.answers === null) {
    return <LoadingState label="Восстанавливаем сохранённые черновики…" />
  }
  const answeredCount = material.tasks.filter((task) => {
    const value = session.answers?.[task.id]?.value
    return typeof value === 'string' && value.trim().length > 0
  }).length

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[920px] gap-5">
      <div>
        <Button asChild variant="link" className="h-auto p-0">
          <Link to="/dashboard/writing">
            <ArrowLeft aria-hidden />К Writing
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            {material.title}
          </h1>
          <div className="flex items-center gap-3">
            <SaveIndicator state={session.saveState} />
            <WritingClock startedAt={attempt.startedAt} />
          </div>
        </div>
        <p className="mt-2 text-sm text-[#69696d]">
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
      {material.tasks.map((task) => {
        const value = session.answers?.[task.id]?.value
        const text = typeof value === 'string' ? value : ''
        return (
          <WritingTaskEditor
            key={task.id}
            task={task}
            text={text}
            onChange={(next) => session.updateAnswer(task.id, { value: next })}
          />
        )
      })}
      <AttemptSubmitBar
        answeredCount={answeredCount}
        totalQuestions={material.tasks.length}
        isSubmitting={session.isSubmitting}
        onSubmit={session.submit}
      />
    </div>
  )
}

function WritingClock({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])
  const secondsRemaining = Math.max(
    0,
    60 * 60 - Math.floor((now - new Date(startedAt).getTime()) / 1000),
  )
  return (
    <TimeBadge
      seconds={secondsRemaining}
      danger={secondsRemaining < 5 * 60}
      label="Осталось 60 минут на Writing"
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
        {task.visualUrl ? (
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

function WritingAttemptResult({
  attempt,
  material,
}: {
  attempt: Attempt
  material: PublicWritingMaterial
}) {
  const detailQuery = useQuery({
    queryKey: attemptKeys.detail(attempt.id),
    queryFn: ({ signal }) => getAttempt(attempt.id, signal),
  })
  const evaluation = detailQuery.data?.writingEvaluation
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[920px] gap-5">
      <div>
        <Button asChild variant="link" className="h-auto p-0">
          <Link to="/dashboard/writing">
            <ArrowLeft aria-hidden />К Writing
          </Link>
        </Button>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {material.title}: разбор
        </h1>
      </div>
      {detailQuery.isError ? (
        <ErrorState
          title="Не удалось загрузить разбор"
          message={getErrorMessage(detailQuery.error)}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : !evaluation ? (
        <LoadingState label="Загружаем AI-разбор…" />
      ) : (
        <WritingEvaluationView evaluation={evaluation} />
      )}
    </div>
  )
}

function WritingEvaluationView({
  evaluation,
}: {
  evaluation: WritingEvaluation
}) {
  const criteria = [
    ['Task Response', evaluation.criteria.taskResponse],
    ['Coherence & Cohesion', evaluation.criteria.coherence],
    ['Lexical Resource', evaluation.criteria.lexicalResource],
    ['Grammar Range & Accuracy', evaluation.criteria.grammar],
  ] as const
  return (
    <>
      <Card className="border-[#dbeafe] bg-[#eff6ff] shadow-none">
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <span className="grid size-14 place-items-center rounded-full bg-[#3b82f6] text-2xl font-semibold text-white">
            {evaluation.overallBand.toFixed(1)}
          </span>
          <div>
            <p className="font-semibold">Ориентировочный IELTS Writing band</p>
            <p className="mt-1 text-sm leading-6 text-[#4b5563]">
              {evaluation.summary || 'Разбор подготовлен AI-моделью.'}
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {criteria.map(([label, criterion]) => (
          <Card key={label} className="shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{label}</h2>
                <span className="text-xl font-semibold text-[#3b82f6]">
                  {criterion.band.toFixed(1)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#69696d]">
                {criterion.feedback || 'Комментарий не получен.'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {evaluation.tasks.map((task, index) => (
        <Card key={task.taskId} className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="size-4 text-[#3b82f6]" aria-hidden />
              Task {index + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6">
            <p>{task.feedback}</p>
            <FeedbackList title="Сильные стороны" items={task.strengths} />
            <FeedbackList title="Что улучшить" items={task.improvements} />
          </CardContent>
        </Card>
      ))}
      <p className="flex items-center gap-2 text-xs text-[#808084]">
        <BookOpenText className="size-4" aria-hidden />
        Оценка носит учебный характер; фактический результат IELTS определяет
        экзаменатор.
      </p>
    </>
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
