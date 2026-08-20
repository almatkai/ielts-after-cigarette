import { useState } from 'react'
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

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

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

const cardClassName =
  'gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900'

export function PracticePage() {
  const [selectedSkill, setSelectedSkill] = useState<SkillId | null>(null)
  const selectedSkillData = skillData.find(
    (skill) => skill.id === selectedSkill,
  )
  const SelectedSkillIcon = selectedSkillData
    ? skillIcons[selectedSkillData.id]
    : LibraryBig

  return (
    <div
      style={interFont}
      className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5"
    >
      <section aria-labelledby="skill-selection-heading">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="skill-selection-heading"
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Выберите навык
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Сосредоточьтесь на одном направлении текущей тренировки.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-slate-300 bg-white px-2.5 py-1 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
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
                  'transition-[border-color,box-shadow,transform] duration-200 has-[button:focus-visible]:border-blue-500 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700',
                  isSelected && 'border-blue-500 shadow-md',
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
                      'grid size-10 place-items-center rounded-lg bg-slate-50 text-slate-500 transition-colors dark:bg-slate-800 dark:text-slate-400',
                      isSelected &&
                        'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400',
                    )}
                  >
                    <Icon
                      className="size-[19px]"
                      strokeWidth={1.8}
                      aria-hidden
                    />
                  </span>
                  <span className="mt-5 flex w-full items-center justify-between gap-3">
                    <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {skill.label}
                    </span>
                    {isSelected ? (
                      <span
                        className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-500 text-white"
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
                  <span className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400 dark:text-slate-500">
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
          <CardHeader className="border-b border-slate-100 p-5 sm:p-6 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Каталог тренировок
                </CardTitle>
                <CardDescription className="mt-1 leading-5 text-slate-500 dark:text-slate-400">
                  Задания для сфокусированной практики.
                </CardDescription>
              </div>
              {selectedSkillData ? (
                <Badge className="border border-blue-100 bg-blue-50 text-blue-600 shadow-none hover:bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/10">
                  {selectedSkillData.label}
                </Badge>
              ) : null}
            </div>
          </CardHeader>

          <CardContent
            className="flex min-h-[330px] flex-col items-center justify-center px-5 py-10 text-center sm:px-8"
            aria-live="polite"
          >
            <span className="grid size-14 place-items-center rounded-full bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <SelectedSkillIcon
                className="size-6"
                strokeWidth={1.7}
                aria-hidden
              />
            </span>
            <h3 className="mt-5 text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {selectedSkillData
                ? `Заданий по направлению «${selectedSkillData.label}» пока нет`
                : 'Сначала выберите навык'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {selectedSkillData
                ? 'Новые тренировки появятся здесь после добавления учебных материалов.'
                : 'После выбора здесь появятся доступные форматы и задания для практики.'}
            </p>
          </CardContent>
        </Card>

        <aside>
          <Card className={cardClassName}>
            <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                  <ClipboardList className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Как устроена практика
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5 text-slate-500 dark:text-slate-400">
                    Один понятный цикл работы.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <ol className="grid gap-5">
                {practiceSteps.map((step) => (
                  <li key={step.number} className="flex gap-3">
                    <span className="mt-0.5 text-[11px] leading-5 font-bold tracking-[0.08em] text-blue-500 dark:text-blue-400">
                      {step.number}
                    </span>
                    <span>
                      <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {step.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-400 dark:text-slate-500">
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
