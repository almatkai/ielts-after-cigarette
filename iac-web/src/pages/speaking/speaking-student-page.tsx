import {
  ArrowLeft,
  Book,
  Microphone2,
  StopCircle,
  TickCircle,
  Timer1,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAttemptSession } from '@/features/attempts/attempt-session'
import {
  ErrorState,
  ExamLoadingScreen,
  LoadingState,
  SaveIndicator,
  TimeBadge,
} from '@/features/attempts/attempt-ui'
import {
  attemptKeys,
  getAttempt,
  startSpeakingAttempt,
  uploadSpeakingRecording,
} from '@/features/attempts/api'
import type {
  Attempt,
  SpeakingEvaluation,
  SpeakingRecording,
} from '@/features/attempts/api'
import type {
  PublicSpeakingMaterial,
  SpeakingPart,
} from '@/features/speaking/api'
import { getErrorMessage } from '@/lib/api/client'

type PartPhase = 'ready' | 'preparing' | 'recording' | 'uploading' | 'finished'

export function SpeakingStudentPage({ materialId }: { materialId: string }) {
  const startQuery = useQuery({
    queryKey: ['speaking', 'materials', materialId, 'attempt'],
    queryFn: ({ signal }) => startSpeakingAttempt(materialId, signal),
  })
  if (startQuery.isPending) {
    return (
      <ExamLoadingScreen
        badge="IELTS Speaking"
        label="Готовим Speaking-тренировку…"
        description="Формируем карточки заданий Parts 1–3 и инициализируем модуль записи голоса."
      />
    )
  }
  if (!startQuery.data) {
    return (
      <ErrorState
        title="Не удалось начать Speaking"
        message={getErrorMessage(startQuery.error)}
        onRetry={() => void startQuery.refetch()}
      />
    )
  }
  return (
    <SpeakingAttemptRunner
      key={startQuery.data.attempt.id}
      attempt={startQuery.data.attempt}
      material={startQuery.data.material}
    />
  )
}

export function SpeakingAttemptRunner({
  attempt,
  material,
  fullMockSessionId,
}: {
  attempt: Attempt
  material: PublicSpeakingMaterial
  fullMockSessionId?: string
}) {
  const session = useAttemptSession(attempt.id)
  const detailQuery = useQuery({
    queryKey: attemptKeys.detail(attempt.id),
    queryFn: ({ signal }) => getAttempt(attempt.id, signal),
  })
  const [activeIndex, setActiveIndex] = useState(0)

  if (session.submitted) {
    return (
      <SpeakingAttemptResult
        attempt={session.submitted}
        material={material}
        fullMockSessionId={fullMockSessionId}
      />
    )
  }
  if (session.answers === null) {
    return (
      <ExamLoadingScreen
        badge="IELTS Speaking"
        label="Восстанавливаем ответы…"
        description="Синхронизируем записанные ответы и статус сессии..."
      />
    )
  }
  const part = material.parts[activeIndex]
  const recordings = detailQuery.data?.recordings ?? []
  const completed = material.parts.filter((item) =>
    hasPartResponse(item.id, session.answers ?? {}, recordings),
  ).length

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
      <div>
        <Button asChild variant="link" className="sr-only">
          <Link to="/dashboard/speaking">
            <ArrowLeft aria-hidden />К Speaking
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="sr-only">{material.title}</h1>
            <p className="mt-1 text-sm text-[#69696d]">
              {material.examType === 'academic'
                ? 'Academic'
                : 'General Training'}
              {' · '}Part {activeIndex + 1} of {material.parts.length}
            </p>
          </div>
          <SaveIndicator state={session.saveState} />
        </div>
      </div>
      {session.submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#e23b3b]"
        >
          Не удалось отправить Speaking: {session.submitError}
        </p>
      ) : null}
      <div
        className="grid grid-cols-3 gap-2"
        aria-label="Прогресс частей Speaking"
      >
        {material.parts.map((item, index) => {
          const ready = hasPartResponse(
            item.id,
            session.answers ?? {},
            recordings,
          )
          return (
            <button
              key={item.id}
              type="button"
              className={`rounded-lg border px-3 py-2 text-left text-sm ${index === activeIndex ? 'border-[#3b82f6] bg-[#eff6ff]' : 'border-[#deded9]'} ${ready ? 'text-emerald-700' : 'text-[#69696d]'}`}
              onClick={() => setActiveIndex(index)}
            >
              <span className="block font-semibold">Part {item.position}</span>
              <span className="text-xs">
                {ready
                  ? 'Ответ готов'
                  : index === activeIndex
                    ? 'Сейчас'
                    : 'Не начато'}
              </span>
            </button>
          )
        })}
      </div>
      <SpeakingPartRunner
        key={part.id}
        attemptId={attempt.id}
        part={part}
        initialTranscript={answerText(session.answers[part.id])}
        hasRecording={recordings.some((item) => item.partId === part.id)}
        onTranscriptChange={(text) =>
          session.updateAnswer(part.id, { value: text })
        }
        onRecordingUploaded={() => void detailQuery.refetch()}
        onPrevious={
          activeIndex > 0
            ? () => setActiveIndex((index) => index - 1)
            : undefined
        }
        onNext={
          activeIndex < material.parts.length - 1
            ? () => setActiveIndex((index) => index + 1)
            : undefined
        }
        onSubmit={session.submit}
        isSubmitting={session.isSubmitting}
        completedCount={completed}
        totalParts={material.parts.length}
      />
    </div>
  )
}

