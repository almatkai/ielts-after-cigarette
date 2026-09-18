import {
  ArrowLeft,
  Book1,
  CloseCircle,
  Eye,
  EyeSlash,
  TickCircle,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAttemptSession } from '@/features/attempts/attempt-session'
import { ExamAttemptShell } from '@/features/attempts/attempt-controller'
import {
  AttemptPerformanceReport,
  AttemptResultHeader,
  EnhancedReviewQuestion,
  ExamLoadingScreen,
  SaveIndicator,
  TimeBadge,
  isQuestionAnswered,
  multiSelectLimit,
} from '@/features/attempts/attempt-ui'
import type { Option } from '@/features/attempts/attempt-ui'
import {
  attemptKeys,
  getAttempt,
  startReadingAttempt,
} from '@/features/attempts/api'
import type { Attempt, StudentAnswer } from '@/features/attempts/api'
import type {
  PublicReadingGroup,
  PublicReadingMaterial,
  PublicReadingQuestion,
} from '@/features/reading/api'
import { getErrorMessage } from '@/lib/api/client'

const tfngValues = ['TRUE', 'FALSE', 'NOT_GIVEN'] as const
const ynngValues = ['YES', 'NO', 'NOT_GIVEN'] as const

export function ReadingStudentPage({
  materialId,
  fullMockSessionId,
}: {
  materialId: string
  fullMockSessionId?: string
}) {
  return (
    <ExamAttemptShell<PublicReadingMaterial>
      skillBadge="IELTS Reading"
      loadingLabel="Готовим материал…"
      loadingDescription="Загружаем текст задания, формируем группы вопросов и настраиваем форму для ответов."
      queryKey={['reading', 'materials', materialId, 'attempt']}
      startAttemptFn={(signal) => startReadingAttempt(materialId, signal)}
      renderRunner={({ attempt, material, onSubmitted }) => (
        <ReadingAttemptRunner
          key={attempt.id}
          attempt={attempt}
          material={material}
          fullMockSessionId={fullMockSessionId}
          onSubmitted={onSubmitted}
        />
      )}
      renderResult={({ attempt, material, onRetake, isRetaking }) => (
        <ReadingAttemptResult
          attempt={attempt}
          material={material}
          fullMockSessionId={fullMockSessionId}
          onRetake={onRetake}
          isRetaking={isRetaking}
        />
      )}
    />
  )
}

function resolvePassages(material: PublicReadingMaterial): PublicReadingMaterial[] {
  if (material.passages && material.passages.length > 1) {
    return material.passages
  }

  // Check if material.body has multiple passage markers
  const regex = /(?:^|\n)(?:READING\s+)?PASSAGE\s+(\d+)\s*(?:[—–-]\s*([^\n]+))?/gi
  const matches: { index: number; number: number; title: string }[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(material.body)) !== null) {
    matches.push({
      index: match.index,
      number: parseInt(match[1], 10),
      title: match[2]?.trim() || `Passage ${match[1]}`,
    })
  }

  if (matches.length > 1) {
    return matches.map((item, i) => {
      const start = item.index
      const end = i < matches.length - 1 ? matches[i + 1].index : material.body.length
      const bodyChunk = material.body.slice(start, end).trim()
      const groups = material.questionGroups.filter((g) => {
        const instr = g.instructions || ''
        const matchP = instr.match(/(?:Passage|Раздел)\s+(\d+)/i)
        if (matchP) return parseInt(matchP[1], 10) === item.number
        const firstNum =
          (g.questions[0]?.content?.number as number | undefined) ??
          g.questions[0]?.position ??
          1
        if (item.number === 1) return firstNum <= 13
        if (item.number === 2) return firstNum > 13 && firstNum <= 26
        return firstNum > 26
      })
      return {
        ...material,
        id: `${material.id}-passage-${item.number}`,
        title: item.title,
        body: bodyChunk,
        questionGroups: groups,
      }
    })
  }

  return material.passages && material.passages.length > 0
    ? material.passages
    : [material]
}

