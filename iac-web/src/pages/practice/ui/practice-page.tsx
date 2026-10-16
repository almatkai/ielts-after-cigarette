import {
  ArrowRight,
  Book,
  ClipboardTick,
  Edit2,
  Headphone,
  Microphone,
} from 'iconsax-react'
import { Link } from '@tanstack/react-router'

import { useAuth } from '@/features/auth/auth-store'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const skills = [
  {
    id: 'listening',
    title: 'Listening',
    subtitle: 'Аудирование',
    description:
      '4 секции, 40 вопросов. Диалоги и академические лекции с таймингом и автоматической проверкой ответов.',
    badge: '4 секции · 40 вопросов',
    to: '/listening',
    icon: Headphone,
  },
  {
    id: 'reading',
    title: 'Reading',
    subtitle: 'Чтение',
    description:
      '3 академических текста, 40 вопросов. Задания True/False/Not Given, множественный выбор и заполнение пропусков.',
    badge: '3 текста · 40 вопросов',
    to: '/reading',
    icon: Book,
  },
  {
    id: 'writing',
    title: 'Writing',
    subtitle: 'Письмо',
    description:
      'Task 1 (описание графиков/письма) и Task 2 (эссе). Детальный разбор по всем 4 официальным критериям IELTS.',
    badge: 'Task 1 & Task 2',
    to: '/writing',
    icon: Edit2,
  },
  {
    id: 'speaking',
    title: 'Speaking',
    subtitle: 'Устная речь',
    description:
      'Интервью (Part 1), карточка монолога (Part 2) и обсуждение (Part 3) с записью аудио и подробной оценкой.',
    badge: 'Part 1, 2, 3',
    to: '/speaking',
    icon: Microphone,
  },
] as const

const cardClassName =
  'gap-0 rounded-[16px] border-[#e7e7e4] bg-white py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)] transition-[border-color,box-shadow] duration-200 hover:border-[#d7d7d2] hover:shadow-[0_14px_40px_rgba(17,17,17,0.055)]'

export function PracticePage() {
  const { user } = useAuth()
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-4 sm:gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.025em] text-[#111111]">
            Практика
          </h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-5 sm:leading-6 text-[#69696d]">
            Выберите секцию для тренировки или пройдите полный пробный экзамен.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-[#deded9] bg-white px-2.5 py-0.5 sm:py-1 text-xs text-[#69696d]"
        >
          4 секции + Full Mock
        </Badge>
      </header>

      <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-2">
        {skills.map((skill) => {
          const Icon = skill.icon

          return (
            <Card key={skill.id} className={cardClassName}>
              <Link
                to={skill.to}
                data-requires-account={!user || undefined}
                className="group flex h-full flex-col justify-between p-4 sm:p-6 no-underline"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <span className="grid size-9 sm:size-11 place-items-center rounded-[9px] sm:rounded-[11px] bg-[#f4f4f1] text-[#69696d] transition-all duration-200 group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] group-hover:scale-105">
                      <Icon
                        className="size-4.5 sm:size-5 transition-colors"
                        strokeWidth={1.8}
                        aria-hidden
                      />
                    </span>
                    <Badge
                      variant="outline"
                      className="border-[#ededeb] bg-[#fafaf8] px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-[#69696d]"
                    >
                      {skill.badge}
                    </Badge>
                  </div>

                  <div className="mt-3.5 sm:mt-5">
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <h2 className="text-sm sm:text-base font-semibold tracking-[-0.02em] text-[#111111]">
                        {skill.title}
                      </h2>
                      <span className="text-[11px] sm:text-xs text-[#8b8b8e]">
                        ({skill.subtitle})
                      </span>
                    </div>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-[#69696d]">
                      {skill.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex items-center gap-2 pt-1 sm:pt-2 text-xs sm:text-sm font-semibold text-[#2563eb]">
                  <span>Перейти к материалам</span>
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
            <span className="grid size-10 sm:size-12 shrink-0 place-items-center rounded-[10px] sm:rounded-xl bg-[#f4f4f1] text-[#69696d] transition-all duration-200 group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] group-hover:scale-105">
              <ClipboardTick
                className="size-5 sm:size-6 transition-colors"
                aria-hidden
              />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h2 className="text-sm sm:text-base font-semibold tracking-[-0.02em] text-[#111111]">
                  Полный пробный экзамен (Full Mock)
                </h2>
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50/60 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-blue-700"
                >
                  4 секции подряд
                </Badge>
              </div>
              <p className="mt-1 sm:mt-1.5 max-w-2xl text-xs sm:text-sm leading-5 sm:leading-6 text-[#69696d]">
                {user
                  ? 'Мы автоматически подберём Listening, Reading, Writing и Speaking из общей библиотеки — сначала непройденные тесты. Четыре секции подряд, отдельные таймеры секций и итоговый Band Score.'
                  : 'Один бесплатный Academic Full Mock: четыре секции, отдельные таймеры секций, итоговый Band Score и разбор ответов. Для следующих тестов войдите в аккаунт.'}
              </p>
            </div>
          </div>
          <Link
            to="/full-mocks"
            className="inline-flex shrink-0 items-center justify-center rounded-[9px] sm:rounded-[10px] bg-[#2563eb] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Подготовить Full Mock
          </Link>
        </div>
      </Card>
    </div>
  )
}
