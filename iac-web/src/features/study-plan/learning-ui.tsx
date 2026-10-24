import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowRight2,
  Clock,
  CloseCircle,
  Forbidden,
  TickCircle,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { getAttempt, listAttempts } from '@/features/attempts/api'
import { useAuth } from '@/features/auth/auth-store'
import { ApiError, apiClient } from '@/lib/api/client'
import { actionClass } from './controls'
import { planCard, skillLabels } from './summary'
import { identityResult, learningError, useLearning } from './learning-queries'
import type {
  Learning,
  LearningCycle,
  SourceEvidence,
  Verdict,
} from './learning-api'
import type { AnswerDraft } from './learning-draft'
import type { StudyResponse } from './api'

export const learningLayout =
  'mx-auto grid w-full min-w-0 max-w-[1120px] gap-3.5 sm:gap-5 [&_p]:break-words'
export const learningLink =
  'inline-flex min-h-11 items-center gap-2 text-primary underline-offset-4 hover:underline'
export const fieldClass =
  'w-full min-w-0 min-h-11 rounded-[10px] border border-input bg-card px-3 py-2 text-base sm:text-sm'
export const verdictLabel: Record<Verdict, string> = {
  correct: 'Правка совпала с ключом',
  incorrect: 'Правка не совпала с ключом',
  unverified: 'Правка сохранена, не проверена',
}
export function cycleStatus(cycle: LearningCycle) {
  if (cycle.skippedAt) return 'Отложено вами'
  if (
    cycle.correction &&
    (cycle.status === 'correction-saved' ||
      cycle.correction.verdict === 'incorrect')
  )
    return verdictLabel[cycle.correction.verdict]
  return {
    insufficient: 'Мало данных',
    'needs-practice': 'Нужна ваша правка',
    'correction-saved': 'Правка сохранена',
    'awaiting-transfer': 'Ждёт проверки на новом задании',
    demonstrated: 'Показано на новых заданиях',
  }[cycle.status]
}
export function CycleState({ cycle }: { cycle: LearningCycle }) {
  const done = !cycle.skippedAt && cycle.status === 'demonstrated'
  const waiting =
    !cycle.skippedAt &&
    !!cycle.correction &&
    cycle.correction.verdict !== 'incorrect'
  const Icon = cycle.skippedAt ? Forbidden : done ? TickCircle : Clock
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${done ? 'text-[#15803d]' : waiting ? 'text-[#b45309]' : 'text-muted-foreground'}`}
    >
      <Icon size={16} aria-hidden="true" />
      {cycleStatus(cycle)}
    </span>
  )
}
export function LearningSteps({
  step,
  complete = false,
  targets,
}: {
  step: 0 | 1 | 2
  complete?: boolean
  targets?: [string, string, string]
}) {
  return (
    <nav aria-label="Этапы исправления">
      <ol className="flex max-w-[620px] items-start justify-start gap-2 sm:gap-3">
        {['Разбор', 'Правка', 'Проверка на новом задании'].map(
          (label, index) => {
            const Step = targets ? 'a' : 'span'
            return (
              <li
                key={label}
                aria-current={index === step && !complete ? 'step' : undefined}
                className="flex min-w-0 items-center gap-2 text-xs sm:gap-3 sm:text-sm"
              >
                <Step
                  href={targets?.[index]}
                  className="flex min-h-11 min-w-0 flex-col items-start gap-1 py-2 sm:flex-row sm:items-center sm:gap-2"
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${index === step && !complete ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {index < step || complete ? (
                      <TickCircle size={16} aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span
                    className={`min-w-0 max-w-[150px] ${index === step ? 'font-semibold' : 'text-muted-foreground'}`}
                  >
                    {label}
                  </span>
                </Step>
                {index < 2 ? (
                  <span
                    aria-hidden="true"
                    className="mt-5 h-px w-6 shrink-0 self-start bg-border sm:mt-0 sm:w-8 sm:self-center"
                  />
                ) : null}
              </li>
            )
          },
        )}
      </ol>
    </nav>
  )
}
export function VerdictNotice({
  verdict,
  title,
  children,
}: {
  verdict: Verdict | null
  title: string
  children?: ReactNode
}) {
  const Icon =
    verdict === 'correct'
      ? TickCircle
      : verdict === 'incorrect'
        ? CloseCircle
        : Clock
  return (
    <div
      role="status"
      className={`grid gap-2 rounded-xl p-4 text-sm ${verdict === 'correct' ? 'bg-[#f0fdf4] text-[#166534]' : verdict === 'incorrect' ? 'bg-[#fef2f2] text-[#991b1b]' : 'bg-muted text-muted-foreground'}`}
    >
      <p className="flex items-start gap-2 font-semibold">
        <Icon size={20} className="shrink-0" aria-hidden="true" />
        {title}
      </p>
      {children}
    </div>
  )
}
export function ReadOnlyNotice() {
  return (
    <p role="status" className="leading-6">
      День экзамена и после него — только просмотр. Результаты и правки
      сохранены.
    </p>
  )
}
export function LearningLoad({
  pending,
  error,
  retry,
  label,
}: {
  pending: boolean
  error: unknown
  retry: () => void
  label: string
}) {
  return pending ? (
    <LoadingState label={label} />
  ) : (
    <div className="grid gap-3" role="alert">
      <ErrorState
        title="Не удалось загрузить учебные данные"
        message={learningError(error)}
        onRetry={retry}
      />
      <Link to="/plan/learning" className={learningLink}>
        Работа над ошибками
      </Link>
    </div>
  )
}
export function MutationError({ error }: { error: unknown }) {
  return error ? (
    <div role="alert" className="text-sm leading-6 text-[#e23b3b]">
      <p>{learningError(error)}</p>
      {error instanceof ApiError && error.status === 422 && error.details ? (
        <ul>
          {Object.entries(error.details).map(([field, message]) => (
            <li key={field}>
              {(
                {
                  text: 'Ответ',
                  explanation: 'Объяснение',
                  assisted: 'Подсказки',
                  audioAttemptId: 'Запись',
                } as Record<string, string>
              )[field] ?? field}
              : {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  ) : null
}
export function Limitations({ items }: { items: string[] }) {
  return items.length ? (
    <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  ) : null
}
export function RuleStatus({
  data,
  skillId,
  section,
  remainingChecks,
  delayed,
  sourceFamilyKnown,
  sourceModality,
  complete = false,
}: {
  complete?: boolean
  sourceFamilyKnown: boolean
  sourceModality?: string
  data: Learning
  skillId: string
  section: string
  remainingChecks: number
  delayed?: boolean
}) {
  const inventory = data.inventory.sections.find((s) => s.section === section)
  const possible =
    sourceFamilyKnown &&
    sourceModality !== 'script' &&
    ['reading', 'listening'].includes(section) &&
    !!inventory &&
    inventory.reviewedDrills > 0 &&
    inventory.independentFamilies > 0 &&
    data.drills.some(
      (d) =>
        d.skillId === skillId &&
        d.masteryEligible &&
        d.editorialStatus === 'reviewed' &&
        d.modality !== 'script',
    )
  return (
    <div className="text-xs leading-5 text-muted-foreground">
      {complete ? (
        <p>Правило практики выполнено.</p>
      ) : possible ? (
        <>
          {remainingChecks > 0 ? (
            <p>
              По правилу практики осталось проверок: {remainingChecks}.
              {!delayed
                ? ' Одна из них — не раньше чем через 3 дня после правки.'
                : ''}
            </p>
          ) : (
            <p>
              Количество проверок выполнено. Зачёт также зависит от верной
              правки без подсказок и условий ниже.
            </p>
          )}
        </>
      ) : (
        <p>
          {['writing', 'speaking'].includes(section)
            ? 'Независимая проверка Writing/Speaking пока недоступна: нужна проверка специалистом. Тренировки сохраняются как практика.'
            : !sourceFamilyKnown
              ? 'Семейство исходной работы не размечено. Независимость нового задания нельзя подтвердить; ответы сохраняются как практика.'
              : sourceModality === 'script'
                ? 'Чтение сценария без аудио — практика, не свидетельство Listening. Независимая проверка недоступна.'
                : 'Независимая проверка пока недоступна: нет прошедших редакторскую проверку заданий этого навыка с известными семействами. Результаты считаются практикой.'}
        </p>
      )}
      <p className="mt-2 font-medium">Что это за правило</p>
      <p>
        Верная правка без подсказок и две успешные независимые проверки на новых
        семействах того же навыка, одна — через 3 дня после правки или позже.
        Правило выбрано продуктом для практики и не предсказывает результат
        IELTS.
      </p>
    </div>
  )
}
export function AssistanceChoice({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (value: boolean) => void
}) {
  return (
    <fieldset>
      <legend className="font-medium">
        Как вы отвечали? Обязательный выбор
      </legend>
      {[
        { value: false, label: 'Сам, без подсказок' },
        { value: true, label: 'С подсказкой, разбором или чужим текстом' },
      ].map((option) => (
        <label
          className="flex min-h-11 items-center gap-3"
          key={String(option.value)}
        >
          <input
            required
            type="radio"
            name="assisted"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}
export function AnswerFields({
  draft,
  edit,
  objective,
  questionType,
  section,
  correction = false,
}: {
  draft: AnswerDraft
  edit: (patch: Partial<Omit<AnswerDraft, 'key'>>) => void
  objective: boolean
  questionType: string
  section: string
  correction?: boolean
}) {
  const type = questionType.toUpperCase().replace(/[\s/-]+/g, '_')
  const options = /TRUE_FALSE|TFNG/.test(type)
    ? ['TRUE', 'FALSE', 'NOT GIVEN']
    : /YES_NO|YNNG/.test(type)
      ? ['YES', 'NO', 'NOT GIVEN']
      : null
  const label = correction
    ? section === 'writing'
      ? 'Перепишите отмеченное место'
      : section === 'speaking'
        ? 'Новый вариант ответа текстом'
        : 'Ваш исправленный ответ'
    : 'Ваш ответ'
  return (
    <>
      <fieldset className="grid gap-2">
        <legend className="mb-2 font-medium">{label}</legend>
        {objective && options ? (
          options.map((value) => (
            <label className="flex min-h-11 items-center gap-3" key={value}>
              <input
                type="radio"
                required
                name="objective-answer"
                checked={draft.text === value}
                onChange={() => edit({ text: value })}
              />
              {value}
            </label>
          ))
        ) : objective ? (
          <input
            aria-label={label}
            required
            maxLength={12000}
            className={fieldClass}
            value={draft.text}
            onChange={(e) => edit({ text: e.target.value })}
          />
        ) : (
          <textarea
            aria-label={label}
            required
            maxLength={12000}
            rows={7}
            className={fieldClass}
            value={draft.text}
            onChange={(e) => edit({ text: e.target.value })}
          />
        )}
      </fieldset>
      {section === 'speaking' ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Текстовый ответ — не свидетельство речи и произношения.
        </p>
      ) : null}
      {section === 'writing' ? (
        <p className="text-xs text-muted-foreground">
          Слов: {draft.text.trim() ? draft.text.trim().split(/\s+/).length : 0}.
          Используйте собственный короткий текст по заданию.
        </p>
      ) : null}
      {draft.text.length > 11000 ? (
        <p>{draft.text.length}/12000 символов</p>
      ) : null}
      <label className="grid gap-2">
        <span>
          {correction
            ? objective
              ? /TRUE_FALSE|TFNG|YES_NO|YNNG/.test(type)
                ? 'Какое предложение текста это подтверждает или почему информации нет'
                : 'Где в тексте/записи ответ'
              : section === 'speaking'
                ? 'Что вы добавили: причину, пример, сравнение'
                : 'Что вы изменили и почему'
            : 'Коротко: как вы решали (необязательно)'}
        </span>
        <textarea
          aria-label="Объяснение"
          required={correction}
          maxLength={4000}
          rows={3}
          className={fieldClass}
          value={draft.explanation}
          onChange={(e) => edit({ explanation: e.target.value })}
        />
      </label>
      {draft.explanation.length > 3500 ? (
        <p>{draft.explanation.length}/4000 символов</p>
      ) : null}
      <AssistanceChoice
        value={draft.assisted}
        onChange={(assisted) => edit({ assisted })}
      />
    </>
  )
}
export { LearningStimulus as PlainStimulus } from './learning-stimulus'

export function LearningAudio({
  url,
  onReadyChange,
}: {
  url: string
  onReadyChange?: (ready: boolean) => void
}) {
  const readyCallback = useRef(onReadyChange)
  readyCallback.current = onReadyChange
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const { user } = useAuth()
  const path = /^\/(?:api\/v1\/)?listening\/media\/[a-zA-Z0-9_-]+$/.test(url)
    ? `/api/v1/${url.replace(/^\/(?:api\/v1\/)?/, '')}`
    : null
  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    setSrc(null)
    setError(false)
    readyCallback.current?.(false)
    if (!path || !user) {
      setError(true)
      return
    }
    void identityResult(user.id, apiClient.blob(path))
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [path, user?.id, reload])
  return (
    <div className="grid gap-2">
      {error ? (
        <>
          <p role="alert">
            Аудио недоступно или не воспроизводится. Ответ нельзя отправить,
            пока запись не загрузится.
          </p>
          <Button
            type="button"
            variant="outline"
            className={actionClass}
            onClick={() => setReload((n) => n + 1)}
          >
            Загрузить аудио снова
          </Button>
        </>
      ) : src ? (
        <audio
          aria-label="Аудио задания Listening"
          className="w-full max-w-full"
          controls
          preload="auto"
          src={src}
          onCanPlay={() => readyCallback.current?.(true)}
          onError={() => {
            readyCallback.current?.(false)
            setError(true)
          }}
        />
      ) : (
        <p>Загружаем аудио…</p>
      )}
    </div>
  )
}
export function OwnedRecordingChoice({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const { user } = useAuth()
  const [selected, setSelected] = useState(value)
  const list = useQuery({
    queryKey: ['academic-learning', user?.id, 'owned-speaking'],
    enabled: !!user,
    queryFn: ({ signal }) =>
      identityResult(user?.id, listAttempts('speaking', signal)),
  })
  const candidates =
    list.data?.items.filter(
      (a) => a.materialType === 'speaking' && a.status === 'SUBMITTED',
    ) ?? []
  const owned = candidates.some((a) => a.id === selected)
  const detail = useQuery({
    queryKey: ['academic-learning', user?.id, 'owned-recording', selected],
    enabled: !!user && owned,
    queryFn: ({ signal }) =>
      identityResult(user?.id, getAttempt(selected, signal)),
  })
  const valid =
    owned &&
    detail.data?.materialType === 'speaking' &&
    detail.data.status === 'SUBMITTED' &&
    !!detail.data.recordings?.some((r) => r.byteSize > 0)
  useEffect(() => {
    onChange(valid ? selected : '')
  }, [valid, selected])
  return (
    <div className="grid gap-3">
      <p>
        Запишите ответ в обычной практике Speaking, отправьте работу и вернитесь
        сюда. Затем выберите свою работу с сохранённой записью.
      </p>
      <Link
        to="/speaking"
        target="_blank"
        rel="noopener noreferrer"
        className={learningLink}
      >
        Открыть запись Speaking в новой вкладке
      </Link>
      <Button
        type="button"
        variant="outline"
        className={actionClass}
        onClick={() => {
          void list.refetch()
          void detail.refetch()
        }}
      >
        Обновить список записей
      </Button>
      {list.isError ? <MutationError error={list.error} /> : null}
      <label className="grid gap-2">
        Ваша отправленная работа
        <select
          aria-label="Ваша запись Speaking"
          className={fieldClass}
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value)
            onChange('')
          }}
        >
          <option value="">Выберите работу</option>
          {candidates.map((a) => (
            <option key={a.id} value={a.id}>
              {a.testTitle} · {a.submittedAt?.slice(0, 10)}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        detail.isPending && owned ? (
          <p>Проверяем сохранённую запись…</p>
        ) : valid ? (
          <p className="flex items-center gap-2">
            <TickCircle
              size={16}
              aria-hidden="true"
              className="shrink-0 text-[#15803d]"
            />
            Выбрана ваша отправленная работа с аудиозаписью.
          </p>
        ) : (
          <p>
            В этой работе нет доступной отправленной аудиозаписи. Выберите
            другую или запишите новую.
          </p>
        )
      ) : null}
      <p className="text-xs text-muted-foreground">
        Аудио связывается с этой тренировкой. Текст ниже — ваш план или
        расшифровка, не замена записи.
      </p>
    </div>
  )
}
export function LearningEventSummary({
  dates,
  progress,
  compact = false,
}: {
  compact?: boolean
  dates?: string[]
  progress?: StudyResponse['progress']
}) {
  const query = useLearning()
  const { user } = useAuth()
  if (query.isPending || query.isError)
    return (
      <section className={compact ? 'mt-3' : `${planCard} p-4 sm:p-6`}>
        <LearningLoad
          pending={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
          label="Загружаем работу над ошибками…"
        />
      </section>
    )
  const cycles = query.data.cycles
  const inPeriod = (date: string | null) =>
    !!date &&
    (!dates ||
      dates.includes(
        new Intl.DateTimeFormat('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: user?.timezone ?? 'UTC',
        }).format(new Date(date)),
      ))
  const periodProgress = progress?.filter(
    (day) => !dates || dates.includes(day.date),
  )
  const shortDrills =
    periodProgress?.reduce(
      (total, day) => total + (day.drillsCompleted ?? 0),
      0,
    ) ?? 0
  const savedCorrections = periodProgress?.some(
    (day) => day.correctionsSaved !== undefined,
  )
    ? periodProgress.reduce(
        (total, day) => total + (day.correctionsSaved ?? 0),
        0,
      )
    : undefined
  const passedChecks = periodProgress?.some(
    (day) => day.independentChecksPassed !== undefined,
  )
    ? periodProgress.reduce(
        (total, day) => total + (day.independentChecksPassed ?? 0),
        0,
      )
    : undefined
  const viewed = cycles.filter((c) => inPeriod(c.viewedAt)).length
  const corrections = cycles.flatMap((c) =>
    c.correction && inPeriod(c.correction.savedAt) ? [c.correction] : [],
  )
  const checks = cycles
    .flatMap((c) => c.checks)
    .filter((c) => inPeriod(c.occurredAt))
  const passed =
    passedChecks ?? checks.filter((c) => c.independent && c.passed).length
  const next =
    cycles.find((c) => !c.skippedAt && c.status === 'needs-practice') ??
    cycles.find(
      (c) => !c.skippedAt && c.status !== 'demonstrated' && !!c.nextDrillId,
    )
  const skipped =
    progress
      ?.filter((d) => !dates || dates.includes(d.date))
      .reduce((n, d) => n + d.skippedAssignments, 0) ?? 0
  if (compact)
    return (
      <section
        aria-label="Итог недели"
        className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs leading-5 text-muted-foreground"
      >
        <p>Коротких тренировок сохранено: {shortDrills}</p>
        <p>Правок сохранено: {savedCorrections ?? corrections.length}</p>
        <p>Проверок на новых заданиях: {passed}</p>
      </section>
    )
  return (
    <section
      className={`${planCard} p-4 sm:p-6`}
      aria-label={dates ? 'Итог недели' : 'Работа над ошибками'}
    >
      <h2 className="text-base font-semibold">
        {dates ? 'Итог недели' : 'Работа над ошибками'}
      </h2>
      <div className="mt-3 grid gap-2 text-sm leading-6">
        <p>Разборов просмотрено: {viewed}</p>
        {dates && progress ? (
          <p>Коротких тренировок сохранено: {shortDrills}</p>
        ) : null}
        <p>
          Правок сохранено: {savedCorrections ?? corrections.length} · текущие
          правки — совпали с ключом:{' '}
          {corrections.filter((c) => c.verdict === 'correct').length} · не
          совпали: {corrections.filter((c) => c.verdict === 'incorrect').length}{' '}
          · не проверены:{' '}
          {corrections.filter((c) => c.verdict === 'unverified').length}
        </p>
        <p>
          Засчитанных проверок на новых заданиях: {passed} · практика:{' '}
          {checks.filter((c) => !c.independent).length} · ошибка повторилась:{' '}
          {checks.filter((c) => c.independent && !c.passed).length}
        </p>
        {dates ? <p>Пропущено заданий: {skipped}</p> : null}
        {dates &&
        !viewed &&
        !corrections.length &&
        !checks.length &&
        !shortDrills &&
        !savedCorrections &&
        !passedChecks &&
        !skipped ? (
          <p>На этой неделе учебных событий нет. План продолжится без долга.</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Это учёт ваших действий, не IELTS band.
        </p>
      </div>
      {dates && next ? (
        <p className="mt-3 text-sm leading-6">
          Дальше: {skillLabels[next.section]} ·{' '}
          {query.data.skills.find((s) => s.id === next.skillId)?.title ??
            next.source.questionType}{' '}
          —{' '}
          {next.status === 'needs-practice'
            ? 'ваша правка'
            : next.nextCheckDate
              ? `отложенная проверка — не раньше ${next.nextCheckDate}`
              : 'дата проверки пока не назначена'}
          .
        </p>
      ) : null}
      <Link to="/plan/learning" className={learningLink}>
        Работа над ошибками
      </Link>
    </section>
  )
}
export function LearningEntry() {
  const query = useLearning()
  const count = query.data?.cycles.filter(
    (c) =>
      !c.skippedAt &&
      (c.status === 'needs-practice' || c.correction?.verdict === 'incorrect'),
  ).length
  return (
    <Button asChild variant="outline" className="min-h-11">
      <Link to="/plan/learning">
        Работа над ошибками
        {count !== undefined ? (
          <span className="tabular-nums text-muted-foreground">
            <span className="sr-only">Ждут правки: </span>
            {count}
          </span>
        ) : null}
        <ArrowRight2 size={16} aria-hidden="true" />
      </Link>
    </Button>
  )
}

export function SourceDate({ value }: { value: string }) {
  const { user } = useAuth()
  if (!value || Number.isNaN(Date.parse(value))) return <>Дата не указана</>
  return (
    <>
      {new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        timeZone: user?.timezone ?? 'UTC',
      }).format(new Date(value))}
    </>
  )
}
export { skillLabels }

export function SourceWorkLink({
  data,
  source,
  children = 'Исходная работа',
}: {
  data: Learning
  source: SourceEvidence
  children?: React.ReactNode
}) {
  if (source.sessionId)
    return (
      <Link
        to="/plan/learning/drills/$drillId"
        params={{
          drillId:
            source.drillId ??
            data.drills.find((d) => d.id === source.materialId)?.id ??
            'session',
        }}
        search={{ session: source.sessionId }}
        className={learningLink}
      >
        {children}
        <ArrowRight2 size={16} aria-hidden="true" />
      </Link>
    )
  return source.attemptId ? (
    <Link
      to="/attempts/$attemptId"
      params={{ attemptId: source.attemptId }}
      className={learningLink}
    >
      {children}
      <ArrowRight2 size={16} aria-hidden="true" />
    </Link>
  ) : (
    <p>Источник работы сейчас недоступен.</p>
  )
}
