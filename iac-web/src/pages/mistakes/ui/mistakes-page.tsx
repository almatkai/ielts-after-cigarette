import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ErrorState,
  LoadingState,
  formatAnswer,
} from '@/features/attempts/attempt-ui'
import { attemptKeys, getAttempt, listAttempts } from '@/features/attempts/api'
import type {
  AttemptMaterialType,
  AttemptReviewItem,
} from '@/features/attempts/api'
import { getErrorMessage } from '@/lib/api/client'

const cardClassName = 'gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none'

const materialTypeLabels: Record<AttemptMaterialType, string> = {
  listening: 'Listening',
  reading: 'Reading',
}

export function MistakesPage() {
  const listeningAttemptsQuery = useQuery({
    queryKey: attemptKeys.list('listening'),
    queryFn: ({ signal }) => listAttempts('listening', signal),
  })
  const readingAttemptsQuery = useQuery({
    queryKey: attemptKeys.list('reading'),
    queryFn: ({ signal }) => listAttempts('reading', signal),
  })

  const attemptsPending =
    listeningAttemptsQuery.isPending || readingAttemptsQuery.isPending
  const attemptsError = listeningAttemptsQuery.error ?? readingAttemptsQuery.error
  const submittedAttempts = [
    ...(listeningAttemptsQuery.data?.items ?? []),
    ...(readingAttemptsQuery.data?.items ?? []),
  ].filter((item) => item.status === 'SUBMITTED')

  // MVP: подгружаем разбор каждой сданной попытки отдельным запросом.
  const reviewQueries = useQueries({
    queries: submittedAttempts.map((item) => ({
      queryKey: attemptKeys.detail(item.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getAttempt(item.id, signal),
    })),
  })
  const loadedReviews = reviewQueries.filter((query) => query.isSuccess).length

  if (attemptsPending) {
    return <LoadingState label="Загружаем историю попыток…" />
  }
  if (attemptsError) {
    return (
      <ErrorState
        title="Не удалось загрузить историю попыток"
        message={getErrorMessage(attemptsError)}
        onRetry={() => {
          void listeningAttemptsQuery.refetch()
          void readingAttemptsQuery.refetch()
        }}
      />
    )
  }

  const groups = new Map<
    AttemptMaterialType,
    Map<
      string,
      { testTitle: string; attemptId: string; mistakes: AttemptReviewItem[] }
    >
  >()
  reviewQueries.forEach((query, index) => {
    const attempt = submittedAttempts[index]
    const review = query.data?.review ?? []
    const mistakes = review.filter((item) => !item.isCorrect)
    if (mistakes.length === 0) return
    const bySkill = groups.get(attempt.materialType) ?? new Map()
    const entry = bySkill.get(attempt.materialId) ?? {
      testTitle: attempt.testTitle,
      attemptId: attempt.id,
      mistakes: [],
    }
    entry.mistakes.push(...mistakes)
    bySkill.set(attempt.materialId, entry)
    groups.set(attempt.materialType, bySkill)
  })
  const totalMistakes = Array.from(groups.values()).reduce(
    (sum, bySkill) =>
      sum +
      Array.from(bySkill.values()).reduce(
        (acc, entry) => acc + entry.mistakes.length,
        0,
      ),
    0,
  )
  const reviewsPending =
    submittedAttempts.length > 0 && loadedReviews < submittedAttempts.length

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111111]">
          Разберите свои ошибки
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#69696d]">
          Неверные ответы из завершённых попыток — с пояснениями, чтобы не
          повторить их на экзамене.
        </p>
      </div>
      {reviewsPending ? (
        <p className="text-sm text-[#69696d]" role="status">
          Загружаем разборы… {loadedReviews}/{submittedAttempts.length}
        </p>
      ) : null}
      {!reviewsPending && totalMistakes === 0 ? (
        <Card className={cardClassName}>
          <CardContent className="grid justify-items-center gap-3 p-10 text-center">
            <p className="font-semibold">
              {submittedAttempts.length === 0
                ? 'Ошибок пока нет'
                : 'Ни одной ошибки — отличная работа!'}
            </p>
            <p className="text-sm text-[#69696d]">
              {submittedAttempts.length === 0
                ? 'Пройдите первый тест, и сложные вопросы появятся здесь.'
                : 'Все вопросы в завершённых попытках решены верно.'}
            </p>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="shadow-none">
                <Link to="/dashboard/listening">Listening</Link>
              </Button>
              <Button asChild variant="outline" className="shadow-none">
                <Link to="/dashboard/reading">Reading</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        Array.from(groups.entries()).map(([materialType, bySkill]) => (
          <section key={materialType} className="grid gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              {materialTypeLabels[materialType]}
            </h2>
            {Array.from(bySkill.values()).map((entry) => (
              <Card key={entry.attemptId} className={cardClassName}>
                <CardHeader className="border-b border-[#ededeb] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base tracking-[-0.02em]">
                      {entry.testTitle}
                    </CardTitle>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="shadow-none"
                    >
                      <Link
                        to="/dashboard/attempts/$attemptId"
                        params={{ attemptId: entry.attemptId }}
                      >
                        Полный разбор
                        <ArrowRight aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 p-5">
                  {entry.mistakes.map((item) => (
                    <MistakeRow key={item.questionId} item={item} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </section>
        ))
      )}
    </div>
  )
}

function MistakeRow({ item }: { item: AttemptReviewItem }) {
  return (
    <div className="grid gap-2 rounded-lg border border-[#ededeb] p-3 text-sm">
      <p className="font-medium">
        <span className="mr-2 text-[#3b82f6]">{item.number}.</span>
        {item.prompt.replace('{{answer}}', '_____')}
      </p>
      <p>
        Ваш ответ: <strong>{formatAnswer(item.answer, [])}</strong>
      </p>
      <p>
        Правильный ответ:{' '}
        <strong className="text-emerald-700">
          {formatAnswer(item.correctAnswer, [])}
        </strong>
      </p>
      {item.explanation ? (
        <p className="whitespace-pre-wrap text-[#69696d]">{item.explanation}</p>
      ) : null}
    </div>
  )
}
