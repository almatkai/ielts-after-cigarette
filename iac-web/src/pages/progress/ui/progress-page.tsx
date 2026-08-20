import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Gauge,
  Headphones,
  Mic,
  PenLine,
  Target,
  TriangleAlert,
} from 'lucide-react'

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

const cardClassName =
  'gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900'

const skillMeta: Record<SkillId, { label: string; icon: typeof Headphones }> = {
  listening: { label: 'Listening', icon: Headphones },
  reading: { label: 'Reading', icon: BookOpen },
  writing: { label: 'Writing', icon: PenLine },
  speaking: { label: 'Speaking', icon: Mic },
}

function formatExamDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

function daysUntilExam(examDate: string | null) {
  if (!examDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(`${examDate}T00:00:00`)
  const diff = Math.round((exam.getTime() - today.getTime()) / 86_400_000)
  return diff >= 0 ? diff : null
}

function pluralizeDays(value: number) {
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

export function ProgressPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
  })

  if (dashboardQuery.isPending) {
    return (
      <div style={interFont} className="mx-auto w-full max-w-[1120px]">
        <Card className={cardClassName}>
          <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Загружаем ваш прогресс…
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
              Не удалось загрузить прогресс
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
  const examDaysLeft = daysUntilExam(dashboard.profile.examDate)
  const overviewMetrics = [
    {
      label: 'Текущий балл',
      value:
        dashboard.profile.currentBand === null
          ? '—'
          : dashboard.profile.currentBand.toFixed(1),
      hint:
        dashboard.profile.currentBand === null
          ? 'Появится после первых заданий'
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
      label: 'До экзамена',
      value:
        examDaysLeft === null
          ? '—'
          : `${examDaysLeft}\u00A0${pluralizeDays(examDaysLeft)}`,
      hint:
        dashboard.profile.examDate === null
          ? 'Добавьте дату в профиле'
          : formatExamDate(dashboard.profile.examDate),
      icon: CalendarDays,
    },
  ] as const

  return (
    <div
      style={interFont}
      className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5"
    >
      <header className="max-w-[720px] pt-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500 dark:text-blue-400">
          Ваш прогресс
        </p>
        <h1 className="mt-3 text-[2.1rem] leading-[1.08] font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Каждое занятие приближает к&nbsp;
          <span className="relative inline-block whitespace-nowrap">
            цели
            <svg
              className="absolute -bottom-1.5 left-0 h-[0.3em] w-full text-blue-500 dark:text-blue-400"
              viewBox="0 0 116 24"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M4.00061 12.4376C4.06607 12.3264 4.13152 12.2152 6.40603 11.1377C8.68054 10.0603 13.1621 8.01989 16.8689 6.94873C20.5758 5.87756 23.372 5.83745 25.6614 6.20863C27.9507 6.57982 29.6483 7.36352 32.1583 9.1316C34.6684 10.8997 37.9394 13.6284 40.1294 15.3737C43.2691 17.8758 45.5035 18.7964 47.907 19.2997C50.5104 19.8449 53.7364 19.0999 57.8979 16.5818C60.5115 15.0004 63.234 11.497 65.3247 9.49972C68.3785 6.58237 71.8204 5.77043 75.759 5.45011C79.1716 5.17256 82.5069 6.67364 86.5177 9.02242C91.8499 12.145 95.4389 14.9353 97.2991 15.5008C99.2298 16.0876 101.851 14.2301 104.728 11.6288C106.143 10.2827 107.465 8.88386 108.552 7.59526C109.639 6.30666 110.45 5.17069 111.286 4.00031"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg dark:text-slate-400">
          Расчётный балл по каждому навыку, точность ответов и то, что осталось
          Расчётный балл по каждому навыку, точность ответов и то, что осталось
          до целевого IELTS Band.
        </p>
      </header>

      <section
        className="grid min-w-0 gap-4 sm:grid-cols-3"
        aria-label="Основные показатели"
      >
        {overviewMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.label} className={cardClassName}>
              <CardContent className="flex min-w-0 items-start gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                  <Icon className="size-5" strokeWidth={1.8} aria-hidden />
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

      <Card className={cardClassName}>
        <CardHeader className="border-b border-slate-200 p-5 sm:p-6 dark:border-slate-800">
          <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Прогресс по навыкам
          </CardTitle>
          <CardDescription className="mt-1 leading-5 text-slate-500 dark:text-slate-400">
            Балл на шкале от 0 до 9 и точность выполненных заданий.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          {dashboard.skillProgress.map((progress) => {
            const { label, icon: Icon } = skillMeta[progress.skill]
            const band = progress.estimatedBand
            const bandPercent =
              band === null ? 0 : Math.min(100, (band / 9) * 100)
            const targetPercent =
              dashboard.profile.targetBand === null
                ? null
                : Math.min(100, (dashboard.profile.targetBand / 9) * 100)

            return (
              <div
                key={progress.skill}
                className="rounded-[10px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                      <Icon
                        className="size-[18px]"
                        strokeWidth={1.8}
                        aria-hidden
                      />
                    </span>
                    <div>
                      <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 tabular-nums dark:text-slate-500">
                        {progress.completedTasks === 0
                          ? 'Нет выполненных заданий'
                          : `${progress.completedTasks} заданий · точность ${progress.accuracyPercent ?? 0}%`}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl leading-none font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-slate-100">
                    {band === null ? '—' : band.toFixed(1)}
                  </p>
                </div>
                <div className="relative mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${bandPercent}%` }}
                      role="progressbar"
                      aria-valuenow={band ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={9}
                      aria-label={`${label}: расчётный балл ${band === null ? 'нет данных' : band.toFixed(1)} из 9`}
                    />
                  </div>
                  {targetPercent !== null && (
                    <span
                      className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 dark:bg-slate-300"
                      style={{ left: `${targetPercent}%` }}
                      aria-hidden
                    />
                  )}
                </div>
                {targetPercent !== null &&
                  dashboard.profile.targetBand !== null && (
                    <p className="mt-2 text-right text-xs font-medium text-slate-400 dark:text-slate-500">
                      цель {dashboard.profile.targetBand.toFixed(1)}
                    </p>
                  )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-[560px]">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Закрепите результат
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Короткое занятие сегодня поднимет точность и приблизит расчётный
              балл к цели.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-lg bg-blue-500 px-7 text-base font-bold text-white shadow-sm hover:bg-blue-600"
            >
              <Link to="/dashboard/practice">
                Перейти к практике
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-lg border-slate-300 bg-white px-7 text-base font-bold text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900"
            >
              <Link to="/dashboard/profile">Изменить цель</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
