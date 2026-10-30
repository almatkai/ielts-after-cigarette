import { useState } from 'react'
import { ArrowRight2, Clock, TickCircle, Forbidden } from 'iconsax-react'
import { Link } from '@tanstack/react-router'
import { Disclosure } from '@/components/ui/disclosure'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/features/attempts/attempt-ui'
import { useAuth } from '@/features/auth/auth-store'
import { formatCalendar, studyTarget } from './calendar'
import { studyError, useStudyPlan } from './queries'
import type { StudyEvidence, StudyResponse } from './api'
import { LearningEntry, LearningLoad } from './learning-ui'
import { useLearning } from './learning-queries'
import { evidenceSource, qualifiedBand } from './evidence'

export const planCard =
  'min-w-0 rounded-[16px] border border-border bg-card text-sm text-foreground overflow-hidden shadow-[0_10px_36px_rgba(17,17,17,0.035)]'
export const skillLabels = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}
export const assignmentStatus = {
  PLANNED: 'Запланировано',
  IN_PROGRESS: 'В процессе',
  AWAITING_RESULT: 'Работа сохранена и ожидает проверки',
  COMPLETED: 'Завершено',
  SKIPPED: 'Пропущено',
  MISSED: 'Пропущен день',
  BLOCKED: 'Материал недоступен',
}
export function TargetLink({
  target,
  children,
  className,
}: {
  target: string
  children: React.ReactNode
  className?: string
}) {
  const to = studyTarget(target)
  return to ? (
    <Link
      to={to}
      className={`inline-flex min-h-11 items-center ${className ?? ''}`}
    >
      {children}
    </Link>
  ) : (
    <span>{children}</span>
  )
}
function EvidenceRow({
  item,
  timezone,
}: {
  item: StudyEvidence
  timezone: string
}) {
  const pending = /pending|processing|awaiting/i.test(item.status)
  const stale = /stale/i.test(item.status)
  const date = item.assessedAt
    ? new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        timeZone: timezone,
      }).format(new Date(item.assessedAt))
    : null
  const objective = item.skill === 'reading' || item.skill === 'listening'
  return (
    <div
      className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[120px_1fr_auto]"
      data-testid={`evidence-${item.skill}`}
    >
      <h3 className="font-semibold">{skillLabels[item.skill]}</h3>
      <div className="col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1">
        <p className="text-lg font-semibold tabular-nums">
          {pending ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
              <Clock className="size-4" aria-hidden />
              Ожидает проверки
            </span>
          ) : !item.attemptId &&
            item.sampleCount === 0 &&
            item.score === null ? (
            <span className="text-sm font-normal text-muted-foreground">
              Пока нет работ
            </span>
          ) : objective && item.score !== null && item.maxScore !== null ? (
            <>
              <span className="sr-only">Результат: </span>
              {item.score}/{item.maxScore}
            </>
          ) : (
            <span className="text-sm font-medium">Учебный разбор</span>
          )}
        </p>
        {item.attemptId || item.sampleCount > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {item.sampleCount}{' '}
            {new Intl.PluralRules('ru-RU').select(item.sampleCount) === 'one'
              ? 'работа'
              : new Intl.PluralRules('ru-RU').select(item.sampleCount) === 'few'
                ? 'работы'
                : 'работ'}
            {date ? ` · ${date}` : ''}
          </p>
        ) : null}
        {stale ? (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Данные устарели. Обновите результат {skillLabels[item.skill]}.
          </p>
        ) : null}
        {/conflict|discrepan/i.test(item.status) ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Последние результаты различаются. Нужна ещё одна новая проверка.
          </p>
        ) : null}
      </div>
      <Button
        asChild
        variant={item.attemptId ? 'ghost' : 'outline'}
        className="col-start-2 row-span-2 row-start-1 min-h-11 sm:col-start-3 sm:row-span-1"
        aria-label={`${item.attemptId ? 'Открыть' : 'Начать'} ${skillLabels[item.skill]}`}
      >
        {item.attemptId ? (
          <Link
            to="/attempts/$attemptId"
            params={{ attemptId: item.attemptId }}
          >
            Открыть
            <ArrowRight2 aria-hidden />
          </Link>
        ) : (
          <Link to={`/${item.skill}`}>Начать</Link>
        )}
      </Button>
    </div>
  )
}
export function EvidenceSection({ data }: { data: StudyResponse }) {
  const covered = Object.keys(skillLabels).filter((skill) =>
    data.evidence.some((e) => e.skill === skill && qualifiedBand(e) !== null),
  ).length
  return (
    <>
      <section
        aria-label="Ориентировочный балл"
        className={`${planCard} flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6`}
      >
        <p className="max-w-[65ch] text-sm">
          <span className="font-semibold">Ориентировочный балл: </span>
          {covered === 4 && data.overallBand !== null
            ? data.overallBand.toFixed(1)
            : `появится, когда будут проверены все 4 навыка (${covered}/4)`}
        </p>
        <div className="flex items-center gap-2">
          <div
            role="progressbar"
            aria-label="Проверенные навыки"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={covered}
            className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${covered * 25}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {covered}/4
          </span>
        </div>
      </section>
      <section
        className={`${planCard} p-4 sm:p-6`}
        aria-label="Учебные результаты"
      >
        <h2 className="text-base font-semibold">Навыки</h2>
        <div className="mt-1 divide-y divide-border">
          {Object.keys(skillLabels).map((skill) => {
            const item = data.evidence.find((e) => e.skill === skill) ?? {
              skill: skill as StudyEvidence['skill'],
              band: null,
              practiceBand: null,
              status: 'missing',
              attemptId: null,
              assessedAt: null,
              sampleCount: 0,
              score: null,
              maxScore: null,
              source: 'missing',
              limitations: [],
            }
            return (
              <EvidenceRow key={skill} item={item} timezone={data.timezone} />
            )
          })}
        </div>
        <Disclosure
          title="Как мы считаем"
          className="mt-2 border-t border-border text-xs leading-5 text-muted-foreground"
        >
          <p>
            График показывает количество выполненных заданий текущего плана. Для
            дней за его пределами считаются сохранённые работы, просмотренные
            разборы и завершённые тренировки. Активные минуты отображаются
            отдельно, только если они измерялись.
          </p>
          <p className="mt-2">
            Проверены {covered} из 4 компонентов.{' '}
            {covered < 4
              ? 'Общий балл пока не рассчитан.'
              : 'Ориентировочный балл основан на подтверждённых оценках.'}
          </p>
          <div className="divide-y divide-border">
            {data.evidence.map((item) => (
              <div key={item.skill} className="py-3">
                <p className="font-medium text-foreground">
                  {skillLabels[item.skill]} · {evidenceSource(item.source)}
                </p>
              </div>
            ))}
          </div>
          <ul className="list-disc pb-3 pl-4">
            {[
              ...new Set([
                ...data.evidence.flatMap((item) => item.limitations),
                ...data.limitations,
              ]),
            ].map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <div className="grid gap-2 pb-3">
            {Object.entries(skillLabels).map(([skill, label]) => {
              const item = data.evidence.find((e) => e.skill === skill)
              const band = item ? qualifiedBand(item) : null
              return (
                <p key={skill} className="flex justify-between gap-3">
                  <span>{label}</span>
                  <span>
                    {band === null
                      ? 'Нет подтверждённой оценки'
                      : band.toFixed(1)}
                  </span>
                </p>
              )
            })}
          </div>
        </Disclosure>
      </section>
    </>
  )
}
export function StudyLoadError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <div className={`${planCard} p-4`} role="alert">
      <p>{studyError(error)}</p>
      <Button variant="outline" className="mt-3" onClick={retry}>
        Повторить загрузку плана
      </Button>
    </div>
  )
}
export function TodayPlanSummary() {
  const query = useStudyPlan()
  if (query.isPending)
    return <LoadingState label="Загружаем план на сегодня…" />
  if (query.isError)
    return (
      <StudyLoadError error={query.error} retry={() => void query.refetch()} />
    )
  const data = query.data
  const day = data.plan?.days.find((d) => d.date === data.today)
  return (
    <section className={`${planCard} p-4 sm:p-5`} aria-label="План на сегодня">
      <h2 className="text-base font-semibold">План на сегодня</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatCalendar(data.today, true)} · {data.timezone}
      </p>
      {day ? (
        <>
          <div className="mt-3 divide-y divide-border">
            {day.assignments.map((a) => (
              <div key={a.id} className="py-3">
                <p className="font-medium">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.durationMinutes} мин · {skillLabels[a.skill]}
                </p>
                <p className="mt-1 text-xs">Почему: {a.reason}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs">
                  {a.status === 'COMPLETED' ? (
                    <TickCircle
                      size={14}
                      className="text-green-600 dark:text-green-400"
                      aria-hidden
                    />
                  ) : a.status === 'BLOCKED' ||
                    a.status === 'MISSED' ||
                    a.status === 'SKIPPED' ? (
                    <Forbidden
                      size={14}
                      className="text-muted-foreground"
                      aria-hidden
                    />
                  ) : (
                    <Clock
                      size={14}
                      className="text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  {a.kind === 'REVIEW' && a.status === 'COMPLETED'
                    ? 'Разбор просмотрен'
                    : assignmentStatus[a.status]}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {day.isRest
              ? 'Отдых'
              : `Запланировано ${day.plannedMinutes} из ${day.budgetMinutes} мин`}
          </p>
        </>
      ) : (
        <p className="my-4 text-muted-foreground">
          {data.plan
            ? 'Цикл завершён. Откройте план для обзора.'
            : 'Выберите дни и время для первого плана.'}
        </p>
      )}
      <LearningEntry />
      <Button asChild variant="outline" className="mt-4 w-full">
        <Link to="/plan" search={{ view: 'day', date: data.today }}>
          {day?.assignments.some(
            (a) => a.status === 'PLANNED' || a.status === 'IN_PROGRESS',
          )
            ? 'Перейти к следующему заданию'
            : data.plan
              ? 'Открыть план'
              : 'Создать план'}
        </Link>
      </Button>
    </section>
  )
}
export function StudyProgress({ activity = false }: { activity?: boolean }) {
  const { user } = useAuth()
  const query = useStudyPlan()
  const learning = useLearning()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  if (!user) return null
  if (query.isPending)
    return <LoadingState label="Загружаем свидетельства прогресса…" />
  if (query.isError)
    return (
      <StudyLoadError error={query.error} retry={() => void query.refetch()} />
    )
  const data = query.data
  const dateBefore = (offset: number) => {
    const date = new Date(`${data.today}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() - offset)
    return date.toISOString().slice(0, 10)
  }
  const rows = Array.from({ length: 14 }, (_, i) => {
    const date = dateBefore(13 - i)
    const result = data.progress.find((d) => d.date === date)
    const day = data.plan?.days.find((d) => d.date === date)
    return {
      date,
      result,
      day,
      planned: day?.assignments.length ?? null,
      actual: day
        ? day.assignments.filter(
            (assignment) => assignment.status === 'COMPLETED',
          ).length
        : result
          ? result.completedAttempts +
            result.reviewedAssignments +
            (result.drillsCompleted ?? 0)
          : null,
      minutes: result?.activeMinutes ?? null,
    }
  })
  const hasActivity = (day: StudyResponse['progress'][number] | undefined) =>
    !!day &&
    (day.completedAttempts > 0 ||
      day.reviewedAssignments > 0 ||
      (day.drillsCompleted ?? 0) > 0 ||
      (day.correctionsSaved ?? 0) > 0 ||
      (day.independentChecksPassed ?? 0) > 0 ||
      (day.activeMinutes ?? 0) > 0)
  let streak = 0
  // A day in progress does not break yesterday's run.
  const firstOffset = hasActivity(
    data.progress.find((d) => d.date === data.today),
  )
    ? 0
    : 1
  while (
    hasActivity(
      data.progress.find((d) => d.date === dateBefore(firstOffset + streak)),
    )
  )
    streak++
  const week = rows.slice(-7)
  const measured = week.filter((d) => d.minutes !== null)
  const minutes = measured.reduce((total, d) => total + (d.minutes ?? 0), 0)
  const completed = data.plan?.days
    .flatMap((d) => d.assignments)
    .filter((a) => a.status === 'COMPLETED').length
  const max = Math.max(
    1,
    ...rows.flatMap((d) => [d.planned ?? 0, d.actual ?? 0]),
  )
  const selected =
    rows.find((d) => d.date === selectedDate) ?? rows[rows.length - 1]
  const cycles = learning.data?.cycles ?? []
  const waiting = cycles.filter(
    (c) =>
      !c.skippedAt &&
      (c.status === 'needs-practice' || c.correction?.verdict === 'incorrect'),
  ).length
  const corrected = cycles.filter((c) => !!c.correction).length
  const verified = cycles.filter((c) =>
    c.checks.some((check) => check.independent && check.passed),
  ).length
  const activityText = (row: typeof selected) =>
    `${formatCalendar(row.date)}${row.day?.isRest ? ' · День отдыха' : ''}. Выполнено: ${row.actual ?? 'нет данных'}. Запланировано: ${row.planned ?? 'нет данных'}. Пропущено: ${row.result?.skippedAssignments ?? 0}. Правки: ${row.result?.correctionsSaved ?? 0}. Новые проверки: ${row.result?.independentChecksPassed ?? 0}`

  return (
    <>
      {activity ? (
        <>
          <section
            aria-label="Сводка прогресса"
            className={`${planCard} grid grid-cols-3 divide-x divide-border py-5`}
          >
            {[
              {
                value: streak,
                label: 'Дней подряд',
                note: 'По сохранённой активности',
              },
              {
                value: measured.length
                  ? `${minutes}${measured.length < 7 ? '+' : ''}`
                  : '—',
                label: 'Минут за 7 дней',
                note:
                  measured.length === 7
                    ? 'Измеренное активное время'
                    : `Нет замера за ${7 - measured.length} из 7 дней`,
              },
              {
                value: completed ?? '—',
                label: 'Заданий выполнено',
                note: 'В текущем плане',
              },
            ].map((metric) => (
              <div key={metric.label} className="min-w-0 px-3 sm:px-6">
                <p className="text-[28px] font-semibold leading-9 tabular-nums">
                  {metric.value}
                </p>
                <h2 className="mt-1 text-xs font-medium sm:text-sm">
                  {metric.label}
                </h2>
                <p className="mt-1 text-xs leading-4 text-muted-foreground">
                  {metric.note}
                </p>
              </div>
            ))}
          </section>
          <section
            className={`${planCard} p-4 sm:p-6`}
            aria-label="Активность по дням"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">По дням</h2>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm border border-border bg-muted" />
                  План
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm bg-primary" />
                  Факт
                </span>
              </div>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Последние 14 дней · задания. Выберите день, чтобы увидеть детали.
            </p>
            <div
              className="mt-4 grid grid-cols-14 gap-0.5 sm:gap-1"
              aria-label="Задания: план и факт за 14 дней"
            >
              {rows.map((row, index) => (
                <button
                  key={row.date}
                  type="button"
                  className={`relative flex min-h-40 min-w-0 flex-col rounded-md px-0.5 pt-2 text-[10px] tracking-normal hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-1 sm:text-xs ${row.date === selected.date ? 'bg-muted/70' : ''}`}
                  title={activityText(row)}
                  aria-label={activityText(row)}
                  aria-pressed={row.date === selected.date}
                  onClick={() => setSelectedDate(row.date)}
                  onFocus={() => setSelectedDate(row.date)}
                >
                  <span
                    aria-hidden
                    className="relative flex h-32 w-full items-end justify-center border-b border-border"
                  >
                    <span
                      className="absolute bottom-0 w-full max-w-5 rounded-t-sm bg-border"
                      style={{
                        height: row.planned
                          ? `max(4px, ${(row.planned / max) * 100}%)`
                          : 0,
                      }}
                    />
                    <span
                      className="relative w-full max-w-3 rounded-t-sm bg-primary"
                      data-testid="daily-completed-bar"
                      style={{
                        height: row.actual
                          ? `max(4px, ${(row.actual / max) * 100}%)`
                          : 0,
                      }}
                    />
                  </span>
                  <span
                    aria-hidden
                    className={`mt-2 whitespace-nowrap tabular-nums tracking-normal text-muted-foreground ${index % 2 === 0 ? '' : 'invisible sm:visible'}`}
                  >
                    {row.date.slice(8)}.{row.date.slice(5, 7)}
                  </span>
                </button>
              ))}
            </div>
            <div
              className="mt-4 text-xs text-muted-foreground"
              aria-live="polite"
            >
              <p className="font-medium text-foreground">
                {formatCalendar(selected.date)}
                {selected.day?.isRest ? ' · День отдыха' : ''}
              </p>
              {!selected.day && !selected.result ? (
                <p className="mt-2">Нет сохранённых данных за этот день</p>
              ) : (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                  {[
                    ['Выполнено', selected.actual],
                    ['Пропущено', selected.result?.skippedAssignments ?? 0],
                    ['Правки', selected.result?.correctionsSaved ?? 0],
                    [
                      'Новые проверки',
                      selected.result?.independentChecksPassed ?? 0,
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        </>
      ) : null}
      <EvidenceSection data={data} />
      <section
        className={`${planCard} p-4 sm:p-6`}
        aria-label="Работа над ошибками"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Работа над ошибками</h2>
          <Button asChild variant="ghost" className="min-h-11">
            <Link to="/plan/learning">
              Открыть
              <ArrowRight2 aria-hidden />
            </Link>
          </Button>
        </div>
        {learning.isPending || learning.isError ? (
          <LearningLoad
            pending={learning.isPending}
            error={learning.error}
            retry={() => void learning.refetch()}
            label="Загружаем работу над ошибками…"
          />
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-4">
            {[
              [waiting, 'Ждут правки'],
              [corrected, 'Правок сохранено'],
              [verified, 'Проверено на новых'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-[28px] font-semibold leading-9 tabular-nums">
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      {!activity ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Это учебные результаты, не IELTS band.
        </p>
      ) : null}
    </>
  )
}
