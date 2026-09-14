import {
  ArrowRight,
  Book,
  Calendar,
  CalendarTick,
  DirectRight,
  Edit2,
  Headphone,
  LampOn,
  Microphone,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { getDashboard, queryKeys } from '@/features/ielts/api'
import type { SkillId } from '@/features/ielts/api'
import { getErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const cardClassName =
  'group gap-0 rounded-[16px] border border-[#e7e7e4] bg-white py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)] transition-all duration-200 hover:border-slate-300'

const skillMeta: Record<
  SkillId,
  {
    title: string
    subtitle: string
    to:
      | '/dashboard/listening'
      | '/dashboard/reading'
      | '/dashboard/writing'
      | '/dashboard/speaking'
    icon: typeof Headphone
    advice: string
  }
> = {
  listening: {
    title: 'Listening',
    subtitle: 'Аудирование',
    to: '/dashboard/listening',
    icon: Headphone,
    advice: 'Тренируйте предвосхищение ответов и внимательность к окончаниям -s и числительным.',
  },
  reading: {
    title: 'Reading',
    subtitle: 'Чтение',
    to: '/dashboard/reading',
    icon: Book,
    advice: 'Фокусируйтесь на сканировании ключевых синонимов и различении False vs Not Given.',
  },
  writing: {
    title: 'Writing',
    subtitle: 'Письмо',
    to: '/dashboard/writing',
    icon: Edit2,
    advice: 'Соблюдайте структуру эссе (4 абзаца) и отрабатывайте академические связки.',
  },
  speaking: {
    title: 'Speaking',
    subtitle: 'Устная речь',
    to: '/dashboard/speaking',
    icon: Microphone,
    advice: 'Отвечайте развёрнуто по формуле «Тезис + Пример/Объяснение», избегая пауз.',
  },
}

export function PlanPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
  })

  if (dashboardQuery.isPending) {
    return <LoadingState label="Собираем ваш план подготовки…" />
  }
  if (dashboardQuery.isError) {
    return (
      <ErrorState
        title="Не удалось загрузить план"
        message={getErrorMessage(dashboardQuery.error)}
        onRetry={() => void dashboardQuery.refetch()}
      />
    )
  }

  const dashboard = dashboardQuery.data
  const { targetBand, examDate, currentBand } = dashboard.profile

  const daysLeft = examDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${examDate}T00:00:00`).getTime() - Date.now()) /
            86_400_000,
        ),
      )
    : null

  // Определяем статус и рекомендуемый темп
  const pacingInfo = getPacingInfo(daysLeft, targetBand, currentBand)

  // Находим самый слабый навык
  const assessed = dashboard.skillProgress.filter(
    (progress) =>
      progress.completedTasks > 0 && progress.estimatedBand !== null,
  )
  const weakest =
    assessed.length > 0
      ? assessed.reduce((min, progress) =>
          (progress.estimatedBand ?? 9) < (min.estimatedBand ?? 9)
            ? progress
            : min,
        )
      : null

  const weakestMeta = weakest ? skillMeta[weakest.skill] : undefined
  const weakestGap =
    targetBand !== null && weakest?.estimatedBand !== null && weakest?.estimatedBand !== undefined
      ? targetBand - weakest.estimatedBand
      : null

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-6">
      {/* Заголовок страницы */}
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#111111]">
          План подготовки к IELTS
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#69696d]">
          Индивидуальная стратегия, фокус на самых слабых навыках и ежедневный темп занятий.
        </p>
      </div>

      {/* 1. Траектория цели с иллюстрацией */}
      <Card className={cardClassName}>
        <CardHeader className="border-b border-[#ededeb] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-[8px] bg-[#f4f4f1] text-[#69696d] transition-colors group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6]">
                <CalendarTick className="size-4" aria-hidden />
              </span>
              <div>
                <CardTitle className="text-base tracking-[-0.02em]">
                  Траектория цели
                </CardTitle>
                <CardDescription className="text-xs">
                  {targetBand && examDate
                    ? 'Данные синхронизированы с вашим профилем'
                    : 'Задайте цель, чтобы откалибровать расчет'}
                </CardDescription>
              </div>
            </div>

            {daysLeft !== null ? (
              <Badge
                variant="secondary"
                className={cn(
                  'gap-1.5 px-3 py-1 font-medium',
                  daysLeft <= 14
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-[#eff6ff] text-[#3b82f6] border-[#dbeafe]',
                )}
              >
                <Calendar className="size-3.5" aria-hidden />
                {daysLeft === 0
                  ? 'Экзамен сегодня!'
                  : `Осталось ${daysLeft} ${getDaysPlural(daysLeft)}`}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1.5 border-dashed border-[#deded9] text-[#8b8b8e]"
              >
                Дата экзамена не указана
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <div className="flex gap-6 items-start">
            {/* Левая часть — иллюстрация */}
            <div className="hidden lg:flex shrink-0 items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}reading_arctic_fox.webp`}
                alt="Юки"
                className="size-48 object-contain"
              />
            </div>

            {/* Правая часть — контент */}
            <div className="flex flex-col gap-5 flex-1 min-w-0">
              {targetBand === null || examDate === null ? (
                <div className="rounded-[12px] border border-dashed border-[#deded9] bg-[#fafaf8] p-5 text-center">
                  <DirectRight className="mx-auto size-6 text-[#3b82f6]" aria-hidden />
                  <p className="mt-2 text-sm font-semibold text-[#111111]">
                    Целевой балл или дата ещё не заданы
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#69696d]">
                    Укажите желаемый Overall Band и дату экзамена — алгоритм рассчитает
                    необходимый темп и распределит нагрузку по дням.
                  </p>
                  <Button asChild size="sm" className="mt-4 shadow-none">
                    <Link to="/dashboard/profile">Задать цель в профиле</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[12px] border border-[#ededeb] bg-[#fafaf8] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#69696d]">
                      Текущий балл
                    </p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#111111]">
                        {currentBand !== null ? currentBand.toFixed(1) : '—'}
                      </span>
                      {currentBand === null && (
                        <span className="text-[11px] text-[#8b8b8e]">(после тестов)</span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#69696d]">Расчётный Overall Band</p>
                  </div>

                  <div className="rounded-[12px] border border-[#dbeafe] bg-[#eff6ff]/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#3b82f6]">
                      Целевой балл
                    </p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#3b82f6]">
                        {targetBand.toFixed(1)}
                      </span>
                      {currentBand !== null && (
                        <span
                          className={cn(
                            'text-[11px] font-semibold',
                            targetBand - currentBand <= 0 ? 'text-emerald-600' : 'text-[#3b82f6]',
                          )}
                        >
                          {targetBand - currentBand <= 0
                            ? 'Цель достигнута! 🎉'
                            : `+${(targetBand - currentBand).toFixed(1)} балла`}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#69696d]">Желаемый результат</p>
                  </div>

                  <div className="rounded-[12px] border border-[#ededeb] bg-[#fafaf8] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#69696d]">
                      Дата экзамена
                    </p>
                    <p className="mt-1.5 text-xl font-bold text-[#111111]">
                      {formatExamDate(examDate)}
                    </p>
                    <Link
                      to="/dashboard/profile"
                      className="mt-1 inline-block text-[11px] text-[#3b82f6] hover:underline font-medium"
                    >
                      Изменить дату →
                    </Link>
                  </div>
                </div>
              )}

              {/* Подсказка по темпу */}
              <div className="flex items-start gap-3 rounded-[12px] border border-[#ededeb] bg-[#fafaf8] p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-white text-[#3b82f6] shadow-xs">
                  <LampOn className="size-4" aria-hidden />
                </span>
                <div className="text-xs leading-5">
                  <span className="font-semibold text-[#111111]">
                    Рекомендуемый режим занятий:{' '}
                  </span>
                  <span className="text-[#69696d]">{pacingInfo}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Главный фокус подготовки: самый уязвимый навык */}
      <Card className={cardClassName}>
        <CardHeader className="border-b border-[#ededeb] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-[8px] bg-[#eff6ff] text-[#3b82f6]">
                <DirectRight className="size-4" aria-hidden />
              </span>
              <div>
                <CardTitle className="text-base tracking-[-0.02em]">
                  Зона максимального роста
                </CardTitle>
                <CardDescription className="text-xs">
                  Навык, улучшение которого даст наибольший прирост к общему баллу
                </CardDescription>
              </div>
            </div>

            {weakest && (
              <Badge className="bg-[#3b82f6] text-white hover:bg-[#2563eb] text-xs">
                Приоритет №1 · {weakestMeta?.title}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          {weakest === null ? (
            <div className="rounded-[12px] border border-dashed border-[#deded9] bg-[#fafaf8] p-6 text-center">
              <p className="text-sm font-semibold text-[#111111]">
                Пройдите первый тест для калибровки
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#808084]">
                Пока нет завершённых попыток. Начните с Listening или Reading —
                алгоритм сразу вычислит текущий балл и выявит самое слабое место.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button asChild variant="outline" className="shadow-none">
                  <Link to="/dashboard/listening">Listening</Link>
                </Button>
                <Button asChild variant="outline" className="shadow-none">
                  <Link to="/dashboard/reading">Reading</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#ededeb] bg-[#fafaf8] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-[10px] bg-white text-[#3b82f6] shadow-xs">
                    {weakestMeta && <weakestMeta.icon className="size-5" aria-hidden />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">
                      {weakestMeta?.title} ({weakestMeta?.subtitle})
                    </p>
                    <p className="text-xs text-[#69696d]">
                      Текущий результат: band{' '}
                      <strong className="text-[#111111]">
                        {weakest.estimatedBand?.toFixed(1) ?? '—'}
                      </strong>
                      {weakestGap !== null && (
                        <span>
                          {weakestGap <= 0
                            ? ' · цель достигнута, закрепите результат'
                            : ` · до цели не хватает ${weakestGap.toFixed(1)} балла`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {weakestMeta && (
                    <Button asChild className="gap-2 shadow-none">
                      <Link to={weakestMeta.to}>
                        Начать тренировку {weakestMeta.title}
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="shadow-none">
                    <Link to="/dashboard/mistakes">Банк ошибок</Link>
                  </Button>
                </div>
              </div>

              {/* 3 шага для подтягивания навыка */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[10px] border border-[#ededeb] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                    <span className="grid size-5 place-items-center rounded-full bg-[#eff6ff] text-[11px] font-bold text-[#3b82f6]">
                      1
                    </span>
                    Регулярный спринт
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#69696d]">
                    Делайте хотя бы 1 задание {weakestMeta?.title} каждый день и
                    детально разбирайте каждое несовпадение.
                  </p>
                </div>

                <div className="rounded-[10px] border border-[#ededeb] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                    <span className="grid size-5 place-items-center rounded-full bg-[#eff6ff] text-[11px] font-bold text-[#3b82f6]">
                      2
                    </span>
                    Анализ ошибок
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#69696d]">
                    {weakestMeta?.advice} Все ошибки сохраняются в разделе «Ошибки»
                    для повторения.
                  </p>
                </div>

                <div className="rounded-[10px] border border-[#ededeb] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                    <span className="grid size-5 place-items-center rounded-full bg-[#eff6ff] text-[11px] font-bold text-[#3b82f6]">
                      3
                    </span>
                    Контрольный замер
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#69696d]">
                    Раз в неделю проходите полный модуль целиком с таймингом, чтобы
                    отслеживать динамику в «Прогрессе».
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

function formatExamDate(value: string | null) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

function getDaysPlural(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}

function getPacingInfo(
  daysLeft: number | null,
  targetBand: number | null,
  currentBand: number | null,
) {
  if (daysLeft === null) {
    return 'Укажите дату экзамена для подбора оптимального темпа занятий.'
  }
  if (daysLeft <= 14) {
    return 'Финишная прямая! Рекомендуется решать по 2 модуля в день и разобрать все ошибки.'
  }
  if (daysLeft <= 45) {
    return 'Оптимальный темп: 1 модуль ежедневно + 1 полный пробный тест (Full Mock) в неделю.'
  }
  const gap =
    targetBand !== null && currentBand !== null ? targetBand - currentBand : null
  if (gap !== null && gap > 1.5) {
    return 'До цели значительный шаг: уделяйте особое внимание слабому навыку и словарному запасу.'
  }
  return 'Планомерная подготовка: 1 модуль в день и еженедельный разбор накопленных ошибок.'
}

