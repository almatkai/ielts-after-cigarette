import {
  ArrowLeft,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AttemptPerformanceReport,
  EnhancedReviewQuestion,
  ErrorState,
  ExamLoadingScreen,
  LoadingState,
} from '@/features/attempts/attempt-ui'
import type { Option } from '@/features/attempts/attempt-ui'
import {
  attemptKeys,
  getAttempt,
  getSpeakingRecordingBlob,
} from '@/features/attempts/api'
import type {
  AttemptDetail,
  AttemptReviewItem,
  SpeakingRecording,
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
    return (
      <ExamLoadingScreen
        badge="Анализ попытки"
        label="Загружаем разбор попытки…"
        description="Подготавливаем детальный отчёт по ответам, баллам и критериям оценивания..."
        showTimerTip={false}
      />
    )
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
    material?.title ?? `${skillLabel(attempt.materialType)}: Разбор работы`

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
        <>
          <AIEvaluationReview attempt={attempt} evaluation={aiEvaluation} />
          {attempt.materialType === 'speaking' &&
          (attempt.recordings?.length ?? 0) > 0 ? (
            <SpeakingRecordings
              attemptId={attempt.id}
              recordings={attempt.recordings ?? []}
            />
          ) : null}
        </>
      ) : review === null ? (
        <LoadingState label="Загружаем разбор ответов…" />
      ) : (
        <>
          <AttemptPerformanceReport
            band={attempt.band}
            score={attempt.score}
            maxScore={attempt.maxScore}
            correctCount={review.filter((item) => item.isCorrect).length}
            totalQuestions={review.length}
            startedAt={attempt.startedAt}
            submittedAt={attempt.submittedAt}
            durationMinutes={
              material && 'durationMinutes' in material
                ? (material as any).durationMinutes
                : attempt.materialType === 'reading'
                  ? 60
                  : 30
            }
            paceUnit="вопрос"
          />
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
              to="/exam/listening/$testId"
              params={{ testId: attempt.materialId }}
            >
              Продолжить практику
            </Link>
          ) : attempt.materialType === 'reading' ? (
            <Link
              to="/exam/reading/$materialId"
              params={{ materialId: attempt.materialId }}
            >
              Продолжить практику
            </Link>
          ) : attempt.materialType === 'writing' ? (
            <Link
              to="/exam/writing/$materialId"
              params={{ materialId: attempt.materialId }}
            >
              Продолжить практику
            </Link>
          ) : (
            <Link
              to="/exam/speaking/$materialId"
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

function AIEvaluationReview({
  attempt,
  evaluation,
}: {
  attempt: AttemptDetail
  evaluation: AIEvaluation
}) {
  const criteriaList = evaluation.criteria.map(([label, criterion]) => ({
    label,
    band: criterion.band,
  }))

  return (
    <>
      <AttemptPerformanceReport
        band={evaluation.overallBand}
        bandNote={`Оценка сформирована по 4 критериям IELTS ${evaluation.skill}`}
        criteria={criteriaList}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        durationMinutes={attempt.materialType === 'writing' ? 60 : 15}
        paceUnit={attempt.materialType === 'writing' ? 'эссе' : 'часть'}
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
      <div className="grid gap-3 sm:grid-cols-2">
        {evaluation.criteria.map(([label, criterion]) => (
          <Card key={label} className="rounded-[16px] border border-[#e7e7e4] bg-white shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-900">{label}</h2>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-sm font-bold text-[#3b82f6]">
                  {criterion.band.toFixed(1)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
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

function SpeakingRecordings({
  attemptId,
  recordings,
}: {
  attemptId: string
  recordings: SpeakingRecording[]
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Ваши аудиозаписи</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {recordings.map((recording, index) => (
          <SpeakingRecordingPlayer
            key={recording.id}
            attemptId={attemptId}
            recording={recording}
            label={`Part ${index + 1}`}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function SpeakingRecordingPlayer({
  attemptId,
  recording,
  label,
}: {
  attemptId: string
  recording: SpeakingRecording
  label: string
}) {
  const query = useQuery({
    queryKey: ['attempts', attemptId, 'recordings', recording.partId],
    queryFn: () => getSpeakingRecordingBlob(attemptId, recording.partId),
  })
  const source = useBlobUrl(query.data)
  return (
    <div className="grid gap-2 rounded-xl border border-[#ededeb] p-4">
      <p className="text-sm font-medium">{label}</p>
      {source ? <audio controls src={source} className="w-full" /> : null}
      {query.isPending ? (
        <p className="text-sm text-[#69696d]">Загружаем запись…</p>
      ) : null}
      {query.isError ? (
        <p className="text-sm text-[#e23b3b]">
          Не удалось загрузить аудиозапись.
        </p>
      ) : null}
    </div>
  )
}

function useBlobUrl(blob: Blob | undefined) {
  const [url, setURL] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) {
      setURL(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setURL(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
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
                        <EnhancedReviewQuestion
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
  const passages =
    material.passages && material.passages.length > 0
      ? material.passages
      : [material]
  return (
    <div className="grid gap-5">
      {passages.map((passage, passageIndex) => (
        <Card key={passage.id} className="shadow-none">
          <CardHeader>
            <CardTitle>
              Passage {passageIndex + 1}: {passage.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-5">
            {passage.questionGroups.map((group) => (
              <section
                key={`${passage.id}-${group.position}`}
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
                      <EnhancedReviewQuestion
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
    </div>
  )
}

function FlatReview({ review }: { review: AttemptReviewItem[] }) {
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-3 p-5">
        {review.map((item) => (
          <EnhancedReviewQuestion key={item.questionId} item={item} options={[]} />
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
