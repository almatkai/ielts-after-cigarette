import { Link } from '@tanstack/react-router'
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

const overviewMetrics = [
  {
    label: 'Текущий уровень',
    hint: 'Появится после диагностики',
    icon: Gauge,
  },
  {
    label: 'Целевой балл',
    hint: 'Укажите цель в профиле',
    icon: Target,
  },
  {
    label: 'Дата экзамена',
    hint: 'Добавьте дату в профиле',
    icon: CalendarDays,
  },
] as const

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

export function OverviewPage() {
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
                    aria-label={`${metric.label} пока не указан`}
                  >
                    —
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
                className="pointer-events-none absolute top-0 right-0 size-56 translate-x-16 -translate-y-16 rounded-full bg-[#fff0f0] opacity-70 blur-3xl"
                aria-hidden
              />
              <div className="relative max-w-[620px]">
                <Badge className="border border-[#f2d4d4] bg-[#fff0f0] text-[#b82f2f] shadow-none hover:bg-[#fff0f0]">
                  Рекомендуемый шаг
                </Badge>
                <h2 className="mt-5 text-[clamp(1.65rem,3vw,2.35rem)] leading-[1.08] font-semibold tracking-[-0.045em] text-[#111111]">
                  Определите стартовый уровень
                </h2>
                <p className="mt-3 max-w-[560px] text-sm leading-6 text-[#69696d] sm:text-[15px]">
                  Короткая диагностика поможет подобрать подходящую сложность и
                  построить первый план подготовки.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="h-11 rounded-[9px] bg-[#e23b3b] px-5 shadow-none hover:bg-[#c92f2f]"
                  >
                    <Link to="/dashboard/practice">
                      Начать диагностику
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
            <CardContent className="flex flex-col items-center px-5 py-9 text-center sm:px-6 sm:py-10">
              <span className="grid size-12 place-items-center rounded-full bg-[#f4f4f1] text-[#8b8b8e]">
                <BarChart3 className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-[#111111]">
                Пока недостаточно данных
              </h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-[#69696d]">
                Результаты появятся здесь после первых выполненных заданий.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-5 h-10 rounded-[9px] border-[#deded9] bg-white px-4 shadow-none"
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
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#fff0f0] text-[#e23b3b]">
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
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#f4f4f1] text-[#69696d] transition-colors group-hover:bg-[#fff0f0] group-hover:text-[#e23b3b]">
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
                      className="size-4 shrink-0 text-[#a0a0a3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#e23b3b]"
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
