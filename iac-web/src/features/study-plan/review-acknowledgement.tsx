import { useState } from 'react'
import { ArrowLeft2, TickCircle } from 'iconsax-react'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { acknowledgeReview } from './api'
import { studyError, useStudyPlan, useStudyWriter } from './queries'
import { planCard } from './summary'

export function ReviewAcknowledgement({
  assignmentId,
  attemptId,
}: {
  assignmentId: string
  attemptId: string
}) {
  const query = useStudyPlan()
  const write = useStudyWriter()
  const [viewed, setViewed] = useState(false)
  const mutation = useMutation({
    mutationFn: () =>
      write(() => acknowledgeReview(assignmentId, query.data!.plan!.revision)),
  })
  const day = query.data?.plan?.days.find((d) => d.date === query.data.today)
  const assignment = day?.assignments.find(
    (a) =>
      a.id === assignmentId &&
      a.kind === 'REVIEW' &&
      a.sourceAttemptId === attemptId,
  )
  if (!assignment) return null
  return (
    <section
      className={`${planCard} grid gap-3 p-4`}
      aria-label="Разбор в плане"
    >
      {assignment.status === 'COMPLETED' ? (
        <p className="flex items-start gap-2 text-sm">
          <TickCircle
            size={16}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[#15803d]"
          />
          Разбор просмотрен. Это не новая оценка и не подтверждение освоения.
        </p>
      ) : (
        <>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={viewed}
              onChange={(e) => setViewed(e.target.checked)}
            />
            Я просмотрел разбор этой работы
          </label>
          <p className="text-xs text-muted-foreground">
            Отметка сохраняет просмотр, а не результат новой проверки.
          </p>
          <Button
            variant="outline"
            className="min-h-11 justify-self-start"
            disabled={!viewed || mutation.isPending || query.isFetching}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Сохраняем…' : 'Подтвердить просмотр разбора'}
          </Button>
          {mutation.isError ? (
            <p role="alert" className="text-sm text-[#e23b3b]">
              {studyError(mutation.error)}
            </p>
          ) : null}
        </>
      )}
      <Button asChild variant="ghost" className="min-h-11 justify-self-start">
        <Link to="/plan" search={{ view: 'day' }}>
          <ArrowLeft2 size={16} aria-hidden="true" />
          Вернуться к плану
        </Link>
      </Button>
    </section>
  )
}
