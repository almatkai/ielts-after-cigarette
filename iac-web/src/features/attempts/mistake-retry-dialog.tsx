import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Book1,
  CloseCircle,
  CloseSquare,
  LampCharge,
  TickCircle,
  Eye,
  TextalignLeft,
  InfoCircle,
  Play,
  VolumeHigh,
  ArrowRight,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getAttemptMaterial } from '@/features/attempts/api'
import type { AttemptReviewItem, StudentAnswer } from '@/features/attempts/api'
import { getListeningMediaBlob } from '@/features/listening/api'
import { formatAnswer } from '@/features/attempts/attempt-ui'
import { reviewOptions } from './mistake-list'
import { withReviewMaterial } from './review-material'
import { evaluateRetryAnswer } from './retry-answer'
import { getReviewAudioRange } from './review-audio-range'
import { useMistakeReviewStatus } from './use-mistake-review-status'

function formatSeconds(sec?: number): string {
  if (typeof sec !== 'number' || isNaN(sec)) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

type MistakeRetryDialogProps = {
  item: AttemptReviewItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  testTitle?: string
  attemptId?: string
  materialType?: string
  onNext?: () => void
}

export function MistakeRetryDialog({
  item,
  open,
  onOpenChange,
  testTitle,
  attemptId,
  materialType,
  onNext,
}: MistakeRetryDialogProps) {
  if (!item || item.locked || !item.correctAnswer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[1440px] w-[97vw] max-h-[94vh] h-[92vh] p-0 overflow-hidden flex flex-col gap-0 border-border bg-card rounded-[10px] shadow-none"
      >
        <MistakeRetryContent
          key={item.questionId}
          item={{ ...item, correctAnswer: item.correctAnswer }}
          testTitle={testTitle}
          attemptId={attemptId}
          materialType={materialType}
          onNext={onNext}
        />
      </DialogContent>
    </Dialog>
  )
}

function MistakeRetryContent({
  item: initialItem,
  testTitle,
  attemptId,
  materialType,
  onNext,
}: {
  item: AttemptReviewItem & { correctAnswer: StudentAnswer }
  testTitle?: string
  attemptId?: string
  materialType?: string
  onNext?: () => void
}) {
  const { markReviewed } = useMistakeReviewStatus(
    attemptId,
    initialItem.questionId,
  )
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [unblurTranscript, setUnblurTranscript] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [mobileTab, setMobileTab] = useState<'text' | 'question'>('question')
  const [audioDuration, setAudioDuration] = useState<number>()

  const isListening =
    materialType === 'listening' ||
    Boolean(initialItem.audioAssetId) ||
    typeof initialItem.timestampStart === 'number' ||
    Boolean(initialItem.transcript)

  // Fallback material query if item.passageBody was not embedded
  const materialQuery = useQuery({
    queryKey: ['attempts', attemptId, 'material'],
    queryFn: () => getAttemptMaterial(attemptId!),
    enabled: Boolean(attemptId && (!initialItem.passageBody || isListening)),
  })

  const item = useMemo(
    () => ({
      ...withReviewMaterial(initialItem, materialQuery.data),
      correctAnswer: initialItem.correctAnswer,
    }),
    [initialItem, materialQuery.data],
  )

  // For Listening: find corresponding part
  const listeningPart = useMemo(() => {
    if (!materialQuery.data || !('parts' in materialQuery.data)) return null
    const listMat = materialQuery.data
    for (const part of listMat.parts) {
      for (const group of part.groups) {
        if (group.questions.some((q) => q.id === item.questionId)) {
          return part
        }
      }
    }
    return null
  }, [materialQuery.data, item.number, item.questionId])

  const audioAssetId = item.audioAssetId || listeningPart?.audioAssetId || null
  const transcript = (item.transcript || listeningPart?.transcript || '').trim()

  const sourceTimestampStart =
    typeof item.timestampStart === 'number'
      ? item.timestampStart
      : typeof item.content?.timestampStart === 'number'
        ? item.content.timestampStart
        : undefined

  const sourceTimestampEnd =
    typeof item.timestampEnd === 'number'
      ? item.timestampEnd
      : typeof item.content?.timestampEnd === 'number'
        ? item.content.timestampEnd
        : undefined

  const audioRange = getReviewAudioRange(
    sourceTimestampStart,
    sourceTimestampEnd,
    audioDuration,
  )
  const timestampStart = audioRange?.start
  const timestampEnd = audioRange?.end

  // Rewind audio 3-5 passages / dialogue segments back (with pseudo-random offset)
  // so student hears context before the answer and has to identify it
  const hintAudioStart = useMemo(() => {
    if (typeof sourceTimestampStart !== 'number') return undefined

    const segments = listeningPart?.transcriptSegments
    if (segments && segments.length > 0) {
      const idx = segments.findIndex(
        (s) =>
          sourceTimestampStart >= s.start - 0.5 &&
          sourceTimestampStart <= s.end + 0.5,
      )
      if (idx !== -1) {
        const offsetCount = 3 + (item.number % 3) // 3, 4, or 5 segments back
        const targetIdx = Math.max(0, idx - offsetCount)
        return Math.max(0, segments[targetIdx].start)
      }
    }

    const offsetSec = 16 + (item.number % 7) // 16 to 22 seconds back
    return Math.max(0, Math.floor(sourceTimestampStart - offsetSec))
  }, [
    item.questionId,
    item.number,
    sourceTimestampStart,
    listeningPart?.transcriptSegments,
  ])

  const audioQuery = useQuery({
    queryKey: ['listening', 'media', audioAssetId],
    queryFn: () => getListeningMediaBlob(audioAssetId!),
    enabled: Boolean(audioAssetId),
  })

  const audioUrl = useMemo(
    () => (audioQuery.data ? URL.createObjectURL(audioQuery.data) : null),
    [audioQuery.data],
  )

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    },
    [audioUrl],
  )

  const imageAssetId =
    typeof item.content?.imageAssetId === 'string'
      ? item.content.imageAssetId
      : null
  const imageQuery = useQuery({
    queryKey: ['listening', 'media', imageAssetId],
    queryFn: () => getListeningMediaBlob(imageAssetId!),
    enabled: Boolean(imageAssetId),
  })
  const imageUrl = useMemo(
    () => (imageQuery.data ? URL.createObjectURL(imageQuery.data) : null),
    [imageQuery.data],
  )
  useEffect(
    () => () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    },
    [imageUrl],
  )

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const snippetEnd = useRef<number | null>(null)
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
    }
  }, [audioUrl])

  const playAudioSnippet = (start?: number) => {
    if (!audioRef.current) return
    if (typeof start === 'number') {
      audioRef.current.currentTime = start
    }
    snippetEnd.current = typeof timestampEnd === 'number' ? timestampEnd : null
    void audioRef.current.play().catch(() => {})
  }

  const passageBody = item.passageBody?.trim() ?? ''

  const passageTitle = item.passageTitle || 'Текст для чтения'
  const quote = extractQuote(item)
  const hasPassage =
    !isListening && Boolean(passageBody && passageBody.length > 0)
  const hasListeningMedia =
    isListening && Boolean(audioAssetId || transcript.length > 0)
  const hasLeftColumn = hasPassage || hasListeningMedia
  const leftColumnTitle = isListening
    ? listeningPart?.title
      ? `Listening: ${listeningPart.title}`
      : 'Аудиозапись и стенограмма'
    : passageTitle

  const options = reviewOptions(item)
  const isYNNG =
    item.type === 'yes_no_not_given' ||
    (!item.type &&
      (item.correctAnswer.value === 'YES' || item.correctAnswer.value === 'NO'))
  const isTFNG =
    item.type === 'true_false_not_given' ||
    (!item.type &&
      !isYNNG &&
      ['TRUE', 'FALSE', 'NOT_GIVEN'].includes(String(item.correctAnswer.value)))
  const isMultipleChoice = Array.isArray(item.correctAnswer.optionIds)
  const isChoice =
    typeof item.correctAnswer.optionId === 'string' || isMultipleChoice
  const choiceOptions = options

  const handleCheck = () => {
    if (isChoice && !options.length) return
    if (!selectedAnswer.trim() && !selectedOptions.length) return
    const given: StudentAnswer = isMultipleChoice
      ? { optionIds: selectedOptions }
      : typeof item.correctAnswer.optionId === 'string'
        ? { optionId: selectedAnswer }
        : { value: selectedAnswer }
    const correct = evaluateRetryAnswer(given, item.correctAnswer)
    if (correct) markReviewed()
    setIsCorrect(correct)
    setAttemptCount((prev) => prev + 1)
    if (!correct) setShowHint(true)
  }

  // Ref to passage scroll container
  const passageContainerRef = useRef<HTMLDivElement | null>(null)
  const quoteMarkerRef = useRef<HTMLSpanElement | null>(null)
  const broadRegionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (revealed || isCorrect) {
      if (quoteMarkerRef.current) {
        quoteMarkerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    } else if (showHint || isCorrect === false) {
      if (isListening && broadRegionRef.current) {
        broadRegionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      } else if (quoteMarkerRef.current) {
        quoteMarkerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }, [showHint, isCorrect, revealed, isListening])

  const scrollToQuote = () => {
    setShowHint(true)
    if (revealed || isCorrect) {
      quoteMarkerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    } else if (isListening && broadRegionRef.current) {
      broadRegionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    } else if (quoteMarkerRef.current) {
      quoteMarkerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-card">
      {/* Top Header */}
      <DialogHeader className="px-5 sm:px-6 py-3.5 border-b border-border bg-card flex flex-row items-center justify-between gap-4 shrink-0">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground font-medium">
          {testTitle}
        </span>
        <DialogClose className="shrink-0 rounded-[8px] p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-hover">
          <CloseSquare className="size-5" aria-hidden />
          <span className="sr-only">Закрыть</span>
        </DialogClose>
      </DialogHeader>

      {/* Mobile Tab Switcher (< md) */}
      {hasLeftColumn && (
        <div className="md:hidden flex border-b border-border bg-background px-4 py-2 shrink-0">
          <div className="grid grid-cols-2 w-full gap-1 bg-muted/70 p-1 rounded-[10px]">
            <button
              type="button"
              onClick={() => setMobileTab('text')}
              className={cn(
                'py-1.5 text-xs font-semibold rounded-[8px] transition-all flex items-center justify-center gap-1.5',
                mobileTab === 'text'
                  ? 'bg-card text-foreground shadow-none'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isListening ? (
                <>
                  <VolumeHigh className="size-3.5" />
                  Аудио и стенограмма
                </>
              ) : (
                <>
                  <Book1 className="size-3.5" />
                  Текст пассажа
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('question')}
              className={cn(
                'py-1.5 text-xs font-semibold rounded-[8px] transition-all flex items-center justify-center gap-1.5',
                mobileTab === 'question'
                  ? 'bg-card text-foreground shadow-none'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <TextalignLeft className="size-3.5" />
              Вопрос и решение
            </button>
          </div>
        </div>
      )}

      {audioQuery.isError && !audioUrl ? (
        <p className="px-5 py-3 text-sm text-muted-foreground">
          Не удалось загрузить аудио
        </p>
      ) : null}
      {/* Audio Player Bar (for Listening) */}
      {isListening && audioUrl && (
        <div className="px-5 py-2.5 bg-primary-soft/60 border-b border-border flex flex-col gap-1.5 shrink-0">
          <audio
            ref={audioRef}
            aria-label="Аудио"
            className="w-full h-8"
            controls
            preload="metadata"
            src={audioUrl}
            onLoadedMetadata={(event) => {
              setAudioDuration(event.currentTarget.duration)
            }}
            onSeeked={() => {
              if (
                snippetEnd.current !== null &&
                audioRef.current &&
                audioRef.current.currentTime >= snippetEnd.current
              ) {
                audioRef.current.pause()
                snippetEnd.current = null
              }
            }}
            onTimeUpdate={() => {
              if (
                snippetEnd.current !== null &&
                audioRef.current &&
                audioRef.current.currentTime >= snippetEnd.current
              ) {
                audioRef.current.pause()
                snippetEnd.current = null
              }
            }}
          />
        </div>
      )}

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Passage or Listening Transcript Viewer */}
        {hasLeftColumn && (
          <div
            className={cn(
              'w-full md:w-[55%] border-r border-border bg-background flex flex-col min-h-0',
              mobileTab === 'question' && 'hidden md:flex',
            )}
          >
            {/* Left Column Subheader */}
            <div className="px-5 py-2.5 border-b border-border bg-muted flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {isListening ? (
                  <VolumeHigh className="size-4 text-primary-hover" />
                ) : (
                  <Book1 className="size-4 text-primary-hover" />
                )}
                <span className="text-xs font-bold text-foreground truncate max-w-[240px]">
                  {leftColumnTitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isListening &&
                !revealed &&
                !isCorrect &&
                typeof timestampStart === 'number' &&
                audioUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      scrollToQuote()
                      playAudioSnippet(hintAudioStart ?? timestampStart)
                    }}
                    className="h-7 text-[11px] font-semibold text-primary-hover hover:bg-primary-soft px-2 gap-1 rounded-md"
                  >
                    <Play className="size-3 text-primary-hover" />
                    <span>
                      {showHint || isCorrect === false
                        ? `Фрагмент [${formatSeconds(hintAudioStart ?? timestampStart)} - ${formatSeconds(timestampEnd)}]`
                        : `Слушать аудио`}
                    </span>
                  </Button>
                ) : isListening && (revealed || isCorrect) && audioRange ? (
                  <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {formatSeconds(timestampStart)} –{' '}
                    {formatSeconds(timestampEnd)}
                  </span>
                ) : !isListening && quote ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={scrollToQuote}
                    className="h-7 text-[11px] font-semibold text-primary-hover hover:bg-primary-soft px-2 gap-1 rounded-md"
                  >
                    <Eye className="size-3 text-primary-hover" />
                    <span>К ответу в тексте</span>
                  </Button>
                ) : null}

                <div className="flex items-center rounded-md border border-border bg-card p-0.5">
                  <button
                    type="button"
                    onClick={() => setFontSize('sm')}
                    className={cn(
                      'px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors',
                      fontSize === 'sm'
                        ? 'bg-primary-hover text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize('md')}
                    className={cn(
                      'px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors',
                      fontSize === 'md'
                        ? 'bg-primary-hover text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize('lg')}
                    className={cn(
                      'px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors',
                      fontSize === 'lg'
                        ? 'bg-primary-hover text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Passage / Transcript Body */}
            <div
              ref={passageContainerRef}
              className="p-5 sm:p-6 overflow-y-auto flex-1 select-text"
            >
              {isListening ? (
                transcript.length > 0 ? (
                  <ListeningTranscriptRender
                    body={transcript}
                    quote={quote}
                    isHint={showHint || isCorrect === false}
                    isRevealed={revealed || isCorrect === true}
                    unblurTranscript={unblurTranscript}
                    onUnblur={() => setUnblurTranscript(true)}
                    onReblur={() => setUnblurTranscript(false)}
                    fontSize={fontSize}
                    quoteMarkerRef={quoteMarkerRef}
                    broadRegionRef={broadRegionRef}
                    hintAudioStart={hintAudioStart}
                    timestampEnd={timestampEnd}
                    onPlayHintAudio={playAudioSnippet}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                    <VolumeHigh className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {audioUrl
                        ? 'Аудиозапись'
                        : audioQuery.isPending && audioAssetId
                          ? 'Загрузка аудио…'
                          : 'Нет стенограммы'}
                    </p>
                  </div>
                )
              ) : (
                <PassageBodyRender
                  body={passageBody}
                  quote={quote}
                  highlight={showHint || isCorrect === false || revealed}
                  fontSize={fontSize}
                  quoteMarkerRef={quoteMarkerRef}
                />
              )}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Question, Retry & Feedback */}
        <div
          className={cn(
            'flex-1 min-w-0 min-h-0 bg-card flex flex-col overflow-hidden',
            hasLeftColumn && mobileTab === 'text' && 'hidden md:flex',
          )}
        >
          <div
            role="region"
            aria-label="Разбор ошибки"
            className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 space-y-4"
          >
            {/* Header Title */}
            <div>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                  Работа над ошибкой
                </DialogTitle>
                {hasPassage && (
                  <button
                    type="button"
                    onClick={() => setMobileTab('text')}
                    className="md:hidden text-xs text-primary-hover font-semibold underline underline-offset-2 flex items-center gap-1"
                  >
                    <Book1 className="size-3" />
                    Читать текст
                  </button>
                )}
              </div>
              <DialogDescription className="sr-only">
                Вопрос {item.number}
              </DialogDescription>
            </div>

            {/* Question Box */}
            <div className="rounded-[10px] border border-border bg-background p-4 text-sm font-medium text-foreground leading-relaxed shadow-none space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-primary-hover">
                  Вопрос {item.number}
                </span>
                {typeof item.content?.completionRule === 'object' &&
                item.content.completionRule ? (
                  <Badge
                    variant="outline"
                    className="text-[10.5px] font-semibold bg-card text-muted-foreground border-border"
                  >
                    {`NO MORE THAN ${String((item.content.completionRule as Record<string, unknown>).maxWords ?? 2)} WORDS`}
                  </Badge>
                ) : null}
              </div>

              {typeof item.content?.instructions === 'string' &&
              item.content.instructions ? (
                <p className="text-sm font-normal text-muted-foreground">
                  {item.content.instructions}
                </p>
              ) : null}
              {/* Optional diagram / illustration */}
              {imageUrl ||
              (typeof item.content?.imageUrl === 'string' &&
                item.content.imageUrl) ? (
                <div className="rounded-lg border border-border bg-card p-2.5 flex items-center justify-center">
                  <img
                    src={imageUrl ?? String(item.content?.imageUrl)}
                    alt="Diagram"
                    className="max-h-52 max-w-full object-contain rounded"
                  />
                </div>
              ) : null}

              <p className="text-foreground leading-relaxed">
                {item.prompt === '{{answer}}' ? (
                  <span className="italic text-muted-foreground">
                    Заполните пропуск: [ _____ ]
                  </span>
                ) : (
                  item.prompt.replace('{{answer}}', '_____')
                )}
              </p>
            </div>

            {/* Previous Student Answer Notice */}
            <div className="flex items-center justify-between rounded-[10px] border border-destructive-soft bg-destructive-soft/70 px-3.5 py-2 text-xs text-destructive">
              <div className="flex items-center gap-2">
                <CloseCircle className="size-4 shrink-0 text-destructive" />
                <span>
                  Ваш ответ:{' '}
                  <strong className="line-through">
                    {formatAnswer(item.answer, options)}
                  </strong>
                </span>
              </div>
              <span className="font-semibold text-destructive">Ошибка</span>
            </div>

            {/* Retry Inputs (Level 1) */}
            {!revealed && !isCorrect && (
              <div className="space-y-3 pt-1">
                {isYNNG ? (
                  <div className="grid grid-cols-3 gap-2">
                    {(['YES', 'NO', 'NOT_GIVEN'] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedAnswer(val)}
                        className={cn(
                          'flex h-11 items-center justify-center rounded-[10px] border text-xs font-bold transition-all select-none',
                          selectedAnswer === val
                            ? 'border-primary-hover bg-primary-soft text-primary shadow-none ring-1 ring-primary-hover'
                            : 'border-border bg-card text-foreground hover:border-border-strong hover:bg-card',
                        )}
                      >
                        {val.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                ) : isTFNG ? (
                  <div className="grid grid-cols-3 gap-2">
                    {(['TRUE', 'FALSE', 'NOT_GIVEN'] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedAnswer(val)}
                        className={cn(
                          'flex h-11 items-center justify-center rounded-[10px] border text-xs font-bold transition-all select-none',
                          selectedAnswer === val
                            ? 'border-primary-hover bg-primary-soft text-primary shadow-none ring-1 ring-primary-hover'
                            : 'border-border bg-card text-foreground hover:border-border-strong hover:bg-card',
                        )}
                      >
                        {val.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                ) : choiceOptions.length > 0 ? (
                  <div className="grid gap-2">
                    {choiceOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          isMultipleChoice
                            ? setSelectedOptions((current) =>
                                current.includes(opt.id)
                                  ? current.filter((id) => id !== opt.id)
                                  : [...current, opt.id],
                              )
                            : setSelectedAnswer(opt.id)
                        }
                        aria-pressed={
                          isMultipleChoice
                            ? selectedOptions.includes(opt.id)
                            : selectedAnswer === opt.id
                        }
                        className={cn(
                          'flex items-center gap-3 rounded-[10px] border p-3 text-left text-xs sm:text-sm transition-all',
                          (
                            isMultipleChoice
                              ? selectedOptions.includes(opt.id)
                              : selectedAnswer === opt.id
                          )
                            ? 'border-primary-hover bg-primary-soft text-foreground shadow-none ring-1 ring-primary-hover'
                            : 'border-border bg-card text-foreground hover:border-border-strong hover:bg-card',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            (
                              isMultipleChoice
                                ? selectedOptions.includes(opt.id)
                                : selectedAnswer === opt.id
                            )
                              ? 'bg-primary-hover text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {opt.id}
                        </span>
                        <span className="flex-1 font-medium">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                ) : isChoice ? (
                  <p className="text-sm text-muted-foreground">
                    Нет вариантов ответа
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ответ"
                      aria-label="Ответ"
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCheck()
                      }}
                      className="h-11 rounded-[10px]"
                    />
                  </div>
                )}

                {/* Feedback on incorrect try */}
                {isCorrect === false && (
                  <div className="flex items-start gap-2.5 rounded-[10px] border border-warning-bg bg-warning-bg/90 p-3.5 text-xs text-warning-fg">
                    <LampCharge className="size-4 shrink-0 text-warning-fg mt-0.5" />
                    <div>
                      <p className="font-semibold text-warning-fg">Неверно</p>
                      <p className="mt-0.5 text-warning-fg leading-relaxed">
                        Попробуйте ещё раз.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <Button
                    type="button"
                    onClick={handleCheck}
                    disabled={
                      (!selectedAnswer.trim() && !selectedOptions.length) ||
                      (isChoice && !options.length)
                    }
                    className="bg-primary-hover hover:bg-primary text-primary-foreground font-medium px-5 shadow-none"
                  >
                    Проверить
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRevealed(true)
                      setUnblurTranscript(true)
                    }}
                  >
                    Показать решение
                  </Button>
                  {!showHint && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={scrollToQuote}
                      className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <LampCharge className="size-3.5 text-warning-fg" />
                      Подсказка
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Level 2: Scaffolding (Clue & Quote Reference) */}
            {(showHint || isCorrect === false) && !revealed && !isCorrect && (
              <div className="rounded-[10px] border border-warning-bg/80 bg-warning-bg p-4.5 space-y-3.5 shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-warning-bg/90 px-2.5 py-1 text-xs font-semibold text-warning-fg border border-warning-bg/70">
                    <LampCharge className="size-3.5 text-warning-fg" />
                    <span>
                      {isListening ? 'Подсказка' : 'Подсказка к поиску'}
                    </span>
                  </div>

                  {isListening &&
                  typeof timestampStart === 'number' &&
                  audioUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        scrollToQuote()
                        playAudioSnippet(hintAudioStart ?? timestampStart)
                      }}
                      className="h-8 shrink-0 gap-1.5 whitespace-nowrap rounded-[8px] border-warning-bg bg-card text-xs font-semibold text-warning-fg shadow-none hover:bg-warning-bg"
                    >
                      <Play className="size-3 text-warning-fg" />
                      Слушать фрагмент
                    </Button>
                  ) : quote ? (
                    <button
                      type="button"
                      onClick={scrollToQuote}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-card border border-border/80 px-2.5 py-1 rounded-sm shadow-none hover:bg-card transition-all"
                    >
                      <Eye className="size-3 text-primary-hover" />
                      <span>Показать в тексте</span>
                    </button>
                  ) : null}
                </div>

                {/* Guiding Question / Clue */}
                {item.hint ? (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold normal-case text-warning-fg">
                      На что обратить внимание:
                    </p>
                    <p className="text-[13.5px] leading-relaxed text-foreground font-medium">
                      {item.hint}
                    </p>
                  </div>
                ) : null}

                {/* Reading quote */}
                {isListening ? null : quote ? (
                  <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-none space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold normal-case flex items-center gap-1 text-muted-foreground">
                        <Book1 className="size-3.5 text-muted-foreground" />
                        Цитата из текста
                      </span>
                      <span className="text-warning-fg font-medium bg-warning-bg px-2 py-0.5 rounded-md border border-warning-bg/60 text-[10.5px]">
                        Подсвечена слева
                      </span>
                    </div>
                    <p className="text-[13px] font-sans text-foreground leading-relaxed pl-2 bg-muted rounded-md px-4 py-3 border-warning-fg">
                      «{quote}»
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Подсказки нет.
                  </p>
                )}

                {/* Surrender / Reveal Action */}
                <div className="pt-1 flex items-center justify-center border-t border-warning-bg/80">
                  <button
                    type="button"
                    onClick={() => {
                      setRevealed(true)
                      setUnblurTranscript(true)
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive py-1 px-2.5 transition-colors inline-flex items-center gap-1.5 font-medium"
                  >
                    <span></span>
                    <span className="underline underline-offset-2 font-semibold">
                      Показать решение
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Level 3: Revealed Solution & Detailed Explanation */}
            {(revealed || isCorrect) && (
              <div className="rounded-[10px] border border-success-bg/80 bg-success-bg p-4.5 space-y-3.5 shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm bg-success-bg/90 px-2.5 py-1 text-xs font-semibold text-success border border-success-bg/70">
                    <TickCircle className="size-3.5 text-success" />
                    <span>{isCorrect ? 'Верно' : 'Решение'}</span>
                  </div>

                  {isListening &&
                  typeof timestampStart === 'number' &&
                  audioUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        scrollToQuote()
                        playAudioSnippet(timestampStart)
                      }}
                      className="h-8 shrink-0 gap-1.5 whitespace-nowrap rounded-[8px] border-success-bg bg-card text-xs font-semibold text-success shadow-none hover:bg-success-bg"
                    >
                      <Play className="size-3 text-success" />
                      Слушать ответ
                    </Button>
                  ) : !isListening && quote ? (
                    <button
                      type="button"
                      onClick={scrollToQuote}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-card border border-border/80 px-2.5 py-1 rounded-sm shadow-none hover:bg-card transition-all"
                    >
                      <Eye className="size-3 text-primary-hover" />
                      <span>Показать в тексте</span>
                    </button>
                  ) : null}
                </div>

                {/* Correct Answer Display */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold normal-case text-success">
                    Правильный ответ:
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-success">
                      {formatAnswer(item.correctAnswer, options)}
                    </span>
                    {isCorrect && (
                      <span className="text-xs font-medium text-success bg-success-bg/80 px-2 py-0.5 rounded-sm">
                        {attemptCount > 1
                          ? `со ${attemptCount}-й попытки`
                          : 'с 1-й попытки'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quote from text / audio */}
                {quote ? (
                  <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-none space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span className="font-semibold normal-case flex items-center gap-1 text-muted-foreground">
                        {isListening ? (
                          <VolumeHigh className="size-3.5 text-muted-foreground" />
                        ) : (
                          <Book1 className="size-3.5 text-muted-foreground" />
                        )}
                        Цитата
                      </span>
                      {!isListening ? (
                        <span className="text-success font-medium bg-success-bg px-2 py-0.5 rounded-md border border-success-bg/60 text-[10.5px]">
                          Подсвечена слева
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[13px] font-sans text-foreground leading-relaxed pl-2 bg-muted rounded-md px-4 py-3 border-success">
                      «{quote}»
                    </p>
                  </div>
                ) : null}

                {/* Detailed Explanation */}
                {item.explanation ? (
                  <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-none space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold normal-case text-muted-foreground">
                      <InfoCircle className="size-3.5 text-muted-foreground" />
                      <span>Подробное объяснение:</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground font-normal">
                      {item.explanation}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          {onNext ? (
            <div className="shrink-0 flex justify-end border-t border-border bg-card px-5 py-3 sm:px-6">
              <Button
                type="button"
                size="sm"
                onClick={onNext}
                className="gap-2 whitespace-nowrap rounded-[10px]"
              >
                Следующая ошибка
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function findBroadRegion(body: string, quote?: string) {
  const cleanQuote = quote ? quote.trim().replace(/^["“«]+|["”»]+$/g, '') : ''
  if (!cleanQuote || cleanQuote.length < 5) {
    return { matchIndex: -1, matchLen: 0, broadStart: -1, broadEnd: -1 }
  }
  const lowerBody = body.toLowerCase()
  const lowerQuote = cleanQuote.toLowerCase()
  let matchIndex = lowerBody.indexOf(lowerQuote)
  let matchLen = cleanQuote.length
  if (matchIndex === -1) {
    const sub = lowerQuote.slice(0, 35)
    matchIndex = lowerBody.indexOf(sub)
    if (matchIndex !== -1) matchLen = 35
  }
  if (matchIndex === -1) {
    return { matchIndex: -1, matchLen: 0, broadStart: -1, broadEnd: -1 }
  }

  // Look back 3-4 sentences / ~240 chars
  const targetLookback = 240
  let broadStart = Math.max(0, matchIndex - targetLookback)
  if (broadStart > 0) {
    const candidates: number[] = []
    for (const punct of ['. ', '? ', '! ', '\n']) {
      const idx = body.indexOf(punct, broadStart)
      if (idx !== -1 && idx + punct.length <= matchIndex) {
        candidates.push(idx + punct.length)
      }
    }
    if (candidates.length > 0) {
      broadStart = Math.min(...candidates)
    }
  }

  // Look forward 1-2 sentences / ~180 chars after matchIndex + matchLen
  const targetLookforward = 180
  let broadEnd = Math.min(
    body.length,
    matchIndex + matchLen + targetLookforward,
  )
  if (broadEnd < body.length) {
    const candidates: number[] = []
    for (const punct of ['. ', '? ', '! ', '\n']) {
      const idx = body.indexOf(punct, matchIndex + matchLen + 30)
      if (idx !== -1 && idx <= broadEnd + 80) {
        candidates.push(idx + 1)
      }
    }
    if (candidates.length > 0) {
      broadEnd = Math.min(...candidates)
    }
  }

  return { matchIndex, matchLen, broadStart, broadEnd }
}

function ListeningTranscriptRender({
  body,
  quote,
  isHint,
  isRevealed,
  unblurTranscript,
  onUnblur,
  onReblur,
  fontSize,
  quoteMarkerRef,
  broadRegionRef,
  hintAudioStart,
  timestampEnd,
  onPlayHintAudio,
}: {
  body: string
  quote?: string
  isHint: boolean
  isRevealed: boolean
  unblurTranscript: boolean
  onUnblur: () => void
  onReblur: () => void
  fontSize: 'sm' | 'md' | 'lg'
  quoteMarkerRef: React.RefObject<HTMLSpanElement | null>
  broadRegionRef: React.RefObject<HTMLDivElement | null>
  hintAudioStart?: number
  timestampEnd?: number
  onPlayHintAudio?: (start?: number) => void
}) {
  const { matchIndex, matchLen, broadStart, broadEnd } = useMemo(
    () => findBroadRegion(body, quote),
    [body, quote],
  )

  const paragraphs = useMemo(() => body.split(/\n\n+/), [body])

  // Fallback if quote was not matched in transcript
  if (matchIndex === -1) {
    return (
      <div
        className={cn(
          'space-y-4 font-sans text-foreground transition-all duration-300',
          !isRevealed &&
            !unblurTranscript &&
            'filter blur-[5px] select-none pointer-events-none opacity-50',
          fontSize === 'sm' && 'text-[13.5px] leading-[1.65]',
          fontSize === 'md' && 'text-[15px] leading-[1.8]',
          fontSize === 'lg' && 'text-[17px] leading-[1.9]',
        )}
      >
        {!isRevealed && !unblurTranscript && (
          <div className="mb-4 rounded-xl border border-border-strong/80 bg-primary-soft/90 p-3 flex items-center justify-between text-xs text-primary">
            <span>Стенограмма скрыта</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onUnblur}
              className="h-6 text-[11px] text-primary border-border-strong bg-card"
            >
              Показать
            </Button>
          </div>
        )}
        {paragraphs.map((p, i) => (
          <p key={i} className="leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    )
  }

  const beforeBroad = body.slice(0, broadStart)
  const broadBeforeQuote = body.slice(broadStart, matchIndex)
  const matchedText = body.slice(matchIndex, matchIndex + matchLen)
  const broadAfterQuote = body.slice(matchIndex + matchLen, broadEnd)
  const afterBroad = body.slice(broadEnd)

  // 1. Initial State (Level 1: Retry, before asking for hint)
  if (!isHint && !isRevealed) {
    return (
      <div className="relative">
        <div
          className={cn(
            'whitespace-pre-wrap font-sans text-foreground space-y-4 filter blur-[6px] select-none pointer-events-none opacity-40 transition-all duration-300',
            fontSize === 'sm' && 'text-[13.5px] leading-[1.65]',
            fontSize === 'md' && 'text-[15px] leading-[1.8]',
            fontSize === 'lg' && 'text-[17px] leading-[1.9]',
          )}
        >
          {body}
        </div>
      </div>
    )
  }

  // 2. Hint State (Level 2: show broad area with 3-5 sentences outlined in amber)
  if (isHint && !isRevealed) {
    return (
      <div
        className={cn(
          'whitespace-pre-wrap font-sans text-foreground transition-all duration-300',
          fontSize === 'sm' && 'text-[13.5px] leading-[1.65]',
          fontSize === 'md' && 'text-[15px] leading-[1.8]',
          fontSize === 'lg' && 'text-[17px] leading-[1.9]',
        )}
      >
        {/* Before broad region - blurred and dimmed */}
        <div className="filter blur-[4.5px] select-none pointer-events-none opacity-30 transition-all duration-300">
          {beforeBroad}
        </div>

        {/* Broad region - highlighted container with 3-5 sentences */}
        <div
          ref={broadRegionRef}
          className={cn(
            'my-4 rounded-xl border-2 transition-all duration-300 p-4 relative shadow-none font-sans',
            unblurTranscript
              ? 'border-warning-fg/90 bg-warning-bg/40'
              : 'border-warning-fg bg-warning-bg/60',
          )}
        >
          {/* Header inside broad region card */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-warning-bg/80 select-none">
            <div className="flex items-center gap-1.5 text-xs font-bold text-warning-fg">
              <LampCharge className="size-4 text-warning-fg" />
              <span>Фрагмент с подсказкой (~3–5 реплик)</span>
            </div>

            <div className="flex items-center gap-2">
              {typeof hintAudioStart === 'number' && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onPlayHintAudio?.(hintAudioStart)}
                  className="h-7 text-xs font-semibold text-warning-fg hover:bg-warning-bg/90 px-2.5 py-0.5 rounded-sm border border-warning-fg/90 bg-card shadow-none gap-1"
                >
                  <Play className="size-3 text-warning-fg" />
                  <span>
                    Слушать [
                    {typeof timestampEnd === 'number'
                      ? `${formatSeconds(hintAudioStart)} - ${formatSeconds(timestampEnd)}`
                      : formatSeconds(hintAudioStart)}
                    ]
                  </span>
                </Button>
              )}

              {!unblurTranscript ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onUnblur}
                  className="h-7 text-[11px] font-semibold text-warning-fg bg-warning-bg hover:bg-warning-bg/90 border-warning-fg gap-1 rounded-full shadow-none"
                >
                  <Eye className="size-3 text-warning-fg" />
                  <span>Показать текст фрагмента</span>
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-success bg-success-bg/90 px-2.5 py-0.5 rounded-sm border border-success-bg">
                    ✓ Текст открыт
                  </span>
                  <button
                    type="button"
                    onClick={onReblur}
                    className="text-[11px] text-warning-fg hover:text-warning-fg underline px-1"
                  >
                    Скрыть
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Broad region content */}
          <div
            className={cn(
              'font-sans leading-relaxed transition-all duration-300',
              !unblurTranscript &&
                'filter blur-[4.5px] select-none pointer-events-none opacity-60',
              fontSize === 'sm' && 'text-[13.5px] leading-[1.65]',
              fontSize === 'md' && 'text-[15px] leading-[1.8]',
              fontSize === 'lg' && 'text-[17px] leading-[1.9]',
            )}
          >
            <span>{broadBeforeQuote}</span>
            {/* Note: In hint mode, quote is not specifically marked with bright color,
                allowing user to read and find the answer */}
            <span>{matchedText}</span>
            <span>{broadAfterQuote}</span>
          </div>
        </div>

        {/* After broad region - blurred and dimmed */}
        <div className="filter blur-[4.5px] select-none pointer-events-none opacity-30 transition-all duration-300">
          {afterBroad}
        </div>
      </div>
    )
  }

  // 3. Solution State (Level 3: Full unblurred transcript with exact quote highlighted)
  return (
    <div
      className={cn(
        'whitespace-pre-wrap font-sans text-foreground transition-all duration-300 select-text',
        fontSize === 'sm' && 'text-[13.5px] leading-[1.65]',
        fontSize === 'md' && 'text-[15px] leading-[1.8]',
        fontSize === 'lg' && 'text-[17px] leading-[1.9]',
      )}
    >
      <div>{beforeBroad}</div>

      <div
        ref={broadRegionRef}
        className="my-3 rounded-xl border-2 border-success/80 bg-success-bg/20 p-4 shadow-none font-sans"
      >
        <span>{broadBeforeQuote}</span>
        <span
          ref={quoteMarkerRef}
          className="transition-all duration-300 rounded px-1.5 py-0.5 bg-success-bg text-success font-bold shadow-none ring-2 ring-success ring-offset-1 ring-offset-card"
        >
          {matchedText}
        </span>
        <span>{broadAfterQuote}</span>
      </div>

      <div>{afterBroad}</div>
    </div>
  )
}

function PassageBodyRender({
  body,
  quote,
  highlight,
  fontSize,
  quoteMarkerRef,
}: {
  body: string
  quote?: string
  highlight: boolean
  fontSize: 'sm' | 'md' | 'lg'
  quoteMarkerRef: React.RefObject<HTMLSpanElement | null>
}) {
  const cleanQuote = quote ? quote.trim().replace(/^["“«]+|["”»]+$/g, '') : ''
  const hasQuote = Boolean(cleanQuote && cleanQuote.length >= 6)

  let matchIndex = -1
  let matchLen = 0

  if (hasQuote) {
    const lowerBody = body.toLowerCase()
    const lowerQuote = cleanQuote.toLowerCase()
    matchIndex = lowerBody.indexOf(lowerQuote)
    if (matchIndex !== -1) {
      matchLen = cleanQuote.length
    } else {
      // Try first 35 chars
      const sub = lowerQuote.slice(0, 35)
      matchIndex = lowerBody.indexOf(sub)
      if (matchIndex !== -1) {
        matchLen = 35
      }
    }
  }

  const paragraphs = body.split(/\n\n+/)

  if (!hasQuote || matchIndex === -1) {
    return (
      <div
        className={cn(
          'space-y-4 font-sans text-foreground selection:bg-primary-soft',
          fontSize === 'sm' && 'text-[13.5px] leading-[1.65]',
          fontSize === 'md' && 'text-[15px] leading-[1.8]',
          fontSize === 'lg' && 'text-[17px] leading-[1.9]',
        )}
      >
        {paragraphs.map((p, i) => (
          <p key={i} className="leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    )
  }

  const before = body.slice(0, matchIndex)
  const matchedText = body.slice(matchIndex, matchIndex + matchLen)
  const after = body.slice(matchIndex + matchLen)

  return (
    <div
      className={cn(
        'whitespace-pre-wrap font-sans text-foreground space-y-4 selection:bg-primary-soft',
        fontSize === 'sm' && 'text-[13.5px] leading-[1.65]',
        fontSize === 'md' && 'text-[15px] leading-[1.8]',
        fontSize === 'lg' && 'text-[17px] leading-[1.9]',
      )}
    >
      {before}
      <span
        ref={quoteMarkerRef}
        className={cn(
          'transition-all duration-300 rounded px-1',
          highlight
            ? 'bg-warning-bg/90 text-warning-fg font-semibold shadow-none ring-2 ring-warning-fg ring-offset-1 ring-offset-card'
            : 'hover:bg-muted',
        )}
      >
        {matchedText}
      </span>
      {after}
    </div>
  )
}

function extractQuote(item: AttemptReviewItem): string {
  if (item.quote && item.quote.trim().length > 0) {
    return item.quote.trim()
  }

  // Try extracting from content
  if (
    item.content &&
    typeof item.content.quote === 'string' &&
    item.content.quote.trim().length > 0
  ) {
    return item.content.quote.trim()
  }
  if (
    item.content &&
    typeof item.content.textReference === 'string' &&
    item.content.textReference.trim().length > 0
  ) {
    return item.content.textReference.trim()
  }

  // Try extracting quoted text from explanation (e.g. "...text...")
  if (item.explanation) {
    const match = item.explanation.match(/["“«]([^"”»]{10,250})["”»]/)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return ''
}
