import { useQuery } from '@tanstack/react-query'
import { getDashboard, queryKeys } from '@/features/ielts/api'
import { ArrowRight, ClipboardTick } from 'iconsax-react'
import { Link } from '@tanstack/react-router'

import { useAuth } from '@/features/auth/auth-store'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'
import {
  isOnFreeAllowance,
  useBillingAccess,
} from '@/features/billing/use-billing'

const skills = [
  {
    id: 'listening',
    title: 'Listening',
    subtitle: 'Аудирование',
    description:
      '4 секции, 40 вопросов. Диалоги и академические лекции с таймингом и автоматической проверкой ответов.',
    badge: '4 секции · 40 вопросов',
    to: '/listening',
  },
  {
    id: 'reading',
    title: 'Reading',
    subtitle: 'Чтение',
    description:
      '3 академических текста, 40 вопросов. Задания True/False/Not Given, множественный выбор и заполнение пропусков.',
    badge: '3 текста · 40 вопросов',
    to: '/reading',
  },
  {
    id: 'writing',
    title: 'Writing',
    subtitle: 'Письмо',
    description:
      'Task 1 (описание графиков/письма) и Task 2 (эссе). Детальный разбор по всем 4 официальным критериям IELTS.',
    badge: 'Task 1 & Task 2',
    to: '/writing',
  },
  {
    id: 'speaking',
    title: 'Speaking',
    subtitle: 'Устная речь',
    description:
      'Интервью (Part 1), карточка монолога (Part 2) и обсуждение (Part 3) с записью аудио и подробной оценкой.',
    badge: 'Part 1, 2, 3',
    to: '/speaking',
  },
] as const

const cardClassName =
  'gap-0 rounded-[10px] border-border bg-card py-0 shadow-none transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-none'

export function PracticePage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const dashboard = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
    enabled: Boolean(user),
  })
  const access = useBillingAccess()
  const free = isOnFreeAllowance(access.data) ? access.data?.free : undefined
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-4 sm:gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-normal text-foreground">
            {t('Практика')}
          </h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
            {t(
              'Выберите секцию для тренировки или пройдите полный пробный экзамен.',
            )}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('4 секции + Full Mock')}
        </span>
      </header>

      <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-2">
        {skills.map((skill) => {
          const progress = (dashboard.data?.skillProgress ?? []).find(
            (item) => item.skill === skill.id,
          )

          return (
            <Card key={skill.id} className={cardClassName}>
              <Link
                to={skill.to}
                data-requires-account={!user || undefined}
                className="group flex h-full flex-col justify-between p-4 sm:p-6 no-underline"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    {progress ? (
                      <div className="text-xs leading-5 text-muted-foreground">
                        <span className="block">
                          {t('Заданий выполнено')}: {progress.completedTasks}
                        </span>
                        {progress.estimatedBand !== null ? (
                          <span className="font-display text-xl font-semibold tracking-normal text-primary">
                            {progress.estimatedBand.toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {t(skill.badge)}
                    </span>
                  </div>

                  <div className="mt-3.5 sm:mt-5">
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <h2 className="text-sm sm:text-base font-semibold tracking-[-0.02em] text-foreground">
                        {skill.title}
                      </h2>
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        ({t(skill.subtitle)})
                      </span>
                    </div>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
                      {t(skill.description)}
                    </p>
                    {free?.[skill.id] ? (
                      <p className="mt-2 text-xs font-medium text-foreground">
                        {free[skill.id].remaining > 0
                          ? `${t('Бесплатных тестов осталось:')} ${free[skill.id].remaining} ${t('из')} ${free[skill.id].limit}`
                          : t('Бесплатные тесты закончились — нужен тариф')}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex items-center gap-2 pt-1 sm:pt-2 text-xs sm:text-sm font-semibold text-primary-hover">
                  <span>{t('Перейти к материалам')}</span>
                  <ArrowRight
                    className="size-3.5 sm:size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </div>
              </Link>
            </Card>
          )
        })}
      </div>

      <Card className={cn(cardClassName, 'group p-4 sm:p-7')}>
        <div className="flex flex-col justify-between gap-4 sm:gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="grid size-10 sm:size-12 shrink-0 place-items-center rounded-[10px] sm:rounded-xl bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
              <ClipboardTick
                className="size-5 sm:size-6 transition-colors"
                aria-hidden
              />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h2 className="text-sm sm:text-base font-semibold tracking-[-0.02em] text-foreground">
                  {t('Полный пробный экзамен (Full Mock)')}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {t('4 секции подряд')}
                </span>
              </div>
              <p className="mt-1 sm:mt-1.5 max-w-2xl text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
                {user
                  ? t(
                      'Мы автоматически подберём Listening, Reading, Writing и Speaking из общей библиотеки — сначала непройденные тесты. Четыре секции подряд, отдельные таймеры секций и итоговый Band Score.',
                    )
                  : t(
                      'Один бесплатный Academic Full Mock: четыре секции, отдельные таймеры секций, итоговый Band Score и разбор ответов. Для следующих тестов войдите в аккаунт.',
                    )}
              </p>
            </div>
          </div>
          <Link
            to="/full-mocks"
            className="inline-flex shrink-0 items-center justify-center rounded-[9px] sm:rounded-[10px] bg-primary-hover px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary"
          >
            {t('Подготовить Full Mock')}
          </Link>
        </div>
      </Card>
    </div>
  )
}
