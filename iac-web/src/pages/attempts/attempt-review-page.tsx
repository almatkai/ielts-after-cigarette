import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AttemptResultSummary,
  ErrorState,
  LoadingState,
  ReviewQuestion,
} from '@/features/attempts/attempt-ui'
import type { Option } from '@/features/attempts/attempt-ui'
import { attemptKeys, getAttempt } from '@/features/attempts/api'
import type { AttemptReviewItem } from '@/features/attempts/api'
import { getPublicListeningTest } from '@/features/listening/api'
import type { PublicListeningTest } from '@/features/listening/api'
import { getPublicReadingMaterial } from '@/features/reading/api'
import type { PublicReadingMaterial } from '@/features/reading/api'
import { getErrorMessage } from '@/lib/api/client'

// Страница разбора попытки по её id: открывается из истории прогресса и
// страницы ошибок. Структуру материала (группы, опции) подгружаем из
// публичных эндпоинтов; если она недоступна (например, материал снят с
// публикации), показываем плоский список вопросов.
export function AttemptReviewPage({ attemptId }: { attemptId: string }) {
  const detailQuery = useQuery({
    queryKey: attemptKeys.detail(attemptId),
    queryFn: ({ signal }) => getAttempt(attemptId, signal),
  })
  const attempt = detailQuery.data ?? null
  const materialQuery = useQuery<PublicListeningTest | PublicReadingMaterial>({
    queryKey: ['attempts', attemptId, 'material'],
    enabled: attempt !== null,
    retry: false,
    queryFn: ({ signal }) => {
      if (!attempt) throw new Error('attempt is not loaded')
      return attempt.materialType === 'listening'
        ? getPublicListeningTest(attempt.materialId, signal)
        : getPublicReadingMaterial(attempt.materialId, signal)
    },
  })

  if (detailQuery.isPending) {
    return <LoadingState label="Загружаем разбор попытки…" />
  }
  if (!attempt) {
    return (
      <ErrorState
        title="Не удалось загрузить попытку"
        message={getErrorMessage(detailQuery.error)}
        onRetry={() => void detailQuery.refetch()}
      />
    )
  }

  const material = materialQuery.data ?? null
  const title = material?.title ?? 'Разбор попытки'
  const review =
    attempt.status === 'SUBMITTED' ? (attempt.review ?? []) : null

  return (
    <div className="grid gap-5">
      <div>
        <Button asChild variant="link" className="h-auto p-0">
          <Link to="/dashboard/progress">
            <ArrowLeft aria-hidden />К прогрессу
          </Link>
        </Button>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#69696d]">
          {attempt.materialType === 'listening' ? 'Listening' : 'Reading'} ·
          попытка от {formatDateTime(attempt.startedAt)}
        </p>
      </div>
      {attempt.status !== 'SUBMITTED' ? (
        <Card className="shadow-none">
          <CardContent className="grid justify-items-center gap-3 p-10 text-center">
            <p className="font-semibold">Попытка ещё не завершена</p>
            <p className="text-sm text-[#69696d]">
              Разбор появится после сдачи теста.
            </p>
            <Button asChild>
              {attempt.materialType === 'listening' ? (
                <Link
                  to="/dashboard/listening/$testId"
                  params={{ testId: attempt.materialId }}
                >
                  Продолжить тест
                </Link>
              ) : (
                <Link
                  to="/dashboard/reading/$materialId"
                  params={{ materialId: attempt.materialId }}
                >
                  Продолжить тест
                </Link>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <AttemptResultSummary attempt={attempt} review={review} />
          {review === null ? (
            <LoadingState label="Загружаем разбор ответов…" />
          ) : material !== null ? (
            <StructuredReview material={material} review={review} />
          ) : materialQuery.isPending ? (
            <LoadingState label="Загружаем структуру материала…" />
          ) : (
            <FlatReview review={review} />
          )}
        </>
      )}
    </div>
  )
}

function StructuredReview({
  material,
  review,
}: {
  material: PublicListeningTest | PublicReadingMaterial
  review: AttemptReviewItem[]
}) {
  const reviewByQuestionId = new Map(
    review.map((item) => [item.questionId, item]),
  )
  if ('parts' in material) {
    return (
      <>
        {material.parts.map((part) => (
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#e23b3b]">
                      {group.type.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {group.instructions}
                    </p>
                  </div>
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
        ))}
      </>
    )
  }
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-5 p-5">
        {material.questionGroups.map((group) => (
          <section
            key={group.position}
            className="grid gap-3 rounded-xl border p-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#e23b3b]">
                {group.type.replaceAll('_', ' ')}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {group.instructions}
              </p>
            </div>
            <div className="grid gap-3">
              {group.questions.map((question) => {
                const item = question.id
                  ? reviewByQuestionId.get(question.id)
                  : undefined
                if (!item || !question.id) return null
                const options = (question.content.options ?? []) as Option[]
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
  )
}

function FlatReview({ review }: { review: AttemptReviewItem[] }) {
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-3 p-5">
        {review.map((item) => (
          <ReviewQuestion key={item.questionId} item={item} options={[]} />
        ))}
      </CardContent>
    </Card>
  )
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
