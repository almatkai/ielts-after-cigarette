import {
  Activity,
  Chart,
  DocumentDownload,
  Eye,
  Global,
  People,
  Profile2User,
  Refresh,
  Warning2,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  analyticsDatasets,
  analyticsQueryKeys,
  exportAnalyticsDataset,
  getAnalyticsOverview,
  getAnalyticsRealtime,
} from '@/features/analytics/api'
import { ApiError } from '@/lib/api/client'

import {
  ActivityHeatmap,
  BarList,
  LineChart,
  formatDay,
  formatNumber,
  rampColor,
} from './charts'

import type {
  AnalyticsDataset,
  AnalyticsDays,
  AnalyticsOverview,
  AnalyticsRealtime,
} from '@/features/analytics/api'

const periods: { value: AnalyticsDays; label: string }[] = [
  { value: 7, label: '7 дней' },
  { value: 30, label: '30 дней' },
  { value: 90, label: '90 дней' },
  { value: 180, label: '180 дней' },
]

const skillLabels: Record<string, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

const funnelLabels: Record<string, string> = {
  waitlist: 'Заявки в waitlist',
  registered: 'Регистрации',
  started_attempt: 'Начали хотя бы один тест',
  submitted_attempt: 'Завершили хотя бы один тест',
  started_full_mock: 'Начали Full Mock',
}

const percent = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—'

function duration(seconds: number | null) {
  if (seconds === null) return '—'
  const minutes = Math.round(seconds / 60)
  return minutes < 60
    ? `${minutes} мин`
    : `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`
}