function SpeakingPartRunner({
  attemptId,
  part,
  initialTranscript,
  hasRecording,
  onTranscriptChange,
  onRecordingUploaded,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  completedCount,
  totalParts,
}: {
  attemptId: string
  part: SpeakingPart
  initialTranscript: string
  hasRecording: boolean
  onTranscriptChange: (text: string) => void
  onRecordingUploaded: () => void
  onPrevious?: () => void
  onNext?: () => void
  onSubmit: () => void
  isSubmitting: boolean
  completedCount: number
  totalParts: number
}) {
  const [phase, setPhase] = useState<PartPhase>('ready')
  const [remaining, setRemaining] = useState(part.responseSeconds)
  const [prepared, setPrepared] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const stopRef = useRef<() => void>(() => {})
  const deadlineRef = useRef<number | null>(null)
  const recorder = useAudioRecorder({
    attemptId,
    partId: part.id,
    onUploaded: () => {
      onRecordingUploaded()
      setPhase('finished')
      setRecordingError(null)
    },
    onError: (message) => {
      deadlineRef.current = null
      setRecordingError(message)
      setPhase('ready')
    },
  })

  stopRef.current = () => {
    recorder.stop()
    setPhase('uploading')
  }

  useEffect(() => {
    if (phase !== 'preparing' && phase !== 'recording') return
    const deadline = deadlineRef.current
    if (deadline === null) return
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds > 0) return
      window.clearInterval(timer)
      if (phase === 'preparing') {
        deadlineRef.current = null
        setPhase('ready')
        setRemaining(part.responseSeconds)
        setPrepared(true)
      } else {
        stopRef.current()
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [part.responseSeconds, phase])

  const beginPreparation = () => {
    setRecordingError(null)
    setPrepared(false)
    deadlineRef.current = Date.now() + part.preparationSeconds * 1000
    setRemaining(part.preparationSeconds)
    setPhase('preparing')
  }
  const beginRecording = async () => {
    setRecordingError(null)
    const started = await recorder.start()
    if (!started) return
    deadlineRef.current = Date.now() + part.responseSeconds * 1000
    setRemaining(part.responseSeconds)
    setPhase('recording')
  }
  const responseReady = hasRecording || initialTranscript.trim().length > 0

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Microphone2 className="size-5 text-[#3b82f6]" aria-hidden />
              Part {part.position}: {part.title}
            </CardTitle>
            {part.instructions ? (
              <p className="mt-2 text-sm leading-6 text-[#69696d]">
                {part.instructions}
              </p>
            ) : null}
          </div>
          <TimeBadge
            seconds={remaining}
            danger={phase === 'recording' && remaining < 30}
            label={
              phase === 'preparing' ? 'Время на подготовку' : 'Время на ответ'
            }
          />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <PartPrompt part={part} />
        {recordingError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[#e23b3b]">
            {recordingError}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {part.type === 'part2' && phase === 'ready' && !prepared ? (
            <Button type="button" variant="outline" onClick={beginPreparation}>
              <Timer1 aria-hidden />
              Начать 1 минуту подготовки
            </Button>
          ) : null}
          {phase === 'preparing' ? (
            <p className="flex items-center gap-2 text-sm text-[#69696d]">
              Подготовьте идеи: запись начнётся только после нажатия «Начать
              ответ».
            </p>
          ) : null}
          {(phase === 'ready' || phase === 'finished') &&
          (part.type !== 'part2' || prepared || hasRecording) ? (
            <Button type="button" onClick={() => void beginRecording()}>
              <Microphone2 aria-hidden />
              {hasRecording ? 'Записать заново' : 'Начать запись'}
            </Button>
          ) : null}
          {phase === 'recording' ? (
            <Button
              type="button"
              variant="destructive"
              onClick={stopRef.current}
            >
              <StopCircle aria-hidden />
              Остановить и сохранить
            </Button>
          ) : null}
          {phase === 'uploading' || recorder.isUploading ? (
            <p className="text-sm text-[#69696d]">Сохраняем запись…</p>
          ) : null}
          {(phase === 'finished' || hasRecording) && !recorder.isUploading ? (
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <TickCircle className="size-4" aria-hidden />
              Запись сохранена.
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <label
            className="text-sm font-medium"
            htmlFor={`transcript-${part.id}`}
          >
            Черновая расшифровка (необязательно, но полезна без микрофона)
          </label>
          <Textarea
            id={`transcript-${part.id}`}
            value={initialTranscript}
            onChange={(event) => onTranscriptChange(event.target.value)}
            rows={6}
            className="resize-y text-base leading-7"
            placeholder="Можно напечатать ответ вручную или наговорить голосом — аудио расшифруется автоматически."
          />
          <p className="text-xs text-[#808084]">
            Для точной оценки произношения нужен аудиозапись. Текстовый ответ
            оценивается, но произношение будет ориентировочным.
          </p>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t pt-5">
          {onPrevious ? (
            <Button type="button" variant="outline" onClick={onPrevious}>
              Назад
            </Button>
          ) : (
            <span />
          )}
          {onNext ? (
            <Button
              type="button"
              disabled={!responseReady || recorder.isUploading}
              onClick={onNext}
            >
              К следующей части
            </Button>
          ) : (
            <Button
              type="button"
              disabled={
                completedCount < totalParts ||
                recorder.isUploading ||
                isSubmitting
              }
              onClick={onSubmit}
            >
              {isSubmitting ? 'Проверяем работу…' : 'Отправить на проверку'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PartPrompt({ part }: { part: SpeakingPart }) {
  if (part.type === 'part2') {
    return (
      <div className="rounded-xl bg-[#f7f7f5] p-5 text-sm leading-6">
        <p className="font-semibold">{part.title}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {part.cueCard.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      </div>
    )
  }
  return (
    <div className="rounded-xl bg-[#f7f7f5] p-5 text-sm leading-6">
      <ol className="grid gap-3">
        {part.questions.map((question) => (
          <li key={question.id}>
            <span className="mr-2 font-semibold text-[#3b82f6]">
              {question.position}.
            </span>
            {question.prompt}
          </li>
        ))}
      </ol>
    </div>
  )
}

function SpeakingAttemptResult({
  attempt,
  material,
  fullMockSessionId,
}: {
  attempt: Attempt
  material: PublicSpeakingMaterial
  fullMockSessionId?: string
}) {
  const detailQuery = useQuery({
    queryKey: attemptKeys.detail(attempt.id),
    queryFn: ({ signal }) => getAttempt(attempt.id, signal),
  })
  const evaluation = detailQuery.data?.speakingEvaluation
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[920px] gap-5">
      <div>
        <Button asChild variant="link" className="h-auto p-0">
          {fullMockSessionId ? (
            <Link
              to="/exam/full-mock-sessions/$sessionId"
              params={{ sessionId: fullMockSessionId }}
            >
              <ArrowLeft aria-hidden />К Full Mock
            </Link>
          ) : (
            <Link to="/dashboard/speaking">
              <ArrowLeft aria-hidden />К Speaking
            </Link>
          )}
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
        <LoadingState label="Загружаем результаты проверки…" />
      ) : (
        <SpeakingEvaluationView evaluation={evaluation} />
      )}
    </div>
  )
}

function SpeakingEvaluationView({
  evaluation,
}: {
  evaluation: SpeakingEvaluation
}) {
  const criteria = [
    ['Fluency & Coherence', evaluation.criteria.fluency],
    ['Lexical Resource', evaluation.criteria.lexicalResource],
    ['Grammar Range & Accuracy', evaluation.criteria.grammar],
    ['Pronunciation', evaluation.criteria.pronunciation],
  ] as const
  return (
    <>
      <Card className="border-[#dbeafe] bg-[#eff6ff] shadow-none">
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <span className="grid size-14 place-items-center rounded-full bg-[#3b82f6] text-2xl font-semibold text-white">
            {evaluation.overallBand.toFixed(1)}
          </span>
          <div>
            <p className="font-semibold">Ориентировочный IELTS Speaking band</p>
            <p className="mt-1 text-sm leading-6 text-[#4b5563]">
              {evaluation.summary || 'Детальный разбор выполнен.'}
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
      {evaluation.parts.map((part, index) => (
        <Card key={part.partId} className="shadow-none">
          <CardHeader>
            <CardTitle>Part {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6">
            <p>{part.feedback}</p>
            {part.transcript ? (
              <div className="rounded-xl bg-[#f7f7f5] p-4">
                <p className="mb-1 text-xs font-semibold text-[#69696d]">
                  РАСШИФРОВКА
                </p>
                {part.transcript}
              </div>
            ) : null}
            <FeedbackList title="Сильные стороны" items={part.strengths} />
            <FeedbackList title="Что улучшить" items={part.improvements} />
          </CardContent>
        </Card>
      ))}
      <p className="flex items-center gap-2 text-xs text-[#808084]">
        <Book className="size-4" aria-hidden />
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

function useAudioRecorder({
  attemptId,
  partId,
  onUploaded,
  onError,
}: {
  attemptId: string
  partId: string
  onUploaded: () => void
  onError: (message: string) => void
}) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])
  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }, [])
  const start = useCallback(async () => {
    if (typeof MediaRecorder === 'undefined') {
      onError(
        'Браузер не поддерживает запись аудио. Введите расшифровку вручную.',
      )
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const preferredType = MediaRecorder.isTypeSupported(
        'audio/webm;codecs=opus',
      )
        ? 'audio/webm;codecs=opus'
        : undefined
      const mediaRecorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream)
      chunksRef.current = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      mediaRecorder.onstop = () => {
        const mimeType =
          mediaRecorder.mimeType || chunksRef.current[0]?.type || 'audio/webm'
        const extension = mimeType.includes('mp4')
          ? 'm4a'
          : mimeType.includes('ogg')
            ? 'ogg'
            : 'webm'
        const file = new File(
          [new Blob(chunksRef.current, { type: mimeType })],
          `speaking-${partId}.${extension}`,
          { type: mimeType },
        )
        stopTracks()
        if (file.size === 0) {
          onError('Запись получилась пустой. Попробуйте ещё раз.')
          return
        }
        setIsUploading(true)
        void uploadSpeakingRecording(attemptId, partId, file)
          .then(onUploaded)
          .catch((error: unknown) => onError(getErrorMessage(error)))
          .finally(() => setIsUploading(false))
      }
      recorderRef.current = mediaRecorder
      mediaRecorder.start()
      return true
    } catch (error) {
      stopTracks()
      onError(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Доступ к микрофону не разрешён. Разрешите его или введите расшифровку вручную.'
          : 'Не удалось запустить микрофон. Проверьте устройство и попробуйте снова.',
      )
      return false
    }
  }, [attemptId, onError, onUploaded, partId, stopTracks])
  useEffect(
    () => () => {
      stop()
      stopTracks()
    },
    [stop, stopTracks],
  )
  return { start, stop, isUploading }
}

function answerText(answer: Record<string, unknown> | undefined) {
  return typeof answer?.value === 'string' ? answer.value : ''
}

function hasPartResponse(
  id: string,
  answers: Record<string, Record<string, unknown>>,
  recordings: SpeakingRecording[],
) {
  return (
    Boolean(answerText(answers[id]).trim()) ||
    recordings.some((item) => item.partId === id)
  )
}