export function ReadingAttemptRunner({
  attempt,
  material,
  fullMockSessionId,
  onSubmitted,
}: {
  attempt: Attempt
  material: PublicReadingMaterial
  fullMockSessionId?: string
  onSubmitted?: (attempt: Attempt) => void
}) {
  const session = useAttemptSession(attempt.id)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [passageFontSize, setPassageFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const autoSubmitStarted = useRef(false)

  const passages = useMemo(() => resolvePassages(material), [material])

  const questions = useMemo(
    () =>
      passages.flatMap((passage, passageIndex) =>
        passage.questionGroups.flatMap((group) =>
          group.questions.map((question) => ({
            passage,
            passageIndex,
            group,
            question,
          })),
        ),
      ),
    [passages],
  )

  const currentQuestion = questions[activeQuestionIndex] ?? questions[0]
  const currentPassage = passages[currentQuestion?.passageIndex ?? 0] ?? passages[0]

  const activePassageQuestions = useMemo(
    () =>
      questions.filter(
        (q) => q.passageIndex === (currentQuestion?.passageIndex ?? 0),
      ),
    [questions, currentQuestion?.passageIndex],
  )

  const goToPassage = (passageIndex: number) => {
    const targetIndex = questions.findIndex((item) => item.passageIndex === passageIndex)
    if (targetIndex >= 0) {
      setActiveQuestionIndex(targetIndex)
    }
  }

  useEffect(() => {
    if (!currentQuestion?.question?.id) return
    const el = document.getElementById(`reading-q-${currentQuestion.question.id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeQuestionIndex, currentQuestion?.question?.id])

  const startedAt = useMemo(
    () => new Date(attempt.startedAt).getTime(),
    [attempt.startedAt],
  )
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
  )
  useEffect(() => {
    if (session.submitted) return
    const interval = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      )
    }, 1000)
    return () => window.clearInterval(interval)
  }, [startedAt, session.submitted])

  const durationSeconds = (material.durationMinutes ?? 0) * 60
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds)
  useEffect(() => {
    if (
      durationSeconds > 0 &&
      remainingSeconds === 0 &&
      !session.submitted &&
      !session.isSubmitting &&
      !autoSubmitStarted.current
    ) {
      autoSubmitStarted.current = true
      void session.submit()
    }
  }, [durationSeconds, remainingSeconds, session.submitted, session.isSubmitting])

  useEffect(() => {
    if (session.submitted && onSubmitted) {
      onSubmitted(session.submitted)
    }
  }, [session.submitted, onSubmitted])

  if (session.submitted) {
    return (
      <ReadingAttemptResult
        attempt={session.submitted}
        material={material}
        fullMockSessionId={fullMockSessionId}
        onRetake={async () => {
          window.location.reload()
        }}
      />
    )
  }
  if (session.answers === null) {
    return (
      <ExamLoadingScreen
        badge="IELTS Reading"
        label="Восстанавливаем сохранённые ответы…"
        description="Синхронизируем ваш прогресс и последние введённые ответы с сервером..."
      />
    )
  }
  const answers = session.answers

  const totalQuestions = questions.reduce(
    (total, item) => total + item.question.points,
    0,
  )
  const answeredCount = questions.reduce((total, item) => {
    if (!item.question.id) return total
    const answer = answers[item.question.id] ?? {}
    if (Array.isArray(answer.optionIds)) {
      return total + Math.min(answer.optionIds.length, item.question.points)
    }
    if (answer.optionId || answer.value) return total + 1
    return total
  }, 0)
  const activePassageAnsweredCount = activePassageQuestions.filter((item) =>
    isQuestionAnswered(item.question.id, answers[item.question.id ?? '']),
  ).length
  const currentNumber = questionNumberLabel(currentQuestion.question)

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[1780px] flex-col gap-2.5 p-2.5 sm:p-3.5 lg:p-4 overflow-hidden">
      {/* ВЕРХНЯЯ ШАПКА */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e7e7e4] bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-slate-600 hover:text-slate-900"
          >
            {fullMockSessionId ? (
              <Link
                to="/exam/full-mock-sessions/$sessionId"
                params={{ sessionId: fullMockSessionId }}
              >
                <ArrowLeft className="size-4" aria-hidden />
                <span className="hidden sm:inline">К Full Mock</span>
              </Link>
            ) : (
              <Link to="/dashboard/reading">
                <ArrowLeft className="size-4" aria-hidden />
                <span className="hidden sm:inline">К Reading</span>
              </Link>
            )}
          </Button>
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold text-slate-900 truncate max-w-[240px] lg:max-w-[360px]">
              {material.title}
            </h1>
          </div>
        </div>

        {/* Вкладки Разделов (Passages) по центру */}
        {passages.length > 1 && (
          <div className="flex items-center gap-1 rounded-[10px] border border-[#e7e7e4] bg-white p-1">
            {passages.map((passage, passageIndex) => {
              const isCurrentPassage = currentQuestion.passageIndex === passageIndex
              const pQuestions = questions.filter((item) => item.passageIndex === passageIndex)
              const pAnswered = pQuestions.filter((item) =>
                isQuestionAnswered(item.question.id, answers[item.question.id ?? '']),
              ).length
              return (
                <button
                  key={passage.id ?? passageIndex}
                  type="button"
                  onClick={() => goToPassage(passageIndex)}
                  className={cn(
                    'flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all select-none',
                    isCurrentPassage
                      ? 'bg-[#3b82f6] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                  )}
                >
                  <span>Раздел {passageIndex + 1}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      isCurrentPassage
                        ? 'bg-white/25 text-white'
                        : pAnswered === pQuestions.length && pQuestions.length > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {pAnswered}/{pQuestions.length}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Правая часть шапки: Сохранение, Таймер, Кнопка Завершить */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <SaveIndicator state={session.saveState} />
          <TimeBadge
            seconds={durationSeconds > 0 ? remainingSeconds : elapsedSeconds}
            label={durationSeconds > 0 ? 'Осталось' : 'Прошедшее время'}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                disabled={session.isSubmitting}
                className="bg-[#3b82f6] text-white hover:bg-blue-600 shadow-xs"
              >
                {session.isSubmitting ? 'Отправляем…' : 'Завершить тест'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Завершить попытку?</AlertDialogTitle>
                <AlertDialogDescription>
                  {answeredCount < totalQuestions
                    ? `Вы ответили на ${answeredCount} из ${totalQuestions} вопросов. Неотвеченные вопросы будут засчитаны как неверные.`
                    : 'Все вопросы отвечены. Вы уверены, что хотите завершить тест и перейти к результатам?'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Продолжить тест</AlertDialogCancel>
                <AlertDialogAction onClick={session.submit}>
                  Завершить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {session.submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#e23b3b] shrink-0"
        >
          Не удалось отправить тест: {session.submitError}
        </p>
      ) : null}

      {/* Основная рабочая зона — сплит на 2 колонки на desktop */}
      <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-2 overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА: Текст отрывка (Reading Passage) */}
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border border-[#e7e7e4] bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-[#ededeb] px-5 py-3.5 bg-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-xs font-bold text-[#3b82f6] border border-[#dbeafe] shrink-0">
                {passages.length > 1 ? `Раздел ${currentQuestion.passageIndex + 1}` : 'Текст'}
              </span>
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {currentPassage.title}
              </h2>
            </div>
            {/* Контролы размера текста */}
            <div className="flex items-center gap-1 rounded-[8px] p-0.5 border border-[#e7e7e4] bg-white shrink-0">
              <button
                type="button"
                onClick={() => setPassageFontSize('sm')}
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-[6px] transition-colors',
                  passageFontSize === 'sm'
                    ? 'bg-[#3b82f6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                )}
                title="Уменьшить шрифт"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setPassageFontSize('md')}
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-[6px] transition-colors',
                  passageFontSize === 'md'
                    ? 'bg-[#3b82f6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                )}
                title="Стандартный шрифт"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setPassageFontSize('lg')}
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-[6px] transition-colors',
                  passageFontSize === 'lg'
                    ? 'bg-[#3b82f6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                )}
                title="Увеличить шрифт"
              >
                A+
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 select-text bg-white">
            <div
              className={cn(
                'whitespace-pre-wrap font-serif text-slate-800 space-y-4',
                passageFontSize === 'sm' && 'text-[14px] leading-[1.65]',
                passageFontSize === 'md' && 'text-[15.5px] leading-[1.8]',
                passageFontSize === 'lg' && 'text-[17.5px] leading-[1.9]',
              )}
            >
              {currentPassage.body}
            </div>
          </div>
        </Card>

        {/* ПРАВАЯ КОЛОНКА: Вопросы и ответы */}
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border border-[#e7e7e4] bg-white shadow-xs">
          <div className="border-b border-[#ededeb] px-5 py-3.5 bg-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-xs font-bold text-[#3b82f6] border border-[#dbeafe]">
                  {passages.length > 1 ? `Раздел ${currentQuestion.passageIndex + 1}` : 'Вопросы'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentPassage.questionGroups.length}{' '}
                  {currentPassage.questionGroups.length === 1 ? 'группа' : 'групп'} вопросов
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Вопрос {currentNumber} из {totalQuestions}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 bg-white space-y-7">
            {currentPassage.questionGroups.map((group) => (
              <div key={group.id ?? group.position} className="space-y-3.5">
                <div className="border-b border-[#ededeb] pb-2.5">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 border border-slate-200">
                    {group.type.replaceAll('_', ' ')}
                  </span>
                  {group.instructions ? (
                    <p className="mt-2 text-xs leading-relaxed text-[#69696d]">
                      {group.instructions}
                    </p>
                  ) : null}
                </div>
                <StudentGroup
                  group={group}
                  activeQuestionId={currentQuestion.question.id}
                  answers={answers}
                  onAnswer={session.updateAnswer}
                  onSelectQuestion={(qId) => {
                    const idx = questions.findIndex((item) => item.question.id === qId)
                    if (idx >= 0) setActiveQuestionIndex(idx)
                  }}
                />
              </div>
            ))}
          </div>

          {/* Навигация внизу правой колонки */}
          <div className="flex items-center justify-between border-t border-[#ededeb] px-5 py-3 bg-white shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activeQuestionIndex === 0}
              onClick={() => setActiveQuestionIndex((index) => index - 1)}
              className="gap-1.5 rounded-[10px] text-xs font-medium border-[#e7e7e4] bg-white hover:bg-slate-50"
            >
              ← Назад
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#69696d] font-medium">
                Вопрос {currentNumber} из {totalQuestions}
              </span>
              {passages.length > 1 && (
                <span className="text-xs text-slate-400">
                  · Раздел {currentQuestion.passageIndex + 1}
                </span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              disabled={activeQuestionIndex === questions.length - 1}
              onClick={() => setActiveQuestionIndex((index) => index + 1)}
              className="gap-1.5 rounded-[10px] bg-[#3b82f6] text-white hover:bg-blue-600 text-xs font-medium shadow-xs"
            >
              Далее →
            </Button>
          </div>
        </Card>
      </div>

      {/* НИЖНИЙ НАВИГАТОР ПО ВОПРОСАМ (Question Palette) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e7e7e4] bg-white px-3.5 py-2 sm:px-4 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-0.5 max-w-full">
          {/* Переключение разделов внизу (если больше 1 раздела) */}
          {passages.length > 1 && (
            <div className="flex items-center gap-1 border-r border-[#ededeb] pr-2.5 sm:pr-3 shrink-0">
              {passages.map((passage, pIdx) => {
                const isCurrentPassage = currentQuestion.passageIndex === pIdx
                const pQuestions = questions.filter((q) => q.passageIndex === pIdx)
                const pAnswered = pQuestions.filter((item) =>
                  isQuestionAnswered(item.question.id, answers[item.question.id ?? '']),
                ).length
                return (
                  <button
                    key={passage.id ?? pIdx}
                    type="button"
                    onClick={() => goToPassage(pIdx)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-xs font-semibold transition-all shrink-0 select-none',
                      isCurrentPassage
                        ? 'bg-[#3b82f6] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                    title={`Раздел ${pIdx + 1}: ${pAnswered}/${pQuestions.length} отвечено`}
                  >
                    <span>Раздел {pIdx + 1}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                        isCurrentPassage
                          ? 'bg-white/25 text-white'
                          : pAnswered === pQuestions.length && pQuestions.length > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {pAnswered}/{pQuestions.length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Вопросы ТОЛЬКО активного раздела */}
          <div className="flex items-center gap-1 shrink-0">
            {activePassageQuestions.map((item) => {
              const idx = questions.indexOf(item)
              const isCurrent = idx === activeQuestionIndex
              const answered = isQuestionAnswered(
                item.question.id,
                answers[item.question.id ?? ''],
              )
              const label = questionNumberLabel(item.question)
              return (
                <button
                  key={item.question.id ?? idx}
                  type="button"
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-[7px] border text-xs font-semibold transition-all select-none',
                    isCurrent
                      ? 'border-[#3b82f6] bg-[#3b82f6] text-white shadow-xs scale-105'
                      : answered
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'border-[#e7e7e4] bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                  title={`Вопрос ${label}${answered ? ' (отвечен)' : ''}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Счётчик ответов */}
        <div className="flex items-center gap-3 shrink-0 text-xs text-slate-600 font-medium">
          {passages.length > 1 && (
            <span className="text-slate-500 hidden sm:inline">
              В разделе: <strong className="text-slate-800">{activePassageAnsweredCount}</strong> из {activePassageQuestions.length}
              <span className="mx-2 text-slate-300">|</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-600" />
            Всего: <strong className="text-slate-800">{answeredCount}</strong> из {totalQuestions}
          </span>
        </div>
      </div>
    </div>
  )
}

function ReadingAttemptResult({
  attempt,
  material,
  fullMockSessionId,
  onRetake,
  isRetaking,
}: {
  attempt: Attempt
  material: PublicReadingMaterial
  fullMockSessionId?: string
  onRetake?: () => Promise<void> | void
  isRetaking?: boolean
}) {
  const detailQuery = useQuery({
    queryKey: attemptKeys.detail(attempt.id),
    queryFn: ({ signal }) => getAttempt(attempt.id, signal),
  })
  const review =
    detailQuery.data?.status === 'SUBMITTED'
      ? (detailQuery.data.review ?? [])
      : null

  const passages = useMemo(() => resolvePassages(material), [material])

  // Question options map for quick lookup
  const questionOptionsMap = useMemo(() => {
    const map = new Map<string, Option[]>()
    for (const passage of passages) {
      for (const group of passage.questionGroups) {
        for (const q of group.questions) {
          if (q.id) {
            map.set(q.id, (q.content.options ?? []) as Option[])
          }
        }
      }
    }
    return map
  }, [passages])

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'errors' | 'correct'>('all')
  const [selectedPassageTab, setSelectedPassageTab] = useState<number | 'all'>('all')
  const [showPassageText, setShowPassageText] = useState(false)
  const [readingPassageViewIndex, setReadingPassageViewIndex] = useState(0)

  // Metrics
  const totalQuestions = review ? review.length : (attempt.maxScore ?? 40)
  const correctCount = review ? review.filter((i) => i.isCorrect).length : (attempt.score ?? 0)
  const incorrectCount = review ? review.filter((i) => !i.isCorrect).length : 0

  // Filtered review list
  const filteredReviewList = useMemo(() => {
    if (!review) return []
    return review.filter((item) => {
      if (filterStatus === 'errors' && item.isCorrect) return false
      if (filterStatus === 'correct' && !item.isCorrect) return false

      if (selectedPassageTab !== 'all') {
        const passage = passages[selectedPassageTab]
        if (passage) {
          const pQuestionIds = new Set(
            passage.questionGroups.flatMap((g) => g.questions.map((q) => q.id)).filter(Boolean),
          )
          if (!pQuestionIds.has(item.questionId)) return false
        }
      }

      return true
    })
  }, [review, filterStatus, selectedPassageTab, passages])

  const scrollToQuestion = (questionId: string) => {
    const el = document.getElementById(`review-q-${questionId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 p-3 sm:p-6 lg:p-8">
      {/* ВЕРХНЯЯ ПАНЕЛЬ НАВИГАЦИИ */}
      <AttemptResultHeader
        skill="reading"
        fullMockSessionId={fullMockSessionId}
        onRetake={onRetake}
        isRetaking={isRetaking}
      />

      {/* ЗАГОЛОВОК ТЕСТА */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {material.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          IELTS Academic Reading · {material.difficulty} · {totalQuestions} вопросов
        </p>
      </div>

      {/* РЕЗУЛЬТАТИВНЫЙ СВОДНЫЙ ОТЧЁТ */}
      <AttemptPerformanceReport
        band={attempt.band}
        bandNote="Балл рассчитан по стандарту академического чтения IELTS"
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        durationMinutes={material.durationMinutes ?? 60}
        paceUnit="вопрос"
      />


      {/* КНОПКА ПРОСМОТРА ИСХОДНОГО ТЕКСТА */}
      <div className="flex items-center justify-between rounded-[14px] border border-[#e7e7e4] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Book1 className="size-4 text-[#3b82f6]" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Исходный текст чтения
            </p>
            <p className="text-xs text-slate-500">
              Откройте текст, чтобы проверить правильность ответов и найти цитаты
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPassageText((v) => !v)}
          className="gap-1.5 rounded-[10px] border-[#e7e7e4] text-xs font-medium"
        >
          {showPassageText ? (
            <>
              <EyeSlash className="size-3.5" />
              <span>Скрыть текст</span>
            </>
          ) : (
            <>
              <Eye className="size-3.5" />
              <span>Показать текст</span>
            </>
          )}
        </Button>
      </div>

      {/* БЛОК ИСХОДНОГО ТЕКСТА (РАСКРЫВАЮЩИЙСЯ) */}
      {showPassageText && (
        <Card className="rounded-[16px] border border-[#e7e7e4] bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#ededeb] px-5 py-3.5 bg-white">
            <span className="text-sm font-semibold text-slate-900">
              {passages[readingPassageViewIndex]?.title}
            </span>
            {passages.length > 1 && (
              <div className="flex items-center gap-1">
                {passages.map((p, idx) => (
                  <button
                    key={p.id ?? idx}
                    type="button"
                    onClick={() => setReadingPassageViewIndex(idx)}
                    className={cn(
                      'px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors',
                      readingPassageViewIndex === idx
                        ? 'bg-[#3b82f6] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    Раздел {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto p-6 font-serif text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap select-text">
            {passages[readingPassageViewIndex]?.body}
          </div>
        </Card>
      )}

      {/* ПАНЕЛЬ ФИЛЬТРОВ И БЫСТРОГО ПЕРЕХОДА (1-40) */}
      <Card className="rounded-[16px] border border-[#e7e7e4] bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Фильтры: Все / Ошибки / Верные */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={cn(
                'rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all',
                filterStatus === 'all'
                  ? 'bg-[#3b82f6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              Все вопросы ({totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('errors')}
              className={cn(
                'flex items-center gap-1 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all',
                filterStatus === 'errors'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100',
              )}
            >
              <CloseCircle className="size-3.5" />
              <span>Ошибки ({incorrectCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('correct')}
              className={cn(
                'flex items-center gap-1 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all',
                filterStatus === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100',
              )}
            >
              <TickCircle className="size-3.5" />
              <span>Верные ({correctCount})</span>
            </button>
          </div>

          {/* Фильтр по разделам */}
          {passages.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 mr-1 hidden sm:inline">Раздел:</span>
              <button
                type="button"
                onClick={() => setSelectedPassageTab('all')}
                className={cn(
                  'rounded-[6px] px-2 py-1 font-semibold transition-colors',
                  selectedPassageTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                Все
              </button>
              {passages.map((_, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => setSelectedPassageTab(pIdx)}
                  className={cn(
                    'rounded-[6px] px-2 py-1 font-semibold transition-colors',
                    selectedPassageTab === pIdx
                      ? 'bg-[#3b82f6] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  Раздел {pIdx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Быстрая навигационная сетка (1–40) */}
        {review && review.length > 0 && (
          <div className="pt-2 border-t border-[#ededeb]">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Навигация по номерам вопросов (клик для перехода):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {review.map((item) => {
                const isCorrect = item.isCorrect
                return (
                  <button
                    key={item.questionId}
                    type="button"
                    onClick={() => scrollToQuestion(item.questionId)}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-[7px] border text-xs font-semibold transition-all select-none',
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100',
                    )}
                    title={`Вопрос ${item.number}: ${isCorrect ? 'Верно' : 'Ошибка'}`}
                  >
                    {item.number}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* СПИСОК ВОПРОСОВ С ДЕТАЛЬНЫМ РАЗБОРОМ */}
      {detailQuery.isPending ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Загружаем подробный разбор ответов…
        </div>
      ) : detailQuery.isError ? (
        <div className="rounded-[14px] border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          Не удалось загрузить разбор: {getErrorMessage(detailQuery.error)}
        </div>
      ) : filteredReviewList.length === 0 ? (
        <Card className="p-8 text-center rounded-[16px] border border-[#e7e7e4] bg-white">
          <p className="text-sm font-medium text-slate-600">
            Вопросов с выбранным фильтром не найдено
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviewList.map((item) => {
            const options = questionOptionsMap.get(item.questionId) ?? []
            return (
              <EnhancedReviewQuestion
                key={item.questionId}
                item={item}
                options={options}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function GroupContexts({ group }: { group: PublicReadingGroup }) {
  const contexts = Array.from(
    new Set(
      group.questions
        .map((question) => question.content.context)
        .filter(
          (context): context is string =>
            typeof context === 'string' && context.trim() !== '',
        ),
    ),
  )
  const images = Array.from(
    new Set(
      group.questions
        .map((question) => question.content.imageUrl)
        .filter(
          (imageUrl): imageUrl is string =>
            typeof imageUrl === 'string' && imageUrl.trim() !== '',
        ),
    ),
  )
  if (contexts.length === 0 && images.length === 0) return null
  return (
    <>
      {images.map((imageUrl) => (
        <img
          key={imageUrl}
          src={imageUrl}
          alt="Diagram for the question group"
          className="max-h-[420px] w-auto max-w-full rounded-lg border object-contain"
        />
      ))}
      {contexts.map((context) => (
        <div
          key={context}
          className="whitespace-pre-wrap rounded-[12px] border border-[#e7e7e4] bg-[#fafaf8] p-4 text-sm leading-relaxed text-slate-800"
        >
          {context
            .replaceAll('{{answer}}', '_____')
            .replace(/\{\{(\d+)\}\}/g, '($1) _____')}
        </div>
      ))}
    </>
  )
}

function StudentGroup({
  group,
  activeQuestionId,
  answers,
  onAnswer,
  onSelectQuestion,
}: {
  group: PublicReadingGroup
  activeQuestionId?: string
  answers: Record<string, StudentAnswer>
  onAnswer: (questionId: string, answer: StudentAnswer) => void
  onSelectQuestion?: (questionId: string) => void
}) {
  if (group.questions.length === 0) return null
  return (
    <div className="space-y-4">
      <GroupContexts group={group} />
      <div className="space-y-3.5">
        {group.questions.map((question) => {
          const isCurrent = question.id === activeQuestionId
          return (
            <div
              key={question.id ?? question.position}
              id={`reading-q-${question.id}`}
              onClick={() => {
                if (question.id && onSelectQuestion) onSelectQuestion(question.id)
              }}
              className={cn(
                'rounded-[14px] border p-4 sm:p-5 transition-all duration-150 cursor-pointer bg-white',
                isCurrent
                  ? 'border-[#3b82f6] ring-2 ring-[#3b82f6]/20 shadow-xs'
                  : 'border-[#e7e7e4] hover:border-slate-300 hover:shadow-xs',
              )}
            >
              <CleanStudentQuestion
                group={group}
                question={question}
                value={question.id ? answers[question.id] : undefined}
                onAnswer={onAnswer}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Clean question rendering without nested bordered boxes
function CleanStudentQuestion({
  group,
  question,
  value,
  onAnswer,
}: {
  group: PublicReadingGroup
  question: PublicReadingQuestion
  value: StudentAnswer | undefined
  onAnswer: (questionId: string, answer: StudentAnswer) => void
}) {
  const questionId = question.id
  const options = (question.content.options ?? []) as Option[]
  const values =
    group.type === 'true_false_not_given'
      ? tfngValues
      : group.type === 'yes_no_not_given'
        ? ynngValues
        : null

  const prompt = (
    <p className="font-medium">
      <span className="mr-2 text-[#3b82f6]">
        {questionNumberLabel(question)}.
      </span>
      {question.prompt.replace('{{answer}}', '_____')}
    </p>
  )

  // True / False / Not Given & Yes / No / Not Given
  if (questionId && values) {
    const selected = typeof value?.value === 'string' ? value.value : null
    return (
      <div className="space-y-4">
        {prompt}
        <div className="grid gap-2.5 pt-1">
          {values.map((variant) => {
            const isSelected = selected === variant
            return (
              <label
                key={variant}
                onClick={() => onAnswer(questionId, { value: variant })}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition-all select-none',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50',
                )}
              >
                <span>{variant.replaceAll('_', ' ')}</span>
                <div
                  className={cn(
                    'size-4 rounded-full border flex items-center justify-center transition-colors',
                    isSelected
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300 bg-white',
                  )}
                >
                  {isSelected ? <div className="size-1.5 rounded-full bg-white" /> : null}
                </div>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  // Multiple Choice Options
  if (questionId && options.length > 0) {
    const limit =
      group.type === 'multiple_choice'
        ? multiSelectLimit(group.instructions, [question.content])
        : null

    const isMulti = limit && limit > 1
    const selectedIds = isMulti
      ? Array.isArray(value?.optionIds)
        ? (value.optionIds as unknown[]).filter((id): id is string => typeof id === 'string')
        : []
      : typeof value?.optionId === 'string'
        ? [value.optionId]
        : []

    return (
      <div className="space-y-4">
        {prompt}
        {isMulti ? (
          <p className="text-xs font-medium text-slate-500">
            Выберите до {limit} вариантов:
          </p>
        ) : null}
        <div className="grid gap-2.5 pt-1">
          {options.map((option) => {
            const isSelected = selectedIds.includes(option.id)
            return (
              <label
                key={option.id}
                onClick={() => {
                  if (isMulti) {
                    const next = isSelected
                      ? selectedIds.filter((id) => id !== option.id)
                      : selectedIds.length < limit
                        ? [...selectedIds, option.id]
                        : selectedIds
                    onAnswer(questionId, { optionIds: next })
                  } else {
                    onAnswer(questionId, { optionId: option.id })
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm transition-all select-none',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-medium shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors',
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {option.id}
                  </span>
                  <span>{option.text}</span>
                </div>
                <div
                  className={cn(
                    'size-4 shrink-0 rounded-full border flex items-center justify-center transition-colors',
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white',
                  )}
                >
                  {isSelected ? (
                    <TickCircle className="size-3.5 text-white" aria-hidden />
                  ) : null}
                </div>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  // Text Input (sentence completion / short answer)
  const text = typeof value?.value === 'string' ? value.value : ''
  return (
    <div className="space-y-4">
      {prompt}
      <div className="pt-1">
        <Input
          value={text}
          onChange={(event) => {
            if (questionId) {
              onAnswer(questionId, { value: event.target.value })
            }
          }}
          placeholder="Введите ваш ответ здесь…"
          className="h-11 rounded-xl border-slate-200 bg-white px-4 text-base focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Ответ автоматически сохраняется по мере ввода
        </p>
      </div>
    </div>
  )
}

function questionNumberLabel(question: PublicReadingQuestion) {
  const start =
    typeof question.content.number === 'number'
      ? question.content.number
      : question.position
  const end =
    typeof question.content.numberEnd === 'number'
      ? question.content.numberEnd
      : null
  return end && end > start ? `${start}–${end}` : String(start)
}
