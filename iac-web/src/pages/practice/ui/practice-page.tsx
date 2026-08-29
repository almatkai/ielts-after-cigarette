import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BookOpenText,
  Check,
  ClipboardList,
  Headphones,
  LibraryBig,
  Mic2,
  PenLine,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { skillData } from '@/content/landing-content'
import { cn } from '@/lib/utils'

import type { SkillId } from '@/content/landing-content'

const skillIcons = {
  listening: Headphones,
  reading: BookOpenText,
  writing: PenLine,
  speaking: Mic2,
} satisfies Record<SkillId, typeof Headphones>

const practiceSteps = [
  {
    number: '01',
    title: 'Выберите навык',
    description: 'Сфокусируйтесь на одном направлении IELTS.',
  },
  {
    number: '02',
    title: 'Выполните задание',
    description: 'Работайте в формате, близком к экзамену.',
  },
  {
    number: '03',
    title: 'Разберите результат',
    description: 'Используйте ошибки для следующей тренировки.',
  },
] as const

const skillLibraryHref: Partial<Record<SkillId, string>> = {
  listening: '/dashboard/listening',
  reading: '/dashboard/reading',
}

const cardClassName =
  'gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)]'

export function PracticePage() {
  const [selectedSkill, setSelectedSkill] = useState<SkillId | null>(null)
  const selectedSkillData = skillData.find(
    (skill) => skill.id === selectedSkill,
  )
  const SelectedSkillIcon = selectedSkillData
    ? skillIcons[selectedSkillData.id]
    : LibraryBig

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <section aria-labelledby="skill-selection-heading">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="skill-selection-heading"
              className="text-lg font-semibold tracking-[-0.025em] text-[#111111]"
            >
              Выберите навык
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#69696d]">
              Сосредоточьтесь на одном направлении текущей тренировки.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-[#deded9] bg-white px-2.5 py-1 text-[#69696d]"
          >
            4 направления IELTS
          </Badge>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {skillData.map((skill) => {
            const Icon = skillIcons[skill.id]
            const isSelected = selectedSkill === skill.id

            return (
              <Card
                key={skill.id}
                className={cn(
                  cardClassName,
                  'transition-[border-color,box-shadow,transform] duration-200 has-[button:focus-visible]:border-[#3b82f6] hover:-translate-y-0.5 hover:border-[#d7d7d2] hover:shadow-[0_14px_40px_rgba(17,17,17,0.055)]',
                  isSelected &&
                    'border-[#3b82f6] shadow-[0_14px_40px_rgba(59,130,246,0.08)]',
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedSkill(skill.id)}
                  className="flex min-h-[188px] w-full flex-col items-start p-5 text-left outline-none"
                  aria-pressed={isSelected}
                >
                  <span
                    className={cn(
                      'grid size-10 place-items-center rounded-[10px] bg-[#f4f4f1] text-[#69696d] transition-colors',
                      isSelected && 'bg-[#eff6ff] text-[#3b82f6]',
                    )}
                  >
                    <Icon
                      className="size-[19px]"
                      strokeWidth={1.8}
                      aria-hidden
                    />
                  </span>
                  <span className="mt-5 flex w-full items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#111111]">
                      {skill.label}
                    </span>
                    {isSelected ? (
                      <span
                        className="grid size-5 shrink-0 place-items-center rounded-full bg-[#3b82f6] text-white"
                        aria-label="Выбрано"
                      >
                        <Check
                          className="size-3"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-2 line-clamp-3 text-xs leading-5 text-[#808084]">
                    {skill.description}
                  </span>
                </button>
              </Card>
            )
          })}
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className={cardClassName}>
          <CardHeader className="border-b border-[#ededeb] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-base tracking-[-0.02em]">
                  Каталог тренировок
                </CardTitle>
                <CardDescription className="mt-1 leading-5">
                  Задания для сфокусированной практики.
                </CardDescription>
              </div>
              {selectedSkillData ? (
                <Badge className="border border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8] shadow-none hover:bg-[#eff6ff]">
                  {selectedSkillData.label}
                </Badge>
              ) : null}
            </div>
          </CardHeader>

          <CardContent
            className="flex min-h-[330px] flex-col items-center justify-center px-5 py-10 text-center sm:px-8"
            aria-live="polite"
          >
            <span className="grid size-14 place-items-center rounded-full bg-[#f4f4f1] text-[#8b8b8e]">
              <SelectedSkillIcon
                className="size-6"
                strokeWidth={1.7}
                aria-hidden
              />
            </span>
            <h3 className="mt-5 text-base font-semibold tracking-[-0.02em] text-[#111111]">
              {selectedSkillData
                ? skillLibraryHref[selectedSkillData.id]
                  ? `Тренировки по направлению «${selectedSkillData.label}»`
                  : `Заданий по направлению «${selectedSkillData.label}» пока нет`
                : 'Сначала выберите навык'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#69696d]">
              {selectedSkillData
                ? skillLibraryHref[selectedSkillData.id]
                  ? 'Откройте библиотеку материалов и пройдите тест в формате, близком к экзамену.'
                  : 'Тренажёр для этого навыка в разработке и появится позже.'
                : 'После выбора здесь появятся доступные форматы и задания для практики.'}
            </p>
            {selectedSkillData && skillLibraryHref[selectedSkillData.id] ? (
              <Link
                to={skillLibraryHref[selectedSkillData.id]}
                className="mt-5 inline-flex items-center justify-center rounded-[10px] bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]"
              >
                Перейти к материалам
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <aside>
          <Card className={cardClassName}>
            <CardHeader className="border-b border-[#ededeb] p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#eff6ff] text-[#3b82f6]">
                  <ClipboardList className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-base tracking-[-0.02em]">
                    Как устроена практика
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5">
                    Один понятный цикл работы.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <ol className="grid gap-5">
                {practiceSteps.map((step) => (
                  <li key={step.number} className="flex gap-3">
                    <span className="mt-0.5 text-[11px] leading-5 font-semibold tracking-[0.08em] text-[#3b82f6]">
                      {step.number}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#111111]">
                        {step.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#808084]">
                        {step.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
