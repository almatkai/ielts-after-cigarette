import {
  ArrowRight,
  Calendar,
  DirectRight,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboard, queryKeys } from '@/features/ielts/api'
import { GoalDialog } from '@/features/ielts/goal-form'
import { useLanguage } from '@/lib/i18n'
import { UnfinishedTestBanner } from './unfinished-test-banner'

import { StudyProgress, TodayPlanSummary } from '@/features/study-plan/summary'

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
    to: '/plan/learning',
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
  const { language, t } = useLanguage()
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
  })

  if (dashboardQuery.isPending) {
    return (
      <Card className={`${cardClassName} mx-auto max-w-[1120px]`}>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {t('Загружаем ваш dashboard…')}
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
            {t('Не удалось загрузить dashboard')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Проверьте соединение с сервером и попробуйте ещё раз.')}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => void dashboardQuery.refetch()}
          >
            {t('Повторить')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const dashboard = dashboardQuery.data
  const overviewMetrics = [
    {
      label: 'Целевой балл',
      value:
        dashboard.profile.targetBand === null
          ? '—'
          : dashboard.profile.targetBand.toFixed(1),
      hint:
        dashboard.profile.targetBand === null
          ? t('Укажите цель в диалоге «Настроить цель»')
          : t('Ваша текущая цель'),
      icon: DirectRight,
    },
    {
      label: t('Дата экзамена'),
      value: formatExamDate(dashboard.profile.examDate),
      hint:
        dashboard.profile.examDate === null
          ? t('Добавьте дату в диалоге «Настроить цель»')
          : t('Запланированная дата'),
      icon: Calendar,
    },
  ] as const

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-3.5 sm:gap-5">
      <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-normal">
        {t('Обзор')}
      </h1>
      <section
        className="grid min-w-0 gap-2.5 sm:gap-4 sm:grid-cols-2"
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
          <TodayPlanSummary />
          <StudyProgress />
          <GoalDialog>
            <Button variant="outline" className="min-h-11 justify-self-start">
              Настроить цель
            </Button>
          </GoalDialog>
        </div>

        <aside className="grid min-w-0 gap-3.5 sm:gap-5 [&>*]:min-w-0">
          <Card className={cardClassName}>
            <CardHeader className="border-b border-border p-3.5 sm:p-5">
              <CardTitle className="text-sm sm:text-base tracking-[-0.02em]">
                {t('Быстрые действия')}
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
                        {t(action.label)}
                      </span>
                      <span className="mt-0.5 block text-[11px] sm:text-xs leading-4 sm:leading-5 text-muted-foreground">
                        {t(action.description)}
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
