import { ArrowLeft } from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { useAttemptDetail } from '@/features/attempts/use-attempt-detail'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AttemptPerformanceReport,
  ErrorState,
  LoadingState,
} from '@/features/attempts/attempt-ui'
import {
  getAttemptMaterial,
  getSpeakingRecordingBlob,
} from '@/features/attempts/api'
import type {
  AttemptDetail,
  SpeakingRecording,
  SpeakingCriterion,
  WritingCriterion,
} from '@/features/attempts/api'
import type { PublicListeningTest } from '@/features/listening/api'
import type { PublicReadingMaterial } from '@/features/reading/api'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'
import { ObjectiveAttemptReview } from '@/features/attempts/objective-attempt-review'
import { useAuth } from '@/features/auth/auth-store'
import { FullMockSectionComplete } from '@/pages/fullmock/full-mock-section-complete'
import { GuestAttemptReview } from './guest-attempt-review'

export { formatDateTime } from '@/lib/date'

export function AttemptReviewPage({
  attemptId,
  embedded = false,
}: {
  attemptId: string
  embedded?: boolean
}) {
  const { t } = useLanguage()
  const { guest, user } = useAuth()
  const detailQuery = useAttemptDetail(attemptId)
  const attempt = detailQuery.data ?? null
  const isObjectiveAttempt =
    attempt?.materialType === 'listening' || attempt?.materialType === 'reading'
  const materialQuery = useQuery<PublicListeningTest | PublicReadingMaterial>({
    queryKey: ['attempts', attemptId, 'material'],
    enabled:
      isObjectiveAttempt &&
      Boolean(user) &&
      !attempt.guestPreview &&
      !attempt.reviewLocked,
    retry: false,
    queryFn: ({ signal }) => {
      if (!attempt || !isObjectiveAttempt) {
        throw new Error('objective material is not loaded')
      }
      return getAttemptMaterial(attempt.id, signal)
    },
  })

  if (detailQuery.isPending) {
    return <LoadingState label={t('Загрузка…')} />
  }

  if (!attempt) {
    return (
      <ErrorState
        title={t('Не удалось загрузить попытку')}
        message={getErrorMessage(detailQuery.error)}
        onRetry={() => void detailQuery.refetch()}
      />
    )
  }

  if (attempt.reviewLocked && attempt.fullMockSessionId) {
    return <FullMockSectionComplete sessionId={attempt.fullMockSessionId} />
  }

  const material = materialQuery.data ?? null
  const aiEvaluation = evaluationFor(attempt, t)

  if (attempt.status === 'SUBMITTED' && (attempt.guestPreview || !user)) {
    return <GuestAttemptReview attempt={attempt} embedded={embedded} />
  }

  if (attempt.status === 'SUBMITTED' && isObjectiveAttempt) {
    return (
      <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
        {!embedded ? (
          <Button
            asChild
            variant="link"
            className="h-auto justify-self-start p-0"
          >
            <Link to="/progress">
              <ArrowLeft aria-hidden />
              {t('К прогрессу')}
            </Link>
          </Button>
        ) : null}
        <ObjectiveAttemptReview
          key={attempt.id}
          attempt={attempt}
          material={material}
          title={material?.title}
          showHeading={!embedded}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        {!embedded ? (
          <>
            <Button asChild variant="link" className="h-auto p-0">
              <Link to={guest ? '/try' : '/progress'}>
                <ArrowLeft aria-hidden />
                {guest ? t('К пробному тесту') : t('К прогрессу')}
              </Link>
            </Button>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {t('Работа над ошибками')}
            </h1>
          </>
        ) : null}
        <p className="mt-2 text-sm text-[#69696d]">
          {skillLabel(attempt.materialType)}
        </p>
      </div>
      {attempt.status === 'PROCESSING' ? (
        <ProcessingAttempt attempt={attempt} />
      ) : attempt.status !== 'SUBMITTED' ? (
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
      ) : (
        <p className="text-sm text-[#69696d]">{t('Нет ошибок')}</p>
      )}
    </div>
  )
}

function ProcessingAttempt({ attempt }: { attempt: AttemptDetail }) {
  const { t } = useLanguage()
  const assessment = attempt.writingAssessment ?? attempt.speakingAssessment
  return (
    <Card className="rounded-[16px] border-[#e7e7e4] shadow-none">
      <CardContent className="p-6">
        <p className="text-sm text-[#69696d]">
          {assessment?.status === 'FAILED'
            ? t('Не удалось проверить')
            : t('Проверяется')}
        </p>
      </CardContent>
    </Card>
  )
}

function InProgressAttempt({ attempt }: { attempt: AttemptDetail }) {
  const { t } = useLanguage()
  const { guest } = useAuth()
  if (attempt.status === 'ABANDONED') {
    return (
      <Card>
        <CardContent className="grid gap-4 p-6">
          <p className="font-semibold">{t('Секция завершена без оценки')}</p>
          <p>{t('Сохранённые черновики')}:</p>
          {(attempt.answers ?? []).map((item, index) => (
            <div key={item.questionId} className="whitespace-pre-wrap">
              <p className="font-medium">
                {t('Ответ')} {index + 1}
              </p>
              <p>
                {String(
                  item.answer.value ??
                    item.answer.optionId ??
                    (Array.isArray(item.answer.optionIds)
                      ? item.answer.optionIds.join(', ')
                      : ''),
                )}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }
  if (guest) {
    return (
      <Card>
        <CardContent className="grid gap-3 p-6">
          <p>{t('Разбор появится после сдачи секции.')}</p>
          <Button asChild>
            <Link to="/try">{t('Вернуться к пробному тесту')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="shadow-none">
      <CardContent className="grid justify-items-center gap-3 p-10 text-center">
        <p className="font-semibold">{t('Попытка ещё не завершена')}</p>
        <p className="text-sm text-[#69696d]">
          {t('Разбор появится после сдачи.')}
        </p>
        <Button asChild>
          {attempt.materialType === 'listening' ? (
            <Link
              to="/exam/listening/$testId"
              params={{ testId: attempt.materialId }}
            >
              {t('Продолжить практику')}
            </Link>
          ) : attempt.materialType === 'reading' ? (
            <Link
              to="/exam/reading/$materialId"
              params={{ materialId: attempt.materialId }}
            >
              {t('Продолжить практику')}
            </Link>
          ) : attempt.materialType === 'writing' ? (
            <Link
              to="/exam/writing/$materialId"
              params={{ materialId: attempt.materialId }}
            >
              {t('Продолжить практику')}
            </Link>
          ) : (
            <Link
              to="/exam/speaking/$materialId"
              params={{ materialId: attempt.materialId }}
            >
              {t('Продолжить практику')}
            </Link>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

type Criterion = (WritingCriterion | SpeakingCriterion) & {
  unavailable?: boolean
  displayBand?: string
}

type AIEvaluation = {
  skill: string
  overallBand: number
  summary: string
  pronunciationAvailable?: boolean
  criteria: [string, Criterion][]
  parts: {
    title: string
    feedback: string
    transcript?: string
    strengths: string[]
    improvements: string[]
  }[]
}

function evaluationFor(
  attempt: AttemptDetail,
  t: (source: string) => string,
): AIEvaluation | null {
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
    const isPronunciationAvailable = Boolean(
      evaluation.pronunciationAvailable &&
      evaluation.criteria.pronunciation.band > 0,
    )
    return {
      skill: 'Speaking',
      overallBand: evaluation.overallBand,
      summary: evaluation.summary,
      pronunciationAvailable: isPronunciationAvailable,
      criteria: [
        ['Fluency & Coherence', evaluation.criteria.fluency],
        ['Lexical Resource', evaluation.criteria.lexicalResource],
        ['Grammar Range & Accuracy', evaluation.criteria.grammar],
        [
          'Pronunciation',
          {
            ...evaluation.criteria.pronunciation,
            unavailable: !isPronunciationAvailable,
            feedback: !isPronunciationAvailable
              ? t(
                  'Наша система пока не может определить Pronunciation (произношение). Оценка сформирована по беглости, словарному запасу и грамматической точности.',
                )
              : evaluation.criteria.pronunciation.feedback,
          },
        ],
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
  const { t } = useLanguage()
  const criteriaList = evaluation.criteria.map(([label, criterion]) => ({
    label,
    band: criterion.band,
    unavailable: criterion.unavailable,
    displayBand: criterion.unavailable ? t('Не определяется') : undefined,
  }))

  const bandNote =
    evaluation.skill === 'Speaking' && !evaluation.pronunciationAvailable
      ? t(
          'Учебная оценка по 3 критериям (система пока не может определить произношение)',
        )
      : t(`Оценка сформирована по 4 критериям IELTS ${evaluation.skill}`)

  return (
    <>
      <AttemptPerformanceReport
        band={evaluation.overallBand}
        bandNote={bandNote}
        criteria={criteriaList}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        durationMinutes={attempt.materialType === 'writing' ? 60 : 15}
        paceUnit={attempt.materialType === 'writing' ? t('эссе') : t('часть')}
      />
      {evaluation.summary ? (
        <Card className="rounded-[16px] border border-[#e7e7e4] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {t('Резюме проверки')}
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            {evaluation.summary}
          </p>
        </Card>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {evaluation.criteria.map(([label, criterion]) => (
          <Card
            key={label}
            className={`rounded-[16px] border bg-white shadow-xs ${
              criterion.unavailable
                ? 'border-amber-200/80 bg-amber-50/20'
                : 'border-[#e7e7e4]'
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-900">{label}</h2>
                {criterion.unavailable ? (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                    {t('Пока не определяется')}
                  </span>
                ) : (
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-sm font-bold text-[#3b82f6]">
                    {criterion.band.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {criterion.feedback ||
                  (criterion.unavailable
                    ? t(
                        'Наша система пока не может определить произношение. Оценка рассчитывается по 3 критериям: беглость, вокабуляр и грамматика.',
                      )
                    : t('Комментарий не получен.'))}
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
                <strong>{t('Сильные стороны')}:</strong>{' '}
                {part.strengths.join(' · ')}
              </p>
            ) : null}
            {part.improvements.length > 0 ? (
              <p>
                <strong>{t('Что улучшить')}:</strong>{' '}
                {part.improvements.join(' · ')}
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
  const { t } = useLanguage()
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{t('Ваши аудиозаписи')}</CardTitle>
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
  const { t } = useLanguage()
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
        <p className="text-sm text-[#69696d]">{t('Загружаем запись…')}</p>
      ) : null}
      {query.isError ? (
        <p className="text-sm text-[#e23b3b]">
          {t('Не удалось загрузить аудиозапись.')}
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

function skillLabel(materialType: string) {
  return materialType.charAt(0).toUpperCase() + materialType.slice(1)
}
