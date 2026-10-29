import {
  Add,
  ArrowLeft2,
  ArrowRight2,
  Clock,
  More,
  TickCircle,
  MinusCirlce,
  InfoCircle,
} from 'iconsax-react'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentRequiredReason } from '@/features/billing/api'
import { openPaywall } from '@/features/billing/paywall-store'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Disclosure } from '@/components/ui/disclosure'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import {
  createStudyPlan,
  replanStudy,
  skipAssignment,
  startAssignment,
  updateStudySettings,
} from '@/features/study-plan/api'
import type {
  SkipReason,
  StudyAssignment,
  StudyDay,
} from '@/features/study-plan/api'
import {
  addDays,
  daysBetween,
  formatCalendar,
  weeklyOfferDate,
  studyTarget,
} from '@/features/study-plan/calendar'
import {
  studyError,
  useStudyPlan,
  useStudyWriter,
} from '@/features/study-plan/queries'
import {
  EvidenceSection,
  TargetLink,
  planCard,
  skillLabels,
} from '@/features/study-plan/summary'
import { useLearning } from '@/features/study-plan/learning-queries'
import { LearningEventSummary } from '@/features/study-plan/learning-ui'
import { cn } from '@/lib/utils'
import { authStore, useAuth } from '@/features/auth/auth-store'
import { updateGoal, queryKeys } from '@/features/ielts/api'

import {
  SettingsForm,
  MockOffer,
  actionClass,
} from '@/features/study-plan/controls'
import type { Operation } from '@/features/study-plan/controls'

const focusText = (goal: string) =>
  goal.split(/(?<=\.)\s+(?:Пока|Сохранённые|Будущие|Типы)/)[0]

