import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Book1,
  CloseCircle,
  LampCharge,
  TickCircle,
  Eye,
  TextalignLeft,
  ExportSquare,
  InfoCircle,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  getAttemptMaterial,
  type AttemptReviewItem,
  type StudentAnswer,
} from '@/features/attempts/api'
import type { PublicReadingMaterial } from '@/features/reading/api'
import { formatAnswer } from '@/features/attempts/attempt-ui'
import type { Option } from '@/features/attempts/attempt-ui'

type MistakeRetryDialogProps = {
  item: AttemptReviewItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  testTitle?: string
  attemptId?: string
  materialType?: string
}

export function MistakeRetryDialog({
  item,
  open,
  onOpenChange,
  testTitle,
  attemptId,
  materialType,
}: MistakeRetryDialogProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1440px] w-[97vw] max-h-[94vh] h-[92vh] p-0 overflow-hidden flex flex-col gap-0 border-[#e7e7e4] bg-white rounded-[20px] shadow-2xl">
        <MistakeRetryContent
          key={item.questionId}
          item={item}
          testTitle={testTitle}
          attemptId={attemptId}
          materialType={materialType}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function MistakeRetryContent({
  item,
  testTitle,
  attemptId,
  materialType,
  onClose,
}: {
  item: AttemptReviewItem
  testTitle?: string
  attemptId?: string
  materialType?: string
  onClose: () => void
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [mobileTab, setMobileTab] = useState<'text' | 'question'>('question')

  // Fallback material query if item.passageBody was not embedded
  const materialQuery = useQuery({
    queryKey: ['attempt-material', attemptId],
    queryFn: () => getAttemptMaterial(attemptId!),
    enabled: Boolean(attemptId && !item.passageBody && materialType === 'reading'),
  })

  // Extract passage body
  const passageBody = useMemo(() => {
    if (item.passageBody && item.passageBody.trim().length > 0) {
      return item.passageBody.trim()
    }
    if (materialQuery.data && 'body' in materialQuery.data) {
      const readingMat = materialQuery.data as PublicReadingMaterial
      // Check nested passages
      if (readingMat.passages && readingMat.passages.length > 0) {
        if (item.passageTitle) {
          const match = readingMat.passages.find(
            (p) =>
              p.title?.toLowerCase() === item.passageTitle?.toLowerCase() ||
              item.passageTitle?.toLowerCase().includes(p.title?.toLowerCase() || ''),
          )
          if (match?.body) return match.body
        }
        // Match by question number
        if (item.number <= 13 && readingMat.passages[0]?.body) {
          return readingMat.passages[0].body
        }
        if (item.number > 13 && item.number <= 26 && readingMat.passages[1]?.body) {
          return readingMat.passages[1].body
        }
        if (readingMat.passages[2]?.body) {
          return readingMat.passages[2].body
        }
      }
      return readingMat.body
    }
    return ''
  }, [item.passageBody, item.passageTitle, item.number, materialQuery.data])

  const passageTitle = item.passageTitle || 'Текст для чтения'
  const quote = extractQuote(item)
  const hasPassage = Boolean(passageBody && passageBody.length > 0)

  // Options if provided in content
  const options = (item.content?.options as Option[] | undefined) ?? []

  // Detect question category
  const isYNNG =
    item.type === 'yes_no_not_given' ||
    item.correctAnswer.value === 'YES' ||
    item.correctAnswer.value === 'NO' ||
    (item.correctAnswer.value === 'NOT_GIVEN' && item.prompt.toLowerCase().includes('statement'))
  const isTFNG =
    item.type === 'true_false_not_given' ||
    item.correctAnswer.value === 'TRUE' ||
    item.correctAnswer.value === 'FALSE'

  const isChoice =
    item.type === 'multiple_choice' ||
    typeof item.correctAnswer.optionId === 'string' ||
    options.length > 0

  const choiceOptions: Option[] =
    options.length > 0
      ? options
      : isChoice && typeof item.correctAnswer.optionId === 'string'
        ? [
            { id: 'A', text: 'Option A' },
            { id: 'B', text: 'Option B' },
            { id: 'C', text: 'Option C' },
            { id: 'D', text: 'Option D' },
          ]
        : []

  const handleCheck = () => {
    if (!selectedAnswer.trim()) return
    const correct = evaluateAnswer(selectedAnswer, item.correctAnswer)
    setIsCorrect(correct)
    setAttemptCount((prev) => prev + 1)
    if (!correct) {
      setShowHint(true)
    }
  }

  // Ref to passage scroll container
  const passageContainerRef = useRef<HTMLDivElement | null>(null)
  const quoteMarkerRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if ((showHint || isCorrect === false) && quoteMarkerRef.current) {
      quoteMarkerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [showHint, isCorrect])

  const scrollToQuote = () => {
    setShowHint(true)
    if (quoteMarkerRef.current) {
      quoteMarkerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Top Header */}
      <DialogHeader className="px-5 sm:px-6 py-3.5 border-b border-[#e7e7e4] bg-white flex flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge
            variant="outline"
            className="text-xs font-bold text-[#2563eb] border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-0.5"
          >
            Вопрос {item.number}
          </Badge>
          {item.passageTitle ? (
            <Badge
              variant="secondary"
              className="text-xs font-medium text-slate-700 bg-slate-100 max-w-[260px] truncate"
            >
              📖 {item.passageTitle}
            </Badge>
          ) : null}
          {testTitle ? (
            <span className="text-xs text-slate-500 font-medium truncate max-w-[280px] hidden sm:inline">
              {testTitle}
            </span>
          ) : null}
        </div>

        <div className="flex items-center">
          {attemptId ? (
            <a
              href={`/app/attempts/${attemptId}/review`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d4ed8] bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] px-3.5 py-1.5 rounded-full transition-all shadow-2xs hover:shadow-xs mr-9"
            >
              <ExportSquare className="size-3.5 text-[#2563eb]" />
              <span>Полный разбор теста</span>
            </a>
          ) : null}
        </div>
      </DialogHeader>

      {/* Mobile Tab Switcher (< md) */}
      {hasPassage && (
        <div className="md:hidden flex border-b border-[#e7e7e4] bg-[#fafaf9] px-4 py-2 shrink-0">
          <div className="grid grid-cols-2 w-full gap-1 bg-slate-200/70 p-1 rounded-[10px]">
            <button
              type="button"
              onClick={() => setMobileTab('text')}
              className={cn(
                'py-1.5 text-xs font-semibold rounded-[8px] transition-all flex items-center justify-center gap-1.5',
                mobileTab === 'text'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <Book1 className="size-3.5" />
              Текст пассажа
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('question')}
              className={cn(
                'py-1.5 text-xs font-semibold rounded-[8px] transition-all flex items-center justify-center gap-1.5',
                mobileTab === 'question'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <TextalignLeft className="size-3.5" />
              Вопрос и решение
            </button>
          </div>
        </div>
      )}

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Passage Text Viewer */}
        {hasPassage && (
          <div
            className={cn(
              'w-full md:w-[55%] border-r border-[#e7e7e4] bg-[#fafaf9] flex flex-col min-h-0',
              mobileTab === 'question' && 'hidden md:flex',
            )}
          >
            {/* Passage Subheader */}
            <div className="px-5 py-2.5 border-b border-[#ededeb] bg-[#f5f5f4] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Book1 className="size-4 text-[#2563eb]" />
                <span className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                  {passageTitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {quote ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={scrollToQuote}
                    className="h-7 text-[11px] font-semibold text-[#2563eb] hover:bg-blue-50 px-2 gap-1 rounded-md"
                  >
                    <Eye className="size-3 text-[#2563eb]" />
                    <span>К ответу в тексте</span>
                  </Button>
                ) : null}

                <div className="flex items-center rounded-md border border-[#e5e5e5] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setFontSize('sm')}
                    className={cn(
                      'px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors',
                      fontSize === 'sm' ? 'bg-[#2563eb] text-white' : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize('md')}
                    className={cn(
                      'px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors',
                      fontSize === 'md' ? 'bg-[#2563eb] text-white' : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize('lg')}
                    className={cn(
                      'px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors',
                      fontSize === 'lg' ? 'bg-[#2563eb] text-white' : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Passage Body */}
            <div
              ref={passageContainerRef}
              className="p-5 sm:p-6 overflow-y-auto flex-1 select-text"
            >
              <PassageBodyRender
                body={passageBody}
                quote={quote}
                highlight={showHint || isCorrect === false || revealed}
                fontSize={fontSize}
                quoteMarkerRef={quoteMarkerRef}
              />
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Question, Retry & Feedback */}
        <div
          className={cn(
            'flex-1 bg-white p-5 sm:p-6 overflow-y-auto flex flex-col space-y-4 min-h-0',
            hasPassage && mobileTab === 'text' && 'hidden md:flex',
          )}
        >
          {/* Header Title */}
          <div>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                Работа над ошибкой
              </DialogTitle>
              {hasPassage && (
                <button
                  type="button"
                  onClick={() => setMobileTab('text')}
                  className="md:hidden text-xs text-[#2563eb] font-semibold underline underline-offset-2 flex items-center gap-1"
                >
                  <Book1 className="size-3" />
                  Читать текст
                </button>
              )}
            </div>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Внимательно найдите ответ в тексте. Попробуйте решить без подсказки!
            </DialogDescription>
          </div>

          {/* Question Box */}
          <div className="rounded-[14px] border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm font-medium text-slate-900 leading-relaxed shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[#2563eb]">Вопрос {item.number}</span>
              {typeof item.content?.completionRule === 'object' && item.content?.completionRule ? (
                <Badge variant="outline" className="text-[10.5px] font-semibold bg-white text-slate-600 border-slate-200">
                  {`NO MORE THAN ${String((item.content.completionRule as Record<string, unknown>).maxWords ?? 2)} WORDS`}
                </Badge>
              ) : null}
            </div>

            {/* Optional diagram / illustration */}
            {typeof item.content?.imageUrl === 'string' && item.content.imageUrl ? (
              <div className="rounded-lg border border-slate-200 bg-white p-2.5 flex items-center justify-center">
                <img
                  src={item.content.imageUrl as string}
                  alt="Diagram"
                  className="max-h-52 max-w-full object-contain rounded"
                />
              </div>
            ) : null}

            <p className="text-slate-900 leading-relaxed">
              {item.prompt === '{{answer}}' ? (
                <span className="italic text-slate-600">Заполните пропуск: [ _____ ]</span>
              ) : (
                item.prompt.replace('{{answer}}', '_____')
              )}
            </p>
          </div>

          {/* Previous Student Answer Notice */}
          <div className="flex items-center justify-between rounded-[10px] border border-rose-100 bg-rose-50/70 px-3.5 py-2 text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <CloseCircle className="size-4 shrink-0 text-rose-600" />
              <span>
                Ваш прошлый ответ:{' '}
                <strong className="line-through">{formatAnswer(item.answer, options)}</strong>
              </span>
            </div>
            <span className="font-semibold text-rose-700">Неверно (0 б.)</span>
          </div>

          {/* Retry Inputs (Level 1) */}
          {!revealed && !isCorrect && (
            <div className="space-y-3 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Выберите или введите верный ответ:
              </p>

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
                          ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8] shadow-xs ring-1 ring-[#2563eb]'
                          : 'border-[#e7e7e4] bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
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
                          ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8] shadow-xs ring-1 ring-[#2563eb]'
                          : 'border-[#e7e7e4] bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
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
                      onClick={() => setSelectedAnswer(opt.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-[12px] border p-3 text-left text-xs sm:text-sm transition-all',
                        selectedAnswer === opt.id
                          ? 'border-[#2563eb] bg-[#eff6ff] text-slate-900 shadow-xs ring-1 ring-[#2563eb]'
                          : 'border-[#e7e7e4] bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          selectedAnswer === opt.id
                            ? 'bg-[#2563eb] text-white'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {opt.id}
                      </span>
                      <span className="flex-1 font-medium">{opt.text}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Введите правильный ответ..."
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
                <div className="flex items-start gap-2.5 rounded-[12px] border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-950">
                  <LampCharge className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Пока неверно!</p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      Внимательно изучите подсвеченный участок текста и обратите внимание на синонимы в вопросе.
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <Button
                  type="button"
                  onClick={handleCheck}
                  disabled={!selectedAnswer.trim()}
                  className="bg-[#2563eb] hover:bg-blue-600 text-white font-medium px-5 shadow-xs"
                >
                  Проверить ответ
                </Button>

                {!showHint && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={scrollToQuote}
                    className="text-xs text-slate-600 hover:text-slate-900 gap-1.5"
                  >
                    <LampCharge className="size-3.5 text-amber-500" />
                    Нужна подсказка
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Level 2: Scaffolding (Clue & Quote Reference) */}
          {(showHint || isCorrect === false) && !revealed && !isCorrect && (
            <div className="rounded-[16px] border border-amber-200/80 bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-white p-4.5 space-y-3.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-2.5 py-1 text-xs font-semibold text-amber-900 border border-amber-200/70">
                  <LampCharge className="size-3.5 text-amber-600" />
                  <span>Подсказка к поиску</span>
                </div>

                {quote ? (
                  <button
                    type="button"
                    onClick={scrollToQuote}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full shadow-2xs hover:bg-slate-50 transition-all"
                  >
                    <Eye className="size-3 text-[#2563eb]" />
                    <span>Показать в тексте</span>
                  </button>
                ) : null}
              </div>

              {/* Guiding Question / Clue */}
              {item.hint ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/70">
                    На что обратить внимание:
                  </p>
                  <p className="text-[13.5px] leading-relaxed text-slate-800 font-medium">
                    {item.hint}
                  </p>
                </div>
              ) : null}

              {/* Quote from text */}
              {quote ? (
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold uppercase tracking-wider flex items-center gap-1 text-slate-500">
                      <Book1 className="size-3.5 text-slate-400" />
                      Цитата из текста
                    </span>
                    <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 text-[10.5px]">
                      Подсвечена слева
                    </span>
                  </div>
                  <p className="text-[13px] font-serif italic text-slate-700 leading-relaxed pl-2 border-l-2 border-amber-400">
                    «{quote}»
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic">
                  Ответ находится в абзаце, обсуждающем ключевые тезисы вопроса. Сопоставьте утверждение с деталями.
                </p>
              )}

              {/* Surrender / Reveal Action */}
              <div className="pt-1 flex items-center justify-center border-t border-amber-100/80">
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="text-xs text-slate-500 hover:text-rose-600 py-1 px-2.5 transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  <span>Не удается найти ответ?</span>
                  <span className="underline underline-offset-2 font-semibold">Показать решение →</span>
                </button>
              </div>
            </div>
          )}

          {/* Level 3: Revealed Solution & Detailed Explanation */}
          {(revealed || isCorrect) && (
            <div className="rounded-[16px] border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-white p-4.5 space-y-3.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-2.5 py-1 text-xs font-semibold text-emerald-900 border border-emerald-200/70">
                  <TickCircle className="size-3.5 text-emerald-600" />
                  <span>{isCorrect ? 'Верный ответ найден! 🎉' : 'Правильное решение'}</span>
                </div>

                {quote ? (
                  <button
                    type="button"
                    onClick={scrollToQuote}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full shadow-2xs hover:bg-slate-50 transition-all"
                  >
                    <Eye className="size-3 text-[#2563eb]" />
                    <span>Показать в тексте</span>
                  </button>
                ) : null}
              </div>

              {/* Correct Answer Display */}
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900/70">
                  Правильный ответ:
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-emerald-950">
                    {formatAnswer(item.correctAnswer, options)}
                  </span>
                  {isCorrect && (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      {attemptCount > 1 ? `со ${attemptCount}-й попытки` : 'с 1-й попытки'}
                    </span>
                  )}
                </div>
              </div>

              {/* Quote from text (exact same card structure as hint) */}
              {quote ? (
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold uppercase tracking-wider flex items-center gap-1 text-slate-500">
                      <Book1 className="size-3.5 text-slate-400" />
                      Цитата-доказательство из текста
                    </span>
                    <span className="text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[10.5px]">
                      Подсвечена слева
                    </span>
                  </div>
                  <p className="text-[13px] font-serif italic text-slate-700 leading-relaxed pl-2 border-l-2 border-emerald-500">
                    «{quote}»
                  </p>
                </div>
              ) : null}

              {/* Detailed Explanation (same card structure) */}
              {item.explanation ? (
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <InfoCircle className="size-3.5 text-slate-400" />
                    <span>Подробное объяснение:</span>
                  </div>
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-800 font-normal">
                    {item.explanation}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Footer Spacer & Done button */}
          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
            {hasPassage ? (
              <span className="text-[11px] text-slate-400">
                IELTS Reading Scaffolded Review
              </span>
            ) : <span />}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-[10px]"
            >
              {isCorrect || revealed ? 'Готово' : 'Закрыть'}
            </Button>
          </div>
        </div>
      </div>
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
          'space-y-4 font-serif text-slate-800 selection:bg-blue-100',
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
        'whitespace-pre-wrap font-serif text-slate-800 space-y-4 selection:bg-blue-100',
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
            ? 'bg-amber-200/90 text-amber-950 font-semibold shadow-xs ring-2 ring-amber-400 ring-offset-1'
            : 'hover:bg-slate-100',
        )}
      >
        {matchedText}
      </span>
      {after}
    </div>
  )
}

function evaluateAnswer(
  selected: string,
  correctAnswer: StudentAnswer,
): boolean {
  if (!selected.trim()) return false
  const normSelected = selected.trim().toUpperCase()

  // 1. Option ID (Multiple choice, matching)
  if (typeof correctAnswer.optionId === 'string') {
    return normSelected === correctAnswer.optionId.trim().toUpperCase()
  }

  // 2. TFNG / YNNG value
  if (typeof correctAnswer.value === 'string') {
    const normCorrect = correctAnswer.value.trim().toUpperCase()
    if (normSelected === normCorrect) return true
    if (
      (normSelected === 'YES' && normCorrect === 'TRUE') ||
      (normSelected === 'TRUE' && normCorrect === 'YES')
    )
      return true
    if (
      (normSelected === 'NO' && normCorrect === 'FALSE') ||
      (normSelected === 'FALSE' && normCorrect === 'NO')
    )
      return true
    return false
  }

  // 3. Accepted array
  if (Array.isArray(correctAnswer.accepted)) {
    return correctAnswer.accepted.some(
      (acc) => typeof acc === 'string' && acc.trim().toUpperCase() === normSelected,
    )
  }

  // 4. Option IDs array
  if (Array.isArray(correctAnswer.optionIds)) {
    return correctAnswer.optionIds.some(
      (id) => typeof id === 'string' && id.trim().toUpperCase() === normSelected,
    )
  }

  return false
}

function extractQuote(item: AttemptReviewItem): string {
  if (item.quote && item.quote.trim().length > 0) {
    return item.quote.trim()
  }

  // Try extracting from content
  if (item.content && typeof item.content.quote === 'string' && item.content.quote.trim().length > 0) {
    return item.content.quote.trim()
  }
  if (item.content && typeof item.content.textReference === 'string' && item.content.textReference.trim().length > 0) {
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
