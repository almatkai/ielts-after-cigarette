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
  'gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)]'

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
      <Card className={`${cardClassName} mx-auto max-w-[1120px]`}>
        <CardContent className="p-8 text-center text-sm text-[#69696d]">
          Загружаем ваш dashboard…
        </CardContent>
      </Card>
    )
  }

  if (dashboardQuery.isError) {
    return (
      <Card className={`${cardClassName} mx-auto max-w-[1120px]`}>
        <CardContent className="flex flex-col items-center p-8 text-center">
          <TriangleAlert className="size-6 text-[#e23b3b]" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-[#111111]">
            Не удалось загрузить dashboard
          </p>
          <p className="mt-1 text-sm text-[#69696d]">
            Проверьте соединение с сервером и попробуйте ещё раз.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => void dashboardQuery.refetch()}
          >
            Повторить
          </Button>
        </CardContent>
      </Card>
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
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <section
        className="grid min-w-0 gap-4 sm:grid-cols-3"
        aria-label="Основные показатели"
      >
        {overviewMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.label} className={cardClassName}>
              <CardContent className="flex min-w-0 items-start gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#f4f4f1] text-[#69696d]">
                  <Icon className="size-[19px]" strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.03em] text-[#69696d]">
                    {metric.label}
                  </p>
                  <p
                    className="mt-1 text-2xl leading-none font-semibold tracking-[-0.04em] text-[#111111]"
                    aria-label={`${metric.label}: ${metric.value}`}
                  >
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#8b8b8e]">
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
                className="pointer-events-none absolute top-0 right-0 size-56 translate-x-16 -translate-y-16 rounded-full bg-[#eff6ff] opacity-70 blur-3xl"
                aria-hidden
              />
              <div className="relative max-w-[620px]">
                <Badge className="border border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8] shadow-none hover:bg-[#eff6ff]">
                  Рекомендуемый шаг
                </Badge>
                <h2 className="mt-5 text-[clamp(1.65rem,3vw,2.35rem)] leading-[1.08] font-semibold tracking-[-0.045em] text-[#111111]">
                  {dashboard.recommendedAction.title}
                </h2>
                <p className="mt-3 max-w-[560px] text-sm leading-6 text-[#69696d] sm:text-[15px]">
                  {dashboard.recommendedAction.description}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="h-11 rounded-[9px] bg-[#3b82f6] px-5 shadow-none hover:bg-[#2563eb]"
                  >
                    <Link to={recommendedTarget}>
                      Перейти к следующему шагу
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-[9px] border-[#deded9] bg-white px-5 shadow-none"
                  >
                    <Link to="/dashboard/profile">Настроить цель</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="border-b border-[#ededeb] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#f4f4f1] text-[#69696d]">
                  <BarChart3 className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-base tracking-[-0.02em]">
                    Прогресс по навыкам
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5">
                    Общая картина по Listening, Reading, Writing и Speaking.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {dashboard.skillProgress.map((progress) => (
                <div
                  key={progress.skill}
                  className="rounded-[12px] border border-[#ededeb] bg-[#fafaf8] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#111111]">
                      {skillLabels[progress.skill]}
                    </p>
                    <span className="text-sm font-semibold text-[#3b82f6]">
                      {progress.estimatedBand === null
                        ? '—'
                        : progress.estimatedBand.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#808084]">
                    {progress.completedTasks === 0
                      ? 'Нет выполненных заданий'
                      : `${progress.completedTasks} заданий · точность ${progress.accuracyPercent ?? 0}%`}
                  </p>
                </div>
              ))}
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-[9px] border-[#deded9] bg-white px-4 shadow-none sm:col-span-2"
              >
                <Link to="/dashboard/progress">Открыть прогресс</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="grid min-w-0 gap-5 [&>*]:min-w-0">
          <Card className={cardClassName}>
            <CardHeader className="border-b border-[#ededeb] p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#eff6ff] text-[#3b82f6]">
                  <CalendarCheck2 className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-base tracking-[-0.02em]">
                    План на сегодня
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5">
                    Текущие задачи подготовки.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {dashboard.todayPlan.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-[#deded9] bg-[#fafaf8] px-4 py-6 text-center">
                  <ClipboardCheck
                    className="mx-auto size-5 text-[#9a9a9d]"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  <p className="mt-3 text-sm font-semibold text-[#111111]">
                    Заданий пока нет
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#808084]">
                    Добавьте первое занятие в план.
                  </p>
                </div>
              ) : (
                <ul className="grid gap-3">
                  {dashboard.todayPlan.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[10px] border border-[#ededeb] p-3"
                    >
                      <p className="text-sm font-semibold text-[#111111]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[#808084]">
                        {skillLabels[item.skill]} · {item.durationMinutes} мин.
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                asChild
                variant="outline"
                className="mt-4 h-10 w-full rounded-[9px] border-[#deded9] bg-white shadow-none"
              >
                <Link to="/dashboard/plan">Настроить план</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="border-b border-[#ededeb] p-5">
              <CardTitle className="text-base tracking-[-0.02em]">
                Быстрые действия
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-[#ededeb] p-0">
              {quickActions.map((action) => {
                const Icon = action.icon

                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex min-h-[72px] items-center gap-3 px-5 py-3 text-[#111111] no-underline transition-colors hover:bg-[#fafaf8]"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#f4f4f1] text-[#69696d] transition-colors group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6]">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {action.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-[#808084]">
                        {action.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-[#a0a0a3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#3b82f6]"
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