const skipReasons: Record<SkipReason, string> = {
  no_time: 'Нет времени',
  unsuitable: 'Материал не подходит',
  outside_app: 'Уже сделал вне приложения',
  other: 'Другое',
}
const skipReasonLabels: Partial<Record<string, string>> = {
  ...skipReasons,
  superseded_by_optional_mock: 'Заменено длинным окном',
}
export function PlanPage() {
  const { user } = useAuth()
  const query = useStudyPlan()
  const queryClient = useQueryClient()
  const [examDate, setExamDate] = useState('')
  const [notice, setNotice] = useState('')
  const learning = useLearning()
  const search = useSearch({ from: '/_app/plan' })
  const navigate = useNavigate()
  const write = useStudyWriter()
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [skip, setSkip] = useState<StudyAssignment | null>(null)
  const [reason, setReason] = useState<SkipReason>('no_time')
  const [reviewed, setReviewed] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const mutation = useMutation({
    mutationFn: (input: { operation: Operation; name: string }) =>
      write(input.operation),
  })
  const data = query.data
  const date = search.date ?? data?.today
  const view = search.view
  const select = (nextDate: string, nextView = view, replace = false) =>
    navigate({
      to: '/plan',
      search: { date: nextDate, view: nextView },
      replace,
      resetScroll: false,
    })
  useEffect(() => {
    if (data && !search.date)
      void navigate({
        to: '/plan',
        search: { view: search.view, date: data.today },
        replace: true,
        resetScroll: false,
      })
  }, [data?.today, search.date, search.view, navigate])
  async function run(operation: Operation, name = 'change') {
    setError(null)
    try {
      return await mutation.mutateAsync({ operation, name })
    } catch (err) {
      const paywall = paymentRequiredReason(err)
      if (paywall) {
        openPaywall(paywall)
        return undefined
      }
      setError(studyError(err))
      requestAnimationFrame(() => errorRef.current?.focus())
      return undefined
    }
  }
  if (!user)
    return (
      <div className={`${planCard} p-6`}>
        <p>Сессия истекла. Войдите снова.</p>
        <Link
          to="/login"
          className="mt-3 inline-block text-primary hover:underline"
        >
          Войти
        </Link>
      </div>
    )
  if (query.isPending)
    return <LoadingState label="Загружаем план…" className="min-h-[360px]" />
  if (query.isError || !data || !date)
    return (
      <ErrorState
        title="Не удалось загрузить план"
        message={studyError(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  const plan = data.plan
  const expired = Boolean(plan && data.today > plan.endDate)
  const currentWeek =
    plan?.weeks.find((w) => date >= w.startDate && date <= w.endDate) ??
    (expired && plan && date > plan.endDate ? plan.weeks.at(-1) : undefined)
  const selectedDay = plan?.days.find((d) => d.date === date)
  const startOfWeek = currentWeek?.startDate ?? date
  const weekDays =
    plan?.days
      .filter((day) => day.week === currentWeek?.week)
      .map((day) => day.date) ?? []
  // Until the learner explicitly starts another cycle, month still shows the
  // completed plan rather than an empty hypothetical next cycle.
  const monthDate =
    expired && plan && date > plan.endDate ? plan.startDate : date
  const periodStart = plan
    ? addDays(
        plan.startDate,
        Math.floor(daysBetween(plan.startDate, monthDate) / 30) * 30,
      )
    : date
  const periodEnd = addDays(periodStart, 29)
  const periodLabel =
    view === 'day'
      ? formatCalendar(date, true)
      : view === 'week'
        ? `${formatCalendar(startOfWeek)} – ${formatCalendar(currentWeek?.endDate ?? startOfWeek)}`
        : `${formatCalendar(periodStart)} – ${formatCalendar(periodEnd)}`
  const pending = mutation.isPending || query.isFetching
  const examReadOnly =
    !!(data.goal.examDate && data.today >= data.goal.examDate) ||
    learning.data?.readOnly === true
  const revision = plan?.revision ?? 0
  const meaningfulChanges =
    plan?.changes.filter(
      (change) =>
        /^(SKIP|REPLAN|REENTRY|SETTINGS|NEW_EVIDENCE|MOCK_SCHEDULED|MOVED|REMOVED|SHORTENED)$/.test(
          change.type,
        ) && change.description.trim(),
    ) ?? []
  const activeAssignment =
    mutation.isPending && mutation.variables.name.startsWith('start:')
      ? mutation.variables.name.slice(6)
      : null
  async function start(assignment: StudyAssignment) {
    if (examReadOnly) return
    if (assignment.kind === 'DRILL') {
      if (!assignment.drillId) {
        setError('У тренировки нет идентификатора. Обновите план.')
        return
      }
      await navigate({
        to: '/plan/learning/drills/$drillId',
        params: { drillId: assignment.drillId },
        search: {
          assignment: assignment.id,
          ...(assignment.cycleId ? { cycle: assignment.cycleId } : {}),
          ...(assignment.sessionId ? { session: assignment.sessionId } : {}),
        },
      })
      return
    }
    const result = await run(
      () => startAssignment(assignment.id, revision),
      `start:${assignment.id}`,
    )
    if (!result || !('target' in result)) return
    const target = studyTarget(result.target)
    if (!target) {
      setError('Сервер вернул недоступный адрес задания. Обновите план.')
      return
    }
    const reviewTarget = new URL(target, 'https://iac.invalid')
    if (
      assignment.kind === 'REVIEW' &&
      result.attemptId &&
      reviewTarget.pathname === `/attempts/${result.attemptId}`
    ) {
      await navigate({
        to: '/attempts/$attemptId',
        params: { attemptId: result.attemptId },
        search: { studyReview: assignment.id },
      })
    } else await navigate({ to: target })
  }
  function tasks(day: StudyDay) {
    const next =
      day.assignments.find((a) => a.status === 'IN_PROGRESS') ??
      day.assignments.find((a) => a.status === 'PLANNED')
    const scheduled = plan?.weeks.find(
      (w) =>
        w.mockOffer.status === 'SCHEDULED' &&
        w.mockOffer.scheduledDate === day.date,
    )
    const completedMinutes = day.assignments
      .filter((a) => a.status === 'COMPLETED')
      .reduce((n, a) => n + a.durationMinutes, 0)
    const assignments = next
      ? [next, ...day.assignments.filter((a) => a.id !== next.id)]
      : day.assignments
    const nextDay = plan?.days.find((d) => d.date > day.date && !d.isRest)
    return (
      <>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold first-letter:uppercase">
              {new Intl.DateTimeFormat('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC',
              }).format(new Date(day.date + 'T12:00:00Z'))}
            </h3>
            {!day.isRest && !scheduled ? (
              <span
                className="text-xs text-muted-foreground"
                title="Длительность выполненных заданий из бюджета дня"
              >
                Выполнено {completedMinutes} из {day.budgetMinutes} мин
              </span>
            ) : null}
          </div>
          {!day.isRest && !scheduled ? (
            <div
              role="progressbar"
              aria-label="Выполнено за день"
              aria-valuemin={0}
              aria-valuemax={day.budgetMinutes || 1}
              aria-valuenow={completedMinutes}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, (completedMinutes / (day.budgetMinutes || 1)) * 100)}%`,
                }}
              />
            </div>
          ) : null}
          {plan?.returnAfterPause && day.date === data!.today && !expired ? (
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <InfoCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
              Вернёмся после паузы с короткой работы
            </p>
          ) : null}
          {day.readOnlyReason ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {day.readOnlyReason}
            </p>
          ) : null}
          {scheduled ? (
            <MockOffer
              week={scheduled}
              data={data!}
              readonly
              pending={pending}
              run={run}
            />
          ) : null}
        </div>
        {!next &&
        day.assignments.length > 0 &&
        !scheduled &&
        !day.isRest &&
        day.assignments.every(
          (a) =>
            a.status === 'COMPLETED' ||
            a.status === 'SKIPPED' ||
            a.status === 'MISSED',
        ) ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 sm:px-5">
            <p className="flex items-center gap-2 text-sm">
              <TickCircle size={18} className="text-green-600" aria-hidden />
              На сегодня всё
            </p>
            {plan?.days.some((d) => d.date === addDays(day.date, 1)) ? (
              <Button
                variant="ghost"
                className="min-h-11 text-primary"
                onClick={() => void select(addDays(day.date, 1), 'day')}
              >
                Завтрашний день
                <ArrowRight2 size={16} aria-hidden />
              </Button>
            ) : null}
          </div>
        ) : null}
        {assignments.map((assignment) => {
          const featured = assignment.id === next?.id && !scheduled
          const canAct =
            !examReadOnly &&
            !day.readOnlyReason &&
            day.date === data!.today &&
            (assignment.status === 'PLANNED' ||
              assignment.status === 'IN_PROGRESS') &&
            !scheduled
          const complete = assignment.status === 'COMPLETED'
          const skipped =
            assignment.status === 'SKIPPED' || assignment.status === 'MISSED'
          const status = complete
            ? assignment.kind === 'REVIEW'
              ? 'Разбор просмотрен'
              : 'Завершено'
            : skipped
              ? 'Пропущено'
              : assignment.status === 'IN_PROGRESS'
                ? 'В процессе'
                : assignment.status === 'AWAITING_RESULT'
                  ? 'Работа сохранена и ожидает проверки'
                  : assignment.status === 'BLOCKED'
                    ? 'Материал недоступен'
                    : 'Запланировано'
          const StatusIcon = complete
            ? TickCircle
            : skipped || assignment.status === 'BLOCKED'
              ? MinusCirlce
              : Clock
          return (
            <article
              key={assignment.id}
              data-testid="study-assignment"
              className={cn(
                'flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:px-5',
                featured && 'py-5',
                skipped && 'opacity-60',
              )}
            >
              {!featured ? (
                <StatusIcon
                  size={18}
                  aria-hidden
                  className={cn(
                    'hidden shrink-0 sm:block',
                    complete ? 'text-green-600' : 'text-muted-foreground',
                  )}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                {featured ? (
                  <p className="mb-1 text-xs text-muted-foreground">
                    Следующее · {skillLabels[assignment.skill]}
                  </p>
                ) : null}
                <h3
                  className={cn(
                    'font-semibold leading-5',
                    featured && 'text-base leading-6',
                  )}
                >
                  {assignment.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {!featured ? `${skillLabels[assignment.skill]} · ` : ''}
                  {assignment.durationMinutes} мин
                  {day.preliminary ? ' · предварительно' : ''}
                </p>
                {featured ? (
                  <p
                    className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground"
                    title={assignment.reason}
                  >
                    {assignment.reason}
                  </p>
                ) : null}
                {!featured || assignment.status !== 'PLANNED' ? (
                  <p
                    className={cn(
                      'mt-1 flex items-center gap-1.5 text-xs',
                      complete
                        ? 'text-green-600'
                        : assignment.status === 'IN_PROGRESS' ||
                            assignment.status === 'AWAITING_RESULT'
                          ? 'text-amber-700'
                          : 'text-muted-foreground',
                    )}
                  >
                    <StatusIcon size={14} aria-hidden />
                    {status}
                    {assignment.skipReason
                      ? ` · ${skipReasonLabels[assignment.skipReason] ?? 'Другая причина'}`
                      : ''}
                  </p>
                ) : null}
              </div>
              {canAct ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    className={cn(actionClass, 'flex-1 sm:flex-none')}
                    variant={featured ? 'default' : 'ghost'}
                    disabled={pending}
                    onClick={() => void start(assignment)}
                  >
                    {activeAssignment === assignment.id
                      ? 'Открываем…'
                      : assignment.status === 'IN_PROGRESS'
                        ? 'Продолжить'
                        : assignment.kind === 'REVIEW'
                          ? 'Открыть разбор'
                          : 'Начать'}
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        aria-label={`Действия: ${assignment.title}`}
                        className="size-11 shrink-0"
                        variant="ghost"
                        disabled={pending}
                      >
                        <More aria-hidden />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="grid gap-1 p-2">
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          setReason('no_time')
                          setSkip(assignment)
                        }}
                      >
                        Пропустить
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : assignment.kind === 'DRILL' && assignment.drillId ? (
                <Button asChild variant="ghost" className={actionClass}>
                  <Link
                    to="/plan/learning/drills/$drillId"
                    params={{ drillId: assignment.drillId }}
                    search={{
                      assignment: assignment.id,
                      ...(assignment.cycleId
                        ? { cycle: assignment.cycleId }
                        : {}),
                      ...(assignment.sessionId
                        ? { session: assignment.sessionId }
                        : {}),
                    }}
                  >
                    Посмотреть тренировку
                    <ArrowRight2 size={16} aria-hidden />
                  </Link>
                </Button>
              ) : assignment.status === 'BLOCKED' ? (
                <TargetLink
                  target={assignment.target}
                  className="text-xs text-primary hover:underline"
                >
                  Выбрать доступную практику
                  <ArrowRight2 size={16} aria-hidden />
                </TargetLink>
              ) : assignment.attemptId && !skipped ? (
                <Button asChild variant="ghost" className={actionClass}>
                  <Link
                    to="/attempts/$attemptId"
                    params={{ attemptId: assignment.attemptId }}
                  >
                    Открыть работу
                    <ArrowRight2 size={16} aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </article>
          )
        })}
        {day.isRest && !scheduled ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4 sm:px-5">
            <p className="text-muted-foreground">Сегодня отдых</p>
            {nextDay ? (
              <Button
                variant="ghost"
                className={actionClass}
                onClick={() => void select(nextDay.date, 'day')}
              >
                Следующее занятие · {formatCalendar(nextDay.date)}
                <ArrowRight2 size={16} aria-hidden />
              </Button>
            ) : null}
          </div>
        ) : !day.assignments.length && !scheduled ? (
          <div className="p-4">
            <p className="text-muted-foreground">Доступных заданий пока нет.</p>
            <Button asChild variant="outline" className="mt-3">
              <Link to="/practice">Выбрать практику</Link>
            </Button>
          </div>
        ) : null}
      </>
    )
  }
  const showDayMock =
    currentWeek &&
    selectedDay &&
    selectedDay.date ===
      weeklyOfferDate(currentWeek, data.settings.studyDays) &&
    !(
      currentWeek.mockOffer.status === 'SCHEDULED' &&
      currentWeek.mockOffer.scheduledDate === selectedDay.date
    )

  const correctionCount =
    learning.data?.cycles.filter(
      (c) =>
        !c.skippedAt &&
        (c.status === 'needs-practice' ||
          c.correction?.verdict === 'incorrect'),
    ).length ?? 0
  const correctionPlural = new Intl.PluralRules('ru-RU').select(correctionCount)
  const correctionSummary = `${correctionCount} ${correctionPlural === 'one' ? 'ошибка ждёт' : correctionPlural === 'few' ? 'ошибки ждут' : 'ошибок ждут'} правки`
  const activeWeekDay =
    selectedDay && weekDays.includes(selectedDay.date)
      ? selectedDay
      : plan?.days.find((d) => weekDays.includes(d.date))
  function openSettings() {
    setMenuOpen(false)
    setExamDate(data!.goal.examDate ?? '')
    setSettingsOpen(true)
  }
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-4 pb-16 text-sm text-foreground sm:gap-5">
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold leading-7 sm:text-2xl sm:leading-8">
            План
          </h2>
          <div className="contents sm:flex sm:items-center sm:gap-2">
            <div
              role="radiogroup"
              aria-label="Период плана"
              className="order-3 flex w-full rounded-xl bg-muted p-1 sm:order-none sm:w-auto"
            >
              {(['day', 'week', 'month'] as const).map((v, i) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === v}
                  key={v}
                  className={cn(
                    'min-h-11 flex-1 rounded-lg px-5 focus-visible:outline-2 focus-visible:outline-primary sm:min-h-9',
                    view === v
                      ? 'bg-card font-semibold text-primary shadow-sm'
                      : 'text-muted-foreground',
                  )}
                  onClick={() => void select(date, v)}
                >
                  {['День', 'Неделя', 'Месяц'][i]}
                </button>
              ))}
            </div>
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  aria-label="Меню плана"
                  variant="ghost"
                  className="size-11"
                >
                  <More size={20} aria-hidden />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="grid w-72 gap-1 p-2">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={openSettings}
                >
                  Настройки
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  disabled={!plan || pending || expired || examReadOnly}
                  onClick={() =>
                    void run(() => replanStudy(revision), 'replan').then(
                      (r) => {
                        if (r)
                          setNotice(
                            'План обновлён под оставшееся время. Пропущенные минуты не добавляются как долг.',
                          )
                      },
                    )
                  }
                >
                  Перепланировать оставшееся
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setMenuOpen(false)
                    setReviewed(true)
                    requestAnimationFrame(() =>
                      document
                        .getElementById('plan-history')
                        ?.scrollIntoView({ behavior: 'smooth' }),
                    )
                  }}
                >
                  История версий
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="size-11 shrink-0 sm:size-8"
            aria-label="Предыдущий период"
            disabled={
              view === 'week' && Boolean(plan && startOfWeek <= plan.startDate)
            }
            onClick={() =>
              void select(
                view === 'week'
                  ? addDays(startOfWeek, -7)
                  : addDays(date, view === 'day' ? -1 : -30),
              )
            }
          >
            <ArrowLeft2 size={16} aria-hidden />
          </Button>
          <p className="min-w-0 flex-1 text-center font-semibold sm:flex-none sm:px-3">
            {periodLabel}
          </p>
          <Button
            variant="ghost"
            className="size-11 shrink-0 sm:size-8"
            aria-label="Следующий период"
            disabled={
              view === 'week' &&
              Boolean(plan && addDays(startOfWeek, 7) > plan.endDate)
            }
            onClick={() =>
              void select(
                view === 'week'
                  ? addDays(startOfWeek, 7)
                  : addDays(date, view === 'day' ? 1 : 30),
              )
            }
          >
            <ArrowRight2 size={16} aria-hidden />
          </Button>
          {date !== data.today ? (
            <Button
              variant="outline"
              className="ml-2 min-h-11 sm:min-h-8"
              onClick={() => void select(data.today)}
            >
              Сегодня
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-5 text-muted-foreground">
          <span>
            {data.goal.targetBand !== null
              ? `Цель ${data.goal.targetBand.toFixed(1)}`
              : 'Цель не задана'}{' '}
            · {data.settings.dailyMinutes} мин в день ·{' '}
            {data.settings.studyDays.length} дней в неделю
            {data.goal.examDate
              ? ` · экзамен ${formatCalendar(data.goal.examDate)}`
              : ''}
          </span>
          {!data.goal.examDate ? (
            <Button
              variant="ghost"
              size="xs"
              className="-ml-2 -mt-2 -mb-1 min-h-11 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary sm:my-0 sm:ml-0 sm:min-h-7"
              onClick={openSettings}
            >
              <Add size={14} aria-hidden />
              Добавить дату экзамена
            </Button>
          ) : null}
          {data.goal.targetBand === null ? (
            <Button asChild variant="ghost">
              <Link to="/profile">
                Задать цель
                <ArrowRight2 size={16} aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </header>
      {notice ? (
        <p
          role="status"
          className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
        >
          <TickCircle size={16} className="shrink-0" aria-hidden />
          {notice}
        </p>
      ) : null}
      {error ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          className={`${planCard} p-4 text-destructive`}
          role="alert"
        >
          <p>{error}</p>
          <Button
            variant="outline"
            disabled={pending}
            className="mt-2"
            onClick={() => {
              setError(null)
              void query.refetch()
            }}
          >
            Обновить план
          </Button>
        </div>
      ) : null}
      {examReadOnly ? (
        <p className="text-xs text-muted-foreground">
          День экзамена и после него — только просмотр.
        </p>
      ) : null}
      {!plan ? (
        <section className={`${planCard} grid max-w-lg gap-5 p-5`}>
          <div>
            <h3 className="text-base font-semibold">
              Создайте план на 30 дней
            </h3>
            <p className="mt-2 text-muted-foreground">
              Выберите время и учебные дни. Задания появятся из опубликованных
              материалов и ваших работ.
            </p>
          </div>
          <SettingsForm
            settings={data.settings}
            pending={pending || examReadOnly}
            create
            onSave={(s) => void run(() => createStudyPlan(s))}
          />
        </section>
      ) : (
        <>
          {expired ? (
            <section
              className={`${planCard} grid gap-3 p-5`}
              aria-label="Завершённый цикл"
            >
              <h3 className="text-base font-semibold">
                30-дневный план завершён
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatCalendar(plan.startDate)} –{' '}
                {formatCalendar(plan.endDate)}. История работ сохранится.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  className={actionClass}
                  disabled={pending || examReadOnly}
                  onClick={() =>
                    void run(() => createStudyPlan(data.settings)).then(
                      (result) => {
                        if (
                          result &&
                          'today' in result &&
                          result.plan &&
                          result.today <= result.plan.endDate
                        )
                          void select(result.today, 'day')
                      },
                    )
                  }
                >
                  {mutation.isPending
                    ? 'Создаём следующий план…'
                    : 'Начать следующий 30-дневный план'}
                </Button>
                <Button asChild variant="outline" className={actionClass}>
                  <Link
                    to="/plan"
                    search={{ view: 'month', date: plan.startDate }}
                  >
                    Посмотреть завершённый цикл
                  </Link>
                </Button>
              </div>
            </section>
          ) : null}
          <section
            className={view === 'month' ? 'grid min-w-0 gap-3' : planCard}
            aria-label="Задания плана"
          >
            {view === 'day' ? (
              <>
                {selectedDay ? (
                  tasks(selectedDay)
                ) : (
                  <div className="p-5">
                    <p className="text-muted-foreground">
                      Эта дата вне текущего плана.
                    </p>
                    <Button
                      variant="ghost"
                      className="mt-2"
                      onClick={() => void select(data.today)}
                    >
                      Вернуться к сегодняшнему дню
                      <ArrowRight2 size={16} aria-hidden />
                    </Button>
                  </div>
                )}
                {showDayMock ? (
                  <div className="border-t border-border p-4 sm:p-5">
                    <MockOffer
                      key={currentWeek.week}
                      week={currentWeek}
                      data={data}
                      readonly={
                        date < data.today ||
                        examReadOnly ||
                        !!selectedDay.readOnlyReason
                      }
                      pending={pending}
                      run={run}
                    />
                  </div>
                ) : null}
              </>
            ) : view === 'week' ? (
              <>
                <div
                  className="grid grid-cols-7 gap-0.5 border-b border-border p-2 sm:gap-2 sm:p-4"
                  aria-label="Дни недели"
                >
                  {weekDays.map((d) => {
                    const day = plan.days.find((x) => x.date === d)!
                    const done = day.assignments.filter(
                      (a) => a.status === 'COMPLETED',
                    )
                    const minutes = done.reduce(
                      (n, a) => n + a.durationMinutes,
                      0,
                    )
                    const selected = activeWeekDay?.date === d
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-expanded={selected}
                        aria-controls="selected-week-day"
                        aria-label={`${formatCalendar(d, true)}${day.isRest ? ' · Отдых' : ''}`}
                        onClick={() => void select(d, 'week')}
                        className={cn(
                          'min-w-0 rounded-xl border px-0.5 py-2 text-center sm:px-2 sm:py-3 sm:text-left focus-visible:outline-2 focus-visible:outline-primary',
                          selected
                            ? 'border-primary bg-card'
                            : 'border-transparent hover:bg-muted',
                          d === data.today && 'text-primary',
                        )}
                      >
                        <span className="block text-xs">
                          {new Intl.DateTimeFormat('ru-RU', {
                            weekday: 'short',
                            timeZone: 'UTC',
                          }).format(new Date(d + 'T12:00:00Z'))}
                        </span>
                        <span className="mt-1 block text-lg font-semibold">
                          {Number(d.slice(-2))}
                        </span>
                        <span className="mt-1 hidden text-xs text-muted-foreground sm:block">
                          {day.isRest
                            ? 'отдых'
                            : `${minutes}/${day.budgetMinutes} мин`}
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            'mx-auto mt-2 block size-1.5 rounded-full sm:hidden',
                            done.length
                              ? 'bg-primary'
                              : day.isRest
                                ? 'bg-transparent'
                                : 'bg-border',
                          )}
                        />
                        <span className="mt-2 hidden flex-wrap gap-1 sm:flex">
                          {day.assignments.map((a) => (
                            <span
                              key={a.id}
                              className={cn(
                                'size-1.5 rounded-full',
                                a.status === 'COMPLETED'
                                  ? 'bg-primary'
                                  : 'bg-border',
                              )}
                            />
                          ))}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div id="selected-week-day">
                  {activeWeekDay ? (
                    tasks(activeWeekDay)
                  ) : (
                    <p className="p-5 text-muted-foreground">
                      Заданий на эту неделю нет.
                    </p>
                  )}
                </div>
                <div className="border-t border-border p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold">Цели недели</h3>
                    <span className="text-xs text-muted-foreground">
                      {
                        plan.days
                          .filter((d) => weekDays.includes(d.date))
                          .flatMap((d) => d.assignments)
                          .filter((a) => a.status === 'COMPLETED').length
                      }
                      /
                      {
                        plan.days
                          .filter((d) => weekDays.includes(d.date))
                          .flatMap((d) => d.assignments).length
                      }{' '}
                      заданий
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {currentWeek ? focusText(currentWeek.goal) : ''}
                  </p>
                  <ul className="mt-2 divide-y divide-border">
                    {Object.entries(skillLabels)
                      .filter(([skill]) =>
                        plan.days.some(
                          (d) =>
                            weekDays.includes(d.date) &&
                            d.assignments.some((a) => a.skill === skill),
                        ),
                      )
                      .map(([skill, title]) => {
                        const items = plan.days
                          .filter((d) => weekDays.includes(d.date))
                          .flatMap((d) => d.assignments)
                          .filter((a) => a.skill === skill)
                        const done = items.filter(
                          (a) => a.status === 'COMPLETED',
                        ).length
                        return (
                          <li
                            key={skill}
                            className="flex items-center justify-between gap-3 py-3"
                          >
                            <span className="flex items-center gap-2">
                              {done === items.length ? (
                                <TickCircle
                                  size={16}
                                  className="text-green-600"
                                  aria-hidden
                                />
                              ) : (
                                <span
                                  className="size-4 rounded-full border border-border"
                                  aria-hidden
                                />
                              )}
                              {title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {done}/{items.length}
                            </span>
                          </li>
                        )
                      })}
                  </ul>
                </div>
                <div className="border-t border-border p-4 sm:p-5">
                  <h3 className="text-base font-semibold">Обзор недели</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Сдано работ:{' '}
                    {data.progress
                      .filter((d) => weekDays.includes(d.date))
                      .reduce((n, d) => n + d.completedAttempts, 0)}
                    . Разборы и правки учитываются отдельно.
                  </p>
                  <LearningEventSummary
                    dates={weekDays}
                    progress={data.progress}
                    compact
                  />
                  {currentWeek &&
                  !(
                    currentWeek.mockOffer.status === 'SCHEDULED' &&
                    currentWeek.mockOffer.scheduledDate === activeWeekDay?.date
                  ) ? (
                    <MockOffer
                      key={currentWeek.week}
                      week={currentWeek}
                      data={data}
                      readonly={
                        currentWeek.endDate < data.today || examReadOnly
                      }
                      pending={pending}
                      run={run}
                    />
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs leading-5 text-muted-foreground">
                  Будущие недели подстраиваются под ваши результаты
                </p>
                {plan.weeks
                  .filter(
                    (w) =>
                      w.startDate >= periodStart && w.startDate <= periodEnd,
                  )
                  .map((w) => {
                    const items = plan.days
                      .filter((d) => d.week === w.week)
                      .flatMap((d) => d.assignments)
                    const done = items.filter(
                      (a) => a.status === 'COMPLETED',
                    ).length
                    const now =
                      w.startDate <= data.today && w.endDate >= data.today
                    return (
                      <article
                        key={w.week}
                        className={cn(
                          'grid gap-3 rounded-2xl border p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-center sm:p-5',
                          now ? 'border-primary/40 bg-card' : 'border-border',
                          w.endDate < data.today && 'bg-card',
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="font-semibold">
                              {w.week > 4
                                ? 'Итоговые проверки и обзор'
                                : `Неделя ${w.week}`}{' '}
                              · {formatCalendar(w.startDate)}–
                              {formatCalendar(w.endDate)}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {now
                                ? 'Сейчас'
                                : w.preliminary
                                  ? 'Предварительно'
                                  : 'Итог'}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 leading-5">
                            {focusText(w.goal)}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {items
                              .filter((a) => a.kind === 'CHECKPOINT')
                              .map((a) => `Контрольная точка: ${a.title}`)
                              .join(' · ') ||
                              (w.preliminary
                                ? ''
                                : 'Контрольная точка уточнится по результатам.')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {done}/{items.length} заданий
                          </p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${(done / (items.length || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          className={`${actionClass} -ml-3 justify-self-start`}
                        >
                          <Link
                            to="/plan"
                            search={{ view: 'week', date: w.startDate }}
                          >
                            Открыть неделю
                            <ArrowRight2 size={16} aria-hidden />
                          </Link>
                        </Button>
                      </article>
                    )
                  })}
                {!plan.weeks.some(
                  (w) => w.startDate >= periodStart && w.startDate <= periodEnd,
                ) ? (
                  <p className="p-5 text-muted-foreground">
                    Этот цикл вне текущего плана.
                  </p>
                ) : null}
              </>
            )}
          </section>
        </>
      )}
      <section
        className={`${planCard} flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5`}
        aria-label="Работа над ошибками"
      >
        <p className="font-medium">
          {correctionCount ? correctionSummary : 'Разборы и правки ваших работ'}
        </p>
        <Button asChild variant="outline" className={actionClass}>
          <Link to="/plan/learning">
            {correctionCount ? 'Исправить' : 'Открыть'}
          </Link>
        </Button>
      </section>
      <Disclosure
        title="Как составлен план"
        id="plan-history"
        open={reviewed}
        onToggle={(e) => setReviewed(e.currentTarget.open)}
        className="text-xs text-muted-foreground"
      >
        <section aria-label="Версии плана" className="space-y-3 pb-4">
          <p>
            Версия плана {revision} · Календарь: {data.timezone}. Сегодня{' '}
            {formatCalendar(data.today)}.
          </p>
          <p>
            Нагрузка ограничена вашим временем. Пропущенные минуты не
            добавляются как долг.
          </p>
          <h3 className="font-semibold">История версий и изменения</h3>
          <ul className="space-y-2">
            {meaningfulChanges.map((c, i) => (
              <li key={i}>
                {c.date ? `${formatCalendar(c.date)} · ` : ''}
                {c.description}
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            disabled={pending || expired || examReadOnly}
            onClick={() =>
              void run(() => replanStudy(revision), 'replan').then((r) => {
                if (r)
                  setNotice(
                    'План обновлён под оставшееся время. Пропущенные минуты не добавляются как долг.',
                  )
              })
            }
          >
            Перепланировать оставшееся
          </Button>
        </section>
        <section className="mb-4" aria-label="Что изменить">
          <h3 className="text-base font-semibold">Что изменить</h3>
          {data.recommendations.slice(0, 3).map((r) => (
            <div key={r.id} className="border-b border-border py-3">
              <p className="font-medium text-foreground">{r.title}</p>
              <p className="mt-1 leading-5">{r.reason}</p>
              <div className="flex flex-wrap gap-4">
                {r.attemptId ? (
                  <Link
                    to="/attempts/$attemptId"
                    params={{ attemptId: r.attemptId }}
                    className="inline-flex min-h-11 items-center gap-1 text-primary hover:underline"
                  >
                    Исходная работа
                    <ArrowRight2 size={14} aria-hidden />
                  </Link>
                ) : null}
                <TargetLink
                  target={r.target}
                  className="gap-1 text-primary hover:underline"
                >
                  Открыть рекомендацию
                  <ArrowRight2 size={14} aria-hidden />
                </TargetLink>
              </div>
            </div>
          ))}
          {!data.recommendations.length ? (
            <p className="py-3">Пока нет рекомендаций по новым работам.</p>
          ) : null}
          <Button asChild variant="ghost">
            <Link to="/mistakes">
              Банк ошибок
              <ArrowRight2 size={16} aria-hidden />
            </Link>
          </Button>
        </section>
        <div className="grid gap-4">
          <EvidenceSection data={data} />
        </div>
      </Disclosure>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogTitle>Настройки нагрузки</DialogTitle>
          <DialogDescription>
            Выберите подходящий ритм занятий.
          </DialogDescription>
          <SettingsForm
            key={`${revision}-${settingsOpen}`}
            settings={data.settings}
            pending={pending || examReadOnly}
            examDate={examDate}
            minDate={data.today}
            onExamDateChange={setExamDate}
            onCancel={() => setSettingsOpen(false)}
            onSave={(settings) =>
              void run(async () => {
                if (examDate !== (data.goal.examDate ?? '')) {
                  if (
                    data.goal.targetBand === null ||
                    (data.goal.examType !== 'academic' &&
                      data.goal.examType !== 'general')
                  )
                    throw new Error(
                      'Сначала задайте целевой балл и формат IELTS в настройках профиля.',
                    )
                  const updated = await updateGoal({
                    targetBand: data.goal.targetBand,
                    examType: data.goal.examType,
                    examDate,
                  })
                  authStore.updateUser(updated)
                  queryClient.setQueryData(queryKeys.profile, updated)
                }
                return updateStudySettings(settings, revision)
              }).then((result) => {
                if (result) setSettingsOpen(false)
              })
            }
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(skip)}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setSkip(null)
        }}
      >
        <DialogContent>
          <DialogTitle>Пропустить задание</DialogTitle>
          <DialogDescription>
            {skip?.title}. Нагрузка на другие дни не удвоится. Выполненное вне
            приложения не становится оценённой работой.
          </DialogDescription>
          <fieldset className="grid gap-1">
            <legend className="mb-2 text-sm font-medium">Причина</legend>
            {Object.entries(skipReasons).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-11 items-center gap-3 text-sm"
              >
                <input
                  type="radio"
                  name="skip-reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value as SkipReason)}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <p className="text-xs leading-5 text-muted-foreground">
            После пропуска можно явно перепланировать оставшееся время.
          </p>
          <Button
            className={actionClass}
            disabled={pending}
            onClick={() => {
              if (skip)
                void run(() => skipAssignment(skip.id, reason, revision)).then(
                  (r) => {
                    if (r) setSkip(null)
                  },
                )
            }}
          >
            {mutation.isPending ? 'Сохраняем…' : 'Подтвердить пропуск'}
          </Button>
          {error ? (
            <p role="alert" className="text-sm text-[#e23b3b]">
              {error}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
