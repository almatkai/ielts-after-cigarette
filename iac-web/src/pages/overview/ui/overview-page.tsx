import {
  ArrowRight,
  Calendar,
  CalendarTick,
  Chart,
  ClipboardTick,
  DirectRight,
  Speedometer,
  User,
  Warning2,
  Weight,
} from 'iconsax-react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

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
import { GoalDialog } from '@/features/ielts/goal-form'
import { UnfinishedTestBanner } from './unfinished-test-banner'

import type { SkillId } from '@/features/ielts/api'

const quickActions = [
  {
    label: 'Перейти к практике',
    description: 'Выбрать навык и формат задания',
    to: '/practice',
    icon: Weight,
  },
  {
    label: 'Разобрать ошибки',
    description: 'Вернуться к сложным заданиям',
    to: '/mistakes',
    icon: Warning2,
  },
  {
    label: 'Заполнить профиль',
    description: 'Указать цель и дату экзамена',
    to: '/profile',
    icon: User,
  },
] as const

const cardClassName =
  'group gap-0 rounded-[14px] sm:rounded-[16px] border-[#e7e7e4] py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)] transition-all hover:border-slate-300'

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
          <Warning2 className="size-6 text-[#e23b3b]" aria-hidden />
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
      icon: Speedometer,
    },
    {
      label: 'Целевой балл',
      value:
        dashboard.profile.targetBand === null
          ? '—'
          : dashboard.profile.targetBand.toFixed(1),
      hint:
        dashboard.profile.targetBand === null
          ? 'Укажите цель в диалоге «Настроить цель»'
          : 'Ваша текущая цель',
      icon: DirectRight,
    },
    {
      label: 'Дата экзамена',
      value: formatExamDate(dashboard.profile.examDate),
      hint:
        dashboard.profile.examDate === null
          ? 'Добавьте дату в диалоге «Настроить цель»'
          : 'Запланированная дата',
      icon: Calendar,
    },
  ] as const
  const recommendedTarget =
    dashboard.recommendedAction.target === '/profile' ||
    dashboard.recommendedAction.target === '/dashboard/profile'
      ? '/profile'
      : '/practice'

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-3.5 sm:gap-5">
      <section
        className="grid min-w-0 gap-2.5 sm:gap-4 sm:grid-cols-3"
        aria-label="Основные показатели"
      >
        {overviewMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.label} className={cardClassName}>
              <CardContent className="flex min-w-0 items-center sm:items-start gap-2.5 sm:gap-4 p-3 sm:p-5">
                <span className="grid size-8 sm:size-10 shrink-0 place-items-center rounded-[8px] sm:rounded-[10px] bg-[#f4f4f1] text-[#69696d] transition-all duration-200 group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] group-hover:scale-105">
                  <Icon
                    className="size-4 sm:size-[19px] transition-colors"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-semibold tracking-[0.03em] text-[#69696d]">
                    {metric.label}
                  </p>
                  <p
                    className="mt-0.5 sm:mt-1 text-lg sm:text-2xl leading-none font-semibold tracking-[-0.04em] text-[#111111]"
                    aria-label={`${metric.label}: ${metric.value}`}
                  >
                    {metric.value}
                  </p>
                  <p className="mt-0.5 sm:mt-2 text-[10px] sm:text-xs leading-tight sm:leading-5 text-[#8b8b8e]">
                    {metric.hint}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <UnfinishedTestBanner />

      <div className="grid min-w-0 items-start gap-3.5 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-3.5 sm:gap-5 [&>*]:min-w-0">
          <Card className={cardClassName}>
            <CardContent className="relative overflow-hidden p-3.5 sm:p-8">
              <div
                className="pointer-events-none absolute top-0 right-0 size-56 translate-x-16 -translate-y-16 rounded-full bg-[#eff6ff] opacity-70 blur-3xl"
                aria-hidden
              />
              <div className="relative max-w-[620px]">
                <Badge className="border border-[#dbeafe] bg-[#eff6ff] px-2 py-0.5 text-[11px] sm:text-xs text-[#1d4ed8] shadow-none hover:bg-[#eff6ff]">
                  Рекомендуемый шаг
                </Badge>
                <h2 className="mt-2.5 sm:mt-5 text-base sm:text-[clamp(1.65rem,3vw,2.35rem)] leading-snug sm:leading-[1.08] font-semibold tracking-tight sm:tracking-[-0.045em] text-[#111111]">
                  {dashboard.recommendedAction.title}
                </h2>
                <p className="mt-1.5 sm:mt-3 max-w-[560px] text-xs sm:text-[15px] leading-5 sm:leading-6 text-[#69696d]">
                  {dashboard.recommendedAction.description}
                </p>
                <div className="mt-3.5 sm:mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button
                    asChild
                    className="h-9 sm:h-11 rounded-[9px] bg-[#3b82f6] px-4 sm:px-5 text-xs sm:text-sm shadow-none hover:bg-[#2563eb]"
                  >
                    <Link to={recommendedTarget}>
                      Перейти к следующему шагу
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <GoalDialog>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 sm:h-11 rounded-[9px] border-[#deded9] bg-white px-4 sm:px-5 text-xs sm:text-sm shadow-none"
                    >
                      Настроить цель
                    </Button>
                  </GoalDialog>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="border-b border-[#ededeb] p-3.5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-[8px] sm:rounded-[9px] bg-[#f4f4f1] text-[#69696d] transition-all duration-200 group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] group-hover:scale-105">
                  <Chart
                    className="size-4 sm:size-[18px] transition-colors"
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base tracking-[-0.02em]">
                    Прогресс по навыкам
                  </CardTitle>
                  <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-4 sm:leading-5">
                    Общая картина по Listening, Reading, Writing и Speaking.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2.5 sm:gap-3 p-3.5 sm:grid-cols-2 sm:p-6">
              {dashboard.skillProgress.map((progress) => (
                <div
                  key={progress.skill}
                  className="rounded-[10px] sm:rounded-[12px] border border-[#ededeb] bg-[#fafaf8] p-3 sm:p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm font-semibold text-[#111111]">
                      {skillLabels[progress.skill]}
                    </p>
                    <span className="text-xs sm:text-sm font-semibold text-[#3b82f6]">
                      {progress.estimatedBand === null
                        ? '—'
                        : progress.estimatedBand.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1 sm:mt-2 text-[11px] sm:text-xs leading-4 sm:leading-5 text-[#808084]">
                    {progress.completedTasks === 0
                      ? 'Нет выполненных заданий'
                      : `${progress.completedTasks} заданий · точность ${progress.accuracyPercent ?? 0}%`}
                  </p>
                </div>
              ))}
              <Button
                asChild
                variant="outline"
                className="h-9 sm:h-10 rounded-[9px] border-[#deded9] bg-white px-4 text-xs sm:text-sm shadow-none sm:col-span-2"
              >
                <Link to="/progress">Открыть прогресс</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="grid min-w-0 gap-3.5 sm:gap-5 [&>*]:min-w-0">
          <Card className={cardClassName}>
            <CardHeader className="border-b border-[#ededeb] p-3.5 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-[8px] sm:rounded-[9px] bg-[#f4f4f1] text-[#69696d] transition-all duration-200 group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] group-hover:scale-105">
                  <CalendarTick
                    className="size-4 sm:size-[18px] transition-colors"
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base tracking-[-0.02em]">
                    План на сегодня
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5">
              {dashboard.todayPlan.length === 0 ? (
                <div className="rounded-[10px] sm:rounded-[12px] border border-dashed border-[#deded9] bg-[#fafaf8] px-3.5 py-5 sm:px-4 sm:py-6 text-center">
                  <ClipboardTick
                    className="mx-auto size-4 sm:size-5 text-[#9a9a9d]"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-[#111111]">
                    Заданий пока нет
                  </p>
                  <p className="mt-1 text-[11px] sm:text-xs leading-4 sm:leading-5 text-[#808084]">
                    Добавьте первое занятие в план.
                  </p>
                </div>
              ) : (
                <ul className="grid gap-2 sm:gap-3">
                  {dashboard.todayPlan.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[9px] sm:rounded-[10px] border border-[#ededeb] p-2.5 sm:p-3"
                    >
                      <p className="text-xs sm:text-sm font-semibold text-[#111111]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-[#808084]">
                        {skillLabels[item.skill]} · {item.durationMinutes} мин.
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                asChild
                variant="outline"
                className="mt-3 sm:mt-4 h-9 sm:h-10 w-full rounded-[9px] border-[#deded9] bg-white text-xs sm:text-sm shadow-none"
              >
                <Link to="/plan">Настроить план</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="border-b border-[#ededeb] p-3.5 sm:p-5">
              <CardTitle className="text-sm sm:text-base tracking-[-0.02em]">
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
                    className="group flex min-h-[58px] sm:min-h-[72px] items-center gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-2.5 sm:py-3 text-[#111111] no-underline transition-colors hover:bg-[#fafaf8]"
                  >
                    <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-[8px] sm:rounded-[9px] bg-[#f4f4f1] text-[#69696d] transition-all duration-200 group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] group-hover:scale-105">
                      <Icon
                        className="size-4 sm:size-[18px] transition-colors"
                        aria-hidden
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs sm:text-sm font-semibold">
                        {action.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] sm:text-xs leading-4 sm:leading-5 text-[#808084]">
                        {action.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-3.5 sm:size-4 shrink-0 text-[#a0a0a3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#3b82f6]"
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