export function AnalyticsPage() {
  const [days, setDays] = useState<AnalyticsDays>(30)
  const overviewQuery = useQuery({
    queryKey: analyticsQueryKeys.overview(days),
    queryFn: ({ signal }) => getAnalyticsOverview(days, signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
  const realtimeQuery = useQuery({
    queryKey: analyticsQueryKeys.realtime,
    queryFn: ({ signal }) => getAnalyticsRealtime(signal),
    refetchInterval: 10_000,
  })

  const refresh = () => {
    void overviewQuery.refetch()
    void realtimeQuery.refetch()
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-[#3b82f6] uppercase">
            Аналитика
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Пульс платформы
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#69696d]">
            {overviewQuery.data
              ? `Обновлено ${new Date(overviewQuery.data.generatedAt).toLocaleTimeString('ru-RU')} · дни считаются по ${overviewQuery.data.timeZone}`
              : 'Регистрации, онлайн, активность и удержание.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Период"
            className="h-9 rounded-[10px] border border-[#deded9] bg-white px-3 text-sm"
            value={days}
            onChange={(event) =>
              setDays(Number(event.target.value) as AnalyticsDays)
            }
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            disabled={overviewQuery.isFetching}
            onClick={refresh}
          >
            <Refresh
              className={overviewQuery.isFetching ? 'animate-spin' : undefined}
              aria-hidden
            />
            Обновить
          </Button>
        </div>
      </div>

      <LivePanel
        realtime={realtimeQuery.data}
        isError={realtimeQuery.isError}
      />

      {overviewQuery.isPending ? (
        <Panel>
          <p className="p-8 text-center text-sm text-[#69696d]">
            Считаем метрики…
          </p>
        </Panel>
      ) : overviewQuery.isError ? (
        <Panel>
          <div className="flex flex-col items-center p-8 text-center">
            <Warning2 className="size-6 text-[#e23b3b]" aria-hidden />
            <p className="mt-3 text-sm">
              {overviewQuery.error instanceof ApiError &&
              overviewQuery.error.status === 403
                ? 'Нет доступа: аналитика доступна только администраторам (роль ADMIN).'
                : 'Не удалось загрузить аналитику.'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void overviewQuery.refetch()}
            >
              Повторить
            </Button>
          </div>
        </Panel>
      ) : (
        <OverviewContent
          overview={overviewQuery.data}
          realtime={realtimeQuery.data}
        />
      )}
    </div>
  )
}

function Panel({
  title,
  icon,
  action,
  children,
  className,
}: {
  title?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card
      className={`gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none ${className ?? ''}`}
    >
      {title ? (
        <CardHeader className="border-b border-[#ededeb] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {icon ? (
                <span className="grid size-9 place-items-center rounded-[9px] bg-[#eff6ff] text-[#3b82f6]">
                  {icon}
                </span>
              ) : null}
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            {action}
          </div>
        </CardHeader>
      ) : null}
      <CardContent className={title ? 'p-5' : 'p-0'}>{children}</CardContent>
    </Card>
  )
}

function StatTile({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-[16px] border border-[#e7e7e4] bg-white p-5">
      <p className="text-sm text-[#69696d]">{label}</p>
      <p className="mt-2 text-[28px] leading-none font-semibold tracking-[-0.03em]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs leading-5 text-[#898781]">{detail}</p>
      ) : null}
    </div>
  )
}

function LivePanel({
  realtime,
  isError,
}: {
  realtime: AnalyticsRealtime | undefined
  isError: boolean
}) {
  const unavailable = isError || (realtime && !realtime.available)
  return (
    <div className="grid gap-4 rounded-[16px] border border-[#e7e7e4] bg-white p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="flex flex-col justify-between gap-5">
        <div className="flex items-center gap-2 text-sm text-[#69696d]">
          <span className="relative flex size-2.5">
            {!unavailable && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#0ca30c] opacity-60" />
            )}
            <span
              className={`relative inline-flex size-2.5 rounded-full ${unavailable ? 'bg-[#c3c2b7]' : 'bg-[#0ca30c]'}`}
            />
          </span>
          {unavailable
            ? 'Онлайн-статистика недоступна (Redis)'
            : `Сейчас на сайте · активность за последние ${Math.round((realtime?.windowSeconds ?? 120) / 60)} мин`}
        </div>
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <div>
            <p className="text-[56px] leading-none font-semibold tracking-[-0.04em]">
              {realtime ? formatNumber(realtime.onlineVisitors) : '—'}
            </p>
            <p className="mt-2 text-sm text-[#69696d]">посетителей онлайн</p>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-sm">
            <LiveFigure label="вошли в аккаунт" value={realtime?.onlineUsers} />
            <LiveFigure
              label="уникальных сегодня"
              value={realtime?.visitorsToday}
            />
            <LiveFigure
              label="просмотров сегодня"
              value={realtime?.pageViewsToday}
            />
          </dl>
        </div>
      </div>
      <div className="rounded-[12px] bg-[#f7f7f5] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#69696d] uppercase">
          <Eye className="size-4" aria-hidden />
          Где сейчас пользователи
        </p>
        {realtime && realtime.activePages.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {realtime.activePages.slice(0, 6).map((page) => (
              <li
                key={page.path}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate font-mono text-xs text-[#111]">
                  {page.path}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatNumber(page.count)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#898781]">
            Сейчас никто не открыл сайт.
          </p>
        )}
      </div>
    </div>
  )
}

function LiveFigure({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-xl font-semibold">
        {value === undefined ? '—' : formatNumber(value)}
      </dd>
      <dd className="mt-1 text-xs text-[#898781]">{label}</dd>
    </div>
  )
}

function OverviewContent({
  overview,
  realtime,
}: {
  overview: AnalyticsOverview
  realtime: AnalyticsRealtime | undefined
}) {
  const { totals, daily } = overview
  const dayLabels = daily.map((point) => point.day)
  const registeredInPeriod = daily.reduce((sum, p) => sum + p.registrations, 0)
  const waitlistInPeriod = daily.reduce((sum, p) => sum + p.waitlistJoins, 0)
  const registeredStep =
    overview.funnel.find((step) => step.step === 'registered')?.users ?? 0

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Зарегистрировано"
          value={formatNumber(totals.registeredUsers)}
          detail={`+${formatNumber(totals.registeredToday)} сегодня · +${formatNumber(totals.registered7d)} за 7 дней · +${formatNumber(totals.registered30d)} за 30`}
        />
        <StatTile
          label="Ждут в waitlist"
          value={formatNumber(totals.waitlistPending)}
          detail={`+${formatNumber(totals.waitlistToday)} сегодня · +${formatNumber(totals.waitlist7d)} за 7 дней`}
        />
        <StatTile
          label="Конверсия waitlist → аккаунт"
          value={percent(totals.waitlistConverted, totals.waitlistLeads)}
          detail={`${formatNumber(totals.waitlistConverted)} из ${formatNumber(totals.waitlistLeads)} заявок зарегистрировались`}
        />
        <StatTile
          label="DAU / WAU / MAU"
          value={`${formatNumber(totals.dau)} / ${formatNumber(totals.wau)} / ${formatNumber(totals.mau)}`}
          detail={`Stickiness DAU/MAU: ${percent(totals.dau, totals.mau)}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Попыток сегодня"
          value={formatNumber(totals.attemptsToday)}
          detail={`${formatNumber(totals.submittedToday)} отправлено на проверку`}
        />
        <StatTile
          label={`Full Mock за ${overview.days} дн.`}
          value={formatNumber(totals.fullMocksStarted)}
          detail={`${formatNumber(totals.fullMocksSubmitted)} завершено · ${percent(totals.fullMocksSubmitted, totals.fullMocksStarted)}`}
        />
        <StatTile
          label={`Регистрации за ${overview.days} дн.`}
          value={formatNumber(registeredInPeriod)}
          detail={`и ${formatNumber(waitlistInPeriod)} новых заявок в waitlist`}
        />
        <StatTile
          label="Уникальных посетителей сегодня"
          value={realtime ? formatNumber(realtime.visitorsToday) : '—'}
          detail="Оценка HyperLogLog, точность ±1%"
        />
      </div>

      <Panel
        title="Регистрации и заявки по дням"
        icon={<Profile2User className="size-[18px]" aria-hidden />}
      >
        <LineChart
          days={dayLabels}
          series={[
            {
              label: 'Регистрации',
              values: daily.map((p) => p.registrations),
            },
            {
              label: 'Заявки в waitlist',
              values: daily.map((p) => p.waitlistJoins),
            },
          ]}
        />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Аудитория"
          icon={<People className="size-[18px]" aria-hidden />}
        >
          <LineChart
            days={dayLabels}
            series={[
              {
                label: 'Активные пользователи (DAU)',
                values: daily.map((p) => p.activeUsers),
              },
              {
                label: 'Уникальные посетители',
                values: daily.map((p) => p.visitors),
              },
            ]}
          />
        </Panel>
        <Panel
          title="Попытки тестов"
          icon={<Activity className="size-[18px]" aria-hidden />}
        >
          <LineChart
            days={dayLabels}
            series={[
              { label: 'Начато', values: daily.map((p) => p.attempts) },
              { label: 'Отправлено', values: daily.map((p) => p.submitted) },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel
          title="Навыки"
          icon={<Chart className="size-[18px]" aria-hidden />}
        >
          {overview.skills.length === 0 ? (
            <p className="text-sm text-[#69696d]">Попыток за период нет.</p>
          ) : (
            <div className="-mx-5 -mb-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ededeb] text-xs text-[#69696d]">
                    {[
                      'Навык',
                      'Начато',
                      'Завершено',
                      'Брошено',
                      'Студ.',
                      'Band',
                      'Время, медиана',
                    ].map((title) => (
                      <th
                        key={title}
                        className="px-4 py-3 font-medium whitespace-nowrap"
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {overview.skills.map((skill) => (
                    <tr
                      key={skill.skill}
                      className="border-b border-[#f0f0ed] last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {skillLabels[skill.skill] ?? skill.skill}
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(skill.started)}
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(skill.submitted)}
                        <span className="ml-1.5 text-xs text-[#898781]">
                          {percent(skill.submitted, skill.started)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(skill.abandoned)}
                      </td>
                      <td className="px-4 py-3">{formatNumber(skill.users)}</td>
                      <td className="px-4 py-3 font-semibold">
                        {skill.averageBand?.toFixed(1) ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {duration(skill.medianDurationSec)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel
          title={`Воронка за ${overview.days} дн.`}
          icon={<Activity className="size-[18px]" aria-hidden />}
        >
          <BarList
            rows={overview.funnel.map((step) => ({
              label: funnelLabels[step.step] ?? step.step,
              value: step.users,
            }))}
            suffix={(row, index) =>
              index > 1 ? `${percent(row.value, registeredStep)} от рег.` : null
            }
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel
          title="Когда занимаются студенты"
          icon={<Chart className="size-[18px]" aria-hidden />}
        >
          <ActivityHeatmap cells={overview.heatmap} />
        </Panel>
        <Panel
          title="Источники новых пользователей"
          icon={<Global className="size-[18px]" aria-hidden />}
        >
          {overview.sources.length === 0 ? (
            <p className="text-sm text-[#69696d]">
              Новых пользователей за период нет.
            </p>
          ) : (
            <BarList
              rows={overview.sources.map((source) => ({
                label:
                  source.source === 'direct' ? 'Прямой заход' : source.source,
                value: source.users,
              }))}
            />
          )}
        </Panel>
      </div>

      <Panel
        title="Удержание по недельным когортам"
        icon={<People className="size-[18px]" aria-hidden />}
      >
        <CohortTable cohorts={overview.cohorts} />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Популярные страницы сегодня"
          icon={<Eye className="size-[18px]" aria-hidden />}
        >
          {realtime && realtime.topPagesToday.length > 0 ? (
            <BarList
              rows={realtime.topPagesToday.map((page) => ({
                label: page.path,
                value: page.count,
              }))}
            />
          ) : (
            <p className="text-sm text-[#69696d]">Просмотров сегодня нет.</p>
          )}
        </Panel>
        <ExportPanel />
      </div>
    </>
  )
}

function CohortTable({ cohorts }: { cohorts: AnalyticsOverview['cohorts'] }) {
  if (cohorts.length === 0) {
    return (
      <p className="text-sm text-[#69696d]">
        За последние 8 недель регистраций нет.
      </p>
    )
  }
  const weeks = cohorts[0].retained.length
  return (
    <div className="grid gap-3">
      <p className="text-sm leading-6 text-[#69696d]">
        Доля пользователей, вернувшихся на N-й неделе после регистрации. День
        регистрации не считается возвратом.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-[2px] text-sm tabular-nums">
          <thead>
            <tr className="text-xs text-[#69696d]">
              <th className="px-2 py-2 text-left font-medium">Неделя</th>
              <th className="px-2 py-2 text-right font-medium">Пользователи</th>
              {Array.from({ length: weeks }, (_, i) => (
                <th key={i} className="px-2 py-2 text-center font-medium">
                  Н{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort) => {
              const cohortStart = new Date(`${cohort.week}T00:00:00`)
              const elapsedWeeks = Math.floor(
                (Date.now() - cohortStart.getTime()) / (7 * 86_400_000),
              )
              return (
                <tr key={cohort.week}>
                  <td className="px-2 py-2 whitespace-nowrap">
                    с {formatDay(cohort.week)}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">
                    {formatNumber(cohort.size)}
                  </td>
                  {cohort.retained.map((users, i) => {
                    if (i >= elapsedWeeks)
                      return <td key={i} className="rounded-[6px]" />
                    const share = cohort.size > 0 ? users / cohort.size : 0
                    const background = rampColor(share, 1)
                    const dark = share >= 3 / 7
                    return (
                      <td
                        key={i}
                        className="rounded-[6px] px-2 py-2 text-center text-xs"
                        style={{
                          background,
                          color: dark ? '#fff' : '#111',
                        }}
                        title={`${formatNumber(users)} из ${formatNumber(cohort.size)}`}
                      >
                        {Math.round(share * 100)}%
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExportPanel() {
  const [days, setDays] = useState<AnalyticsDays | null>(null)
  const [pending, setPending] = useState<AnalyticsDataset | null>(null)
  const [error, setError] = useState('')

  const download = async (dataset: AnalyticsDataset) => {
    setPending(dataset)
    setError('')
    try {
      const blob = await exportAnalyticsDataset(dataset, days)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `iac-${dataset}-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Не удалось выгрузить данные. Попробуйте ещё раз.')
    } finally {
      setPending(null)
    }
  }

  return (
    <Panel
      title="Выгрузка для анализа"
      icon={<DocumentDownload className="size-[18px]" aria-hidden />}
      action={
        <select
          aria-label="Период выгрузки"
          className="h-8 rounded-[8px] border border-[#deded9] bg-white px-2 text-xs"
          value={days ?? ''}
          onChange={(event) =>
            setDays(
              event.target.value
                ? (Number(event.target.value) as AnalyticsDays)
                : null,
            )
          }
        >
          <option value="">Всё время</option>
          {periods.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      }
    >
      <p className="text-sm leading-6 text-[#69696d]">
        CSV напрямую из PostgreSQL (COPY) — готово для pandas, DuckDB,
        ClickHouse или BigQuery. Только идентификаторы и факты: без имён, email
        и телефонов.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {analyticsDatasets.map((dataset) => (
          <Button
            key={dataset.id}
            type="button"
            variant="outline"
            className="justify-start"
            disabled={pending !== null}
            onClick={() => void download(dataset.id)}
          >
            <DocumentDownload aria-hidden />
            {pending === dataset.id ? 'Готовим…' : dataset.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[#c92f2f]">
          {error}
        </p>
      ) : null}
    </Panel>
  )
}
