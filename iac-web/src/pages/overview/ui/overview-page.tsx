import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  Dumbbell,
  Gauge,
  Target,
  TriangleAlert,
  UserRound,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getDashboard, queryKeys } from '@/features/ielts/api'

import type { SkillId } from '@/features/ielts/api'

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const quickActions = [
  {
    label: 'Перейти к практике',
    description: 'Выбрать навык и формат задания',
    to: '/dashboard/practice',
    icon: Dumbbell,
  },
  {
    label: 'Разобрать ошибки',
    description: 'Вернуться к сложным заданиям',
    to: '/dashboard/mistakes',
    icon: TriangleAlert,
  },
  {
    label: 'Заполнить профиль',
    description: 'Указать цель и дату экзамена',
    to: '/dashboard/profile',
    icon: UserRound,
  },
] as const

const cardClassName =
  'gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900'

const skillLabels: Record<SkillId, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

function formatExamDate(value: string | null) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

export function OverviewPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
  })

  if (dashboardQuery.isPending) {
    return (
      <div style={interFont} className="mx-auto w-full max-w-[1120px]">
        <Card className={cardClassName}>
          <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Загружаем ваш dashboard…
          </CardContent>
        </Card>
      </div>
    )
  }

  if (dashboardQuery.isError) {
    return (
      <div style={interFont} className="mx-auto w-full max-w-[1120px]">
        <Card className={cardClassName}>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <TriangleAlert
              className="size-6 text-slate-400 dark:text-slate-500"
              aria-hidden
            />
            <p className="mt-3 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Не удалось загрузить dashboard
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Проверьте соединение с сервером и попробуйте ещё раз.
            </p>
            <Button
              type="button"
              className="mt-5 h-11 rounded-lg bg-blue-500 px-6 font-bold text-white shadow-sm hover:bg-blue-600"
              onClick={() => void dashboardQuery.refetch()}
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dashboard = dashboardQuery.data
  const overviewMetrics = [
    {
      label: 'Текущий уровень',
      value:
        dashboard.profile.currentBand === null
          ? '—'
          : dashboard.profile.currentBand.toFixed(1),
      hint:
        dashboard.profile.currentBand === null
          ? 'Появится после диагностики'
          : 'Расчётный IELTS Band',
      icon: Gauge,
    },
    {
      label: 'Целевой балл',
      value:
        dashboard.profile.targetBand === null
          ? '—'
          : dashboard.profile.targetBand.toFixed(1),
      hint:
        dashboard.profile.targetBand === null
          ? 'Укажите цель в профиле'
          : 'Ваша текущая цель',
      icon: Target,
    },
    {
      label: 'Дата экзамена',
      value: formatExamDate(dashboard.profile.examDate),
      hint:
        dashboard.profile.examDate === null
          ? 'Добавьте дату в профиле'
          : 'Запланированная дата',
      icon: CalendarDays,
    },
  ] as const
  const recommendedTarget =
    dashboard.recommendedAction.target === '/dashboard/profile'
      ? '/dashboard/profile'
      : '/dashboard/practice'

  return (
    <div
      style={interFont}
      className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5"
    >
      <section
        className="grid min-w-0 gap-4 sm:grid-cols-3"
        aria-label="Основные показатели"
      >
        {overviewMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.label} className={cardClassName}>
              <CardContent className="flex min-w-0 items-start gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                  <Icon className="size-[19px]" strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    {metric.label}
                  </p>
                  <p
                    className="mt-1.5 text-2xl leading-none font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-slate-100"
                    aria-label={`${metric.label}: ${metric.value}`}
                  >
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400 dark:text-slate-500">
                    {metric.hint}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
          <Card className={cardClassName}>
            <CardContent className="relative overflow-hidden p-6 sm:p-8">
              <div
                className="pointer-events-none absolute top-0 right-0 size-56 translate-x-16 -translate-y-16 rounded-full bg-blue-50 opacity-70 blur-3xl dark:bg-blue-500/10"
                aria-hidden
              />
              <div className="relative max-w-[620px]">
                <Badge className="border border-blue-100 bg-blue-50 text-blue-600 shadow-none hover:bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/10">
                  Рекомендуемый шаг
                </Badge>
                <h2 className="mt-5 text-[clamp(1.65rem,3vw,2.35rem)] leading-[1.08] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {dashboard.recommendedAction.title}
                </h2>
                <p className="mt-3 max-w-[560px] text-sm leading-6 text-slate-500 sm:text-[15px] dark:text-slate-400">
                  {dashboard.recommendedAction.description}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="h-11 rounded-lg bg-blue-500 px-5 font-bold text-white shadow-sm hover:bg-blue-600"
                  >
                    <Link to={recommendedTarget}>
                      Перейти к следующему шагу
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-lg border-slate-300 bg-white px-5 font-bold text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                  >
                    <Link to="/dashboard/profile">Настроить цель</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="border-b border-slate-100 p-5 sm:p-6 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <BarChart3 className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Прогресс по навыкам
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5 text-slate-500 dark:text-slate-400">
                    Общая картина по Listening, Reading, Writing и Speaking.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {dashboard.skillProgress.map((progress) => (
                <div
                  key={progress.skill}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {skillLabels[progress.skill]}
                    </p>
                    <span className="text-sm font-bold text-blue-500 tabular-nums dark:text-blue-400">
                      {progress.estimatedBand === null
                        ? '—'
                        : progress.estimatedBand.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400 tabular-nums dark:text-slate-500">
                    {progress.completedTasks === 0
                      ? 'Нет выполненных заданий'
                      : `${progress.completedTasks} заданий · точность ${progress.accuracyPercent ?? 0}%`}
                  </p>
                </div>
              ))}
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-lg border-slate-300 bg-white px-4 font-bold text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white sm:col-span-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900"
              >
                <Link to="/dashboard/progress">Открыть прогресс</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="grid min-w-0 gap-5 [&>*]:min-w-0">
          <Card className={cardClassName}>
            <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                  <CalendarCheck2 className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    План на сегодня
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5 text-slate-500 dark:text-slate-400">
                    Текущие задачи подготовки.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {dashboard.todayPlan.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-800">
                  <ClipboardCheck
                    className="mx-auto size-5 text-slate-400 dark:text-slate-500"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  <p className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                    Заданий пока нет
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
                    Добавьте первое занятие в план.
                  </p>
                </div>
              ) : (
                <ul className="grid gap-3">
                  {dashboard.todayPlan.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 tabular-nums dark:text-slate-500">
                        {skillLabels[item.skill]} · {item.durationMinutes} мин.
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                asChild
                variant="outline"
                className="mt-4 h-10 w-full rounded-lg border-slate-300 bg-white font-bold text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900"
              >
                <Link to="/dashboard/plan">Настроить план</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
              <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Быстрые действия
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
              {quickActions.map((action) => {
                const Icon = action.icon

                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex min-h-[72px] items-center gap-3 px-5 py-3 text-slate-900 no-underline transition-colors hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-400">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">
                        {action.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-400 dark:text-slate-500">
                        {action.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400"
                      aria-hidden
                    />
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
