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
import type {
  AttemptDetail,
  AttemptReviewItem,
  SpeakingCriterion,
  WritingCriterion,
} from '@/features/attempts/api'
import { getPublicListeningTest } from '@/features/listening/api'
import type { PublicListeningTest } from '@/features/listening/api'
import { getPublicReadingMaterial } from '@/features/reading/api'
import type { PublicReadingMaterial } from '@/features/reading/api'
import { getErrorMessage } from '@/lib/api/client'

export function AttemptReviewPage({ attemptId }: { attemptId: string }) {
  const detailQuery = useQuery({
    queryKey: attemptKeys.detail(attemptId),
    queryFn: ({ signal }) => getAttempt(attemptId, signal),
  })
  const attempt = detailQuery.data ?? null
  const isObjectiveAttempt =
    attempt?.materialType === 'listening' || attempt?.materialType === 'reading'
  const materialQuery = useQuery<PublicListeningTest | PublicReadingMaterial>({
    queryKey: ['attempts', attemptId, 'material'],
    enabled: isObjectiveAttempt,
    retry: false,
    queryFn: ({ signal }) => {
      if (!attempt || !isObjectiveAttempt) {
        throw new Error('objective material is not loaded')
      }
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
  const review = attempt.status === 'SUBMITTED' ? (attempt.review ?? []) : null
  const aiEvaluation = evaluationFor(attempt)
  const title =
    material?.title ?? `${skillLabel(attempt.materialType)}: AI-разбор`

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
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
          {skillLabel(attempt.materialType)} · попытка от{' '}
          {formatDateTime(attempt.startedAt)}
        </p>
      </div>
      {attempt.status !== 'SUBMITTED' ? (
        <InProgressAttempt attempt={attempt} />
      ) : aiEvaluation ? (
        <AIEvaluationReview evaluation={aiEvaluation} />
      ) : review === null ? (
        <LoadingState label="Загружаем разбор ответов…" />
      ) : (
        <>
          <AttemptResultSummary attempt={attempt} review={review} />
          {material !== null ? (
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

function InProgressAttempt({ attempt }: { attempt: AttemptDetail }) {
  return (
    <Card className="shadow-none">
      <CardContent className="grid justify-items-center gap-3 p-10 text-center">
        <p className="font-semibold">Попытка ещё не завершена</p>
        <p className="text-sm text-[#69696d]">Разбор появится после сдачи.</p>
        <Button asChild>
          {attempt.materialType === 'listening' ? (
            <Link
              to="/dashboard/listening/$testId"
              params={{ testId: attempt.materialId }}
            >
              Продолжить практику
            </Link>
          ) : attempt.materialType === 'reading' ? (
            <Link
              to="/dashboard/reading/$materialId"
              params={{ materialId: attempt.materialId }}
            >
              Продолжить практику
            </Link>
          ) : attempt.materialType === 'writing' ? (
            <Link
              to="/dashboard/writing/$materialId"
              params={{ materialId: attempt.materialId }}
            >
              Продолжить практику
            </Link>
          ) : (
            <Link
              to="/dashboard/speaking/$materialId"
              params={{ materialId: attempt.materialId }}
            >
              Продолжить практику
            </Link>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

type Criterion = WritingCriterion | SpeakingCriterion

type AIEvaluation = {
  skill: string
  overallBand: number
  summary: string
  criteria: [string, Criterion][]
  parts: {
    title: string
    feedback: string
    transcript?: string
    strengths: string[]
    improvements: string[]
  }[]
}

function evaluationFor(attempt: AttemptDetail): AIEvaluation | null {
  if (attempt.writingEvaluation) {
    const evaluation = attempt.writingEvaluation
    return {
      skill: 'Writing',
      overallBand: evaluation.overallBand,
      summary: evaluation.summary,
      criteria: [
        ['Task Response', evaluation.criteria.taskResponse],
        ['Coherence & Cohesion', evaluation.criteria.coherence],
        ['Lexical Resource', evaluation.criteria.lexicalResource],
        ['Grammar Range & Accuracy', evaluation.criteria.grammar],
      ],
      parts: evaluation.tasks.map((task, index) => ({
        title: `Task ${index + 1}`,
        feedback: task.feedback,
        strengths: task.strengths,
        improvements: task.improvements,
      })),
    }
  }
  if (attempt.speakingEvaluation) {
    const evaluation = attempt.speakingEvaluation
    return {
      skill: 'Speaking',
      overallBand: evaluation.overallBand,
      summary: evaluation.summary,
      criteria: [
        ['Fluency & Coherence', evaluation.criteria.fluency],
        ['Lexical Resource', evaluation.criteria.lexicalResource],
        ['Grammar Range & Accuracy', evaluation.criteria.grammar],
        ['Pronunciation', evaluation.criteria.pronunciation],
      ],
      parts: evaluation.parts.map((part, index) => ({
        title: `Part ${index + 1}`,
        feedback: part.feedback,
        transcript: part.transcript,
        strengths: part.strengths,
        improvements: part.improvements,
      })),
    }
  }
  return null
}

function AIEvaluationReview({ evaluation }: { evaluation: AIEvaluation }) {
  return (
    <>
      <Card className="border-[#dbeafe] bg-[#eff6ff] shadow-none">
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <span className="grid size-14 place-items-center rounded-full bg-[#3b82f6] text-2xl font-semibold text-white">
            {evaluation.overallBand.toFixed(1)}
          </span>
          <div>
            <p className="font-semibold">
              Ориентировочный IELTS {evaluation.skill} band
            </p>
            <p className="mt-1 text-sm leading-6 text-[#4b5563]">
              {evaluation.summary}
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {evaluation.criteria.map(([label, criterion]) => (
          <Card key={label} className="shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{label}</h2>
                <span className="text-xl font-semibold text-[#3b82f6]">
                  {criterion.band.toFixed(1)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#69696d]">
                {criterion.feedback}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {evaluation.parts.map((part) => (
        <Card key={part.title} className="shadow-none">
          <CardHeader>
            <CardTitle>{part.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <p>{part.feedback}</p>
            {part.transcript ? (
              <p className="whitespace-pre-wrap rounded-xl bg-[#f7f7f5] p-4">
                {part.transcript}
              </p>
            ) : null}
            {part.strengths.length > 0 ? (
              <p>
                <strong>Сильные стороны:</strong> {part.strengths.join(' · ')}
              </p>
            ) : null}
            {part.improvements.length > 0 ? (
              <p>
                <strong>Что улучшить:</strong> {part.improvements.join(' · ')}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </>
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#3b82f6]">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-[#3b82f6]">
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

function skillLabel(materialType: string) {
  return materialType.charAt(0).toUpperCase() + materialType.slice(1)
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
