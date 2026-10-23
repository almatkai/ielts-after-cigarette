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

import { useAuth } from '@/features/auth/auth-store'
import { GuestTrialCard } from '@/components/auth/guest-trial-card'
import { PracticePage } from '@/pages/practice/ui/practice-page'
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
  'group gap-0 rounded-[10px] sm:rounded-[10px] border-border py-0 shadow-none transition-all hover:border-border-strong'

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
  const { user } = useAuth()
  return user ? (
    <AccountOverviewPage />
  ) : (
    <div className="mx-auto grid max-w-[1120px] gap-6">
      <GuestTrialCard />
      <PracticePage />
    </div>
  )
}

function AccountOverviewPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
  })

  if (dashboardQuery.isPending) {
    return (
      <Card className={`${cardClassName} mx-auto max-w-[1120px]`}>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Загружаем ваш dashboard…
        </CardContent>
      </Card>
    )
  }

  if (dashboardQuery.isError) {
    return (
      <Card className={`${cardClassName} mx-auto max-w-[1120px]`}>
        <CardContent className="flex flex-col items-center p-8 text-center">
          <Warning2 className="size-6 text-destructive" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-foreground">
            Не удалось загрузить dashboard
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
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
      <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-normal">
        Обзор
      </h1>
      <section
        className="grid min-w-0 gap-2.5 sm:gap-4 sm:grid-cols-3"
        aria-label="Основные показатели"
      >
        {overviewMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.label} className={cardClassName}>
              <CardContent className="flex min-w-0 items-center sm:items-start gap-2.5 sm:gap-4 p-3 sm:p-5">
                <span className="grid size-8 sm:size-10 shrink-0 place-items-center rounded-[8px] sm:rounded-[10px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
                  <Icon
                    className="size-4 sm:size-[19px] transition-colors"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                    {metric.label}
                  </p>
                  <p
                    className={`mt-0.5 sm:mt-1 tabular-nums text-lg sm:text-2xl leading-none font-semibold tracking-normal ${metric.label === 'Целевой балл' ? 'inline-block rounded-sm bg-gold px-2 py-1 text-gold-foreground' : 'text-foreground'}`}
                    style={{
                      fontFamily:
                        metric.label === 'Дата экзамена'
                          ? undefined
                          : 'var(--font-display)',
                    }}
                    aria-label={`${metric.label}: ${metric.value}`}
                  >
                    {metric.value}
                  </p>
                  <p className="mt-0.5 sm:mt-2 text-[10px] sm:text-xs leading-tight sm:leading-5 text-muted-foreground">
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
              <div className="relative max-w-[620px]">
                <p className="text-xs font-semibold text-muted-foreground">
                  Рекомендуемый шаг
                </p>
                <h2 className="mt-2.5 sm:mt-5 text-base sm:text-[clamp(1.65rem,3vw,2.35rem)] leading-snug sm:leading-[1.08] font-semibold tracking-tight sm:tracking-[-0.045em] text-foreground">
                  {dashboard.recommendedAction.title}
                </h2>
                <p className="mt-1.5 sm:mt-3 max-w-[560px] text-xs sm:text-[15px] leading-5 sm:leading-6 text-muted-foreground">
                  {dashboard.recommendedAction.description}
                </p>
                <div className="mt-3.5 sm:mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button
                    asChild
                    className="h-9 sm:h-11 rounded-[9px] bg-primary px-4 sm:px-5 text-xs sm:text-sm shadow-none hover:bg-primary-hover"
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
                      className="h-9 sm:h-11 rounded-[9px] border-border bg-card px-4 sm:px-5 text-xs sm:text-sm shadow-none"
                    >
                      Настроить цель
                    </Button>
                  </GoalDialog>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="border-b border-border p-3.5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-[8px] sm:rounded-[9px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
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
                  className="rounded-[10px] sm:rounded-[10px] border border-border bg-background p-3 sm:p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      {skillLabels[progress.skill]}
                    </p>
                    <span className="text-xs sm:text-sm font-semibold text-primary">
                      {progress.estimatedBand === null
                        ? '—'
                        : progress.estimatedBand.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1 sm:mt-2 text-[11px] sm:text-xs leading-4 sm:leading-5 text-muted-foreground">
                    {progress.completedTasks === 0
                      ? 'Нет выполненных заданий'
                      : `${progress.completedTasks} заданий · точность ${progress.accuracyPercent ?? 0}%`}
                  </p>
                </div>
              ))}
              <Button
                asChild
                variant="outline"
                className="h-9 sm:h-10 rounded-[9px] border-border bg-card px-4 text-xs sm:text-sm shadow-none sm:col-span-2"
              >
                <Link to="/progress">Открыть прогресс</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="grid min-w-0 gap-3.5 sm:gap-5 [&>*]:min-w-0">
          <Card className={cardClassName}>
            <CardHeader className="border-b border-border p-3.5 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-[8px] sm:rounded-[9px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
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
                <div className="rounded-[10px] sm:rounded-[10px] border border-dashed border-border bg-background px-3.5 py-5 sm:px-4 sm:py-6 text-center">
                  <ClipboardTick
                    className="mx-auto size-4 sm:size-5 text-muted-foreground"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-foreground">
                    Заданий пока нет
                  </p>
                  <p className="mt-1 text-[11px] sm:text-xs leading-4 sm:leading-5 text-muted-foreground">
                    Добавьте первое занятие в план.
                  </p>
                </div>
              ) : (
                <ul className="grid gap-2 sm:gap-3">
                  {dashboard.todayPlan.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[9px] sm:rounded-[10px] border border-border p-2.5 sm:p-3"
                    >
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-muted-foreground">
                        {skillLabels[item.skill]} · {item.durationMinutes} мин.
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                asChild
                variant="outline"
                className="mt-3 sm:mt-4 h-9 sm:h-10 w-full rounded-[9px] border-border bg-card text-xs sm:text-sm shadow-none"
              >
                <Link to="/plan">Настроить план</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="border-b border-border p-3.5 sm:p-5">
              <CardTitle className="text-sm sm:text-base tracking-[-0.02em]">
                Быстрые действия
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {quickActions.map((action) => {
                const Icon = action.icon

                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex min-h-[58px] sm:min-h-[72px] items-center gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-2.5 sm:py-3 text-foreground no-underline transition-colors hover:bg-background"
                  >
                    <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-[8px] sm:rounded-[9px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
                      <Icon
                        className="size-4 sm:size-[18px] transition-colors"
                        aria-hidden
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs sm:text-sm font-semibold">
                        {action.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] sm:text-xs leading-4 sm:leading-5 text-muted-foreground">
                        {action.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-3.5 sm:size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
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
