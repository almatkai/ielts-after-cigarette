import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Tabs } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import { Switch } from '@/components/ui/switch'
import type { TaskPerformance } from '@/features/study-plan/learning-api'
import {
  Limitations,
  SourceDate,
  learningLink,
  skillLabels,
} from '@/features/study-plan/learning-ui'
import { planCard } from '@/features/study-plan/summary'
import { orderTasks, taskTitle } from '@/features/study-plan/task-performance'

export function TaskPerformancePanel({ tasks }: { tasks: TaskPerformance[] }) {
  const [section, setSection] = useState<'all' | 'reading' | 'listening'>('all')
  const [errorsOnly, setErrorsOnly] = useState(false)
  const observed = tasks.filter(
    (task) => task.answered > 0 || task.practiceAnswered > 0,
  )
  const visible = observed
    .filter(
      (task) =>
        (section === 'all' || task.section === section) &&
        (!errorsOnly || task.incorrect > 0),
    )
    .sort(orderTasks)
  return (
    <Tabs.Root
      asChild
      value={section}
      onValueChange={(value) => setSection(value as typeof section)}
    >
      <section
        className={`${planCard} p-4 sm:p-5`}
        aria-labelledby="task-performance-title"
      >
        <h2 id="task-performance-title" className="text-base font-semibold">
          Типы заданий
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <Tabs.List
            aria-label="Раздел типов заданий"
            className="grid w-full grid-cols-3 rounded-lg bg-muted p-1 sm:w-auto"
          >
            {(['all', 'reading', 'listening'] as const).map((value) => (
              <Tabs.Trigger key={value} value={value} asChild>
                <Button
                  variant="ghost"
                  className={`min-h-11 px-4 sm:min-h-9 ${section === value ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
                >
                  {value === 'all' ? 'Все' : skillLabels[value]}
                </Button>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
            <Switch
              checked={errorsOnly}
              onCheckedChange={setErrorsOnly}
              aria-label="Только с ошибками"
            />
            Только с ошибками
          </label>
        </div>
        <Tabs.Content value={section} className="outline-none">
          <table
            className="mt-3 block w-full text-left text-sm md:table"
            aria-label="Результаты по типам заданий"
          >
            <thead className="sr-only text-xs text-muted-foreground md:not-sr-only md:table-header-group">
              <tr>
                <th className="pb-2 font-medium">Тип задания</th>
                <th className="px-4 pb-2 font-medium">Ошибки</th>
                <th className="px-4 pb-2 font-medium">Источников</th>
                <th className="pb-2">
                  <span className="sr-only">Действие</span>
                </th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {visible.map((task) => (
                <tr
                  key={`${task.section}:${task.questionType}`}
                  data-testid="task-performance-row"
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-border py-3 md:table-row"
                >
                  <th
                    scope="row"
                    className="col-span-2 block min-w-0 text-left font-normal md:table-cell md:max-w-[420px] md:py-3"
                  >
                    <h3 className="break-words font-semibold">
                      {skillLabels[task.section]} · {taskTitle(task)}
                    </h3>
                    {task.sourceCount === 1 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Пока один источник — вывод предварительный
                      </p>
                    ) : null}
                  </th>
                  <td className="block min-w-0 md:table-cell md:w-40 md:px-4 md:py-3">
                    {task.answered > 0 ? (
                      <>
                        <p className="tabular-nums">
                          <span className="font-semibold">
                            {task.incorrect}/{task.answered}
                          </span>{' '}
                          <span className="text-xs text-muted-foreground">
                            ошибок
                          </span>
                        </p>
                        <div
                          role="progressbar"
                          aria-label={`Ошибки: ${taskTitle(task)}`}
                          aria-valuemin={0}
                          aria-valuemax={task.answered}
                          aria-valuenow={task.incorrect}
                          aria-valuetext={`${task.incorrect} из ${task.answered} ошибок`}
                          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min(100, (task.incorrect / task.answered) * 100)}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Исходных проверенных ответов пока нет
                      </p>
                    )}
                  </td>
                  <td className="block text-right tabular-nums md:table-cell md:px-4 md:py-3 md:text-left">
                    <span className="text-xs text-muted-foreground md:hidden">
                      Источников{' '}
                    </span>
                    {task.sourceCount}
                  </td>
                  <td className="col-span-2 block md:table-cell md:py-3 md:text-right">
                    {task.incorrect > 0 ? (
                      <Button
                        asChild
                        variant="outline"
                        className="min-h-11 w-full md:w-auto"
                      >
                        <Link
                          to="/plan/learning"
                          search={{
                            section: task.section,
                            type: task.questionType,
                          }}
                          hash="skill-cycles"
                        >
                          Разобрать
                          <span className="sr-only">
                            : {skillLabels[task.section]} · {taskTitle(task)}
                          </span>
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {task.answered > 0 ? 'Без ошибок' : 'Только повторы'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length ? (
            <div className="grid justify-items-start gap-2 py-3 text-sm">
              <p>
                {observed.length
                  ? 'Нет типов заданий по выбранным условиям.'
                  : 'Проверенных ответов по типам заданий пока нет.'}
              </p>
              {observed.length ? (
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => {
                    setSection('all')
                    setErrorsOnly(false)
                  }}
                >
                  Сбросить фильтры
                </Button>
              ) : (
                <Button asChild variant="outline" className="min-h-11">
                  <Link to="/reading">Пройти Reading</Link>
                </Button>
              )}
            </div>
          ) : null}
          <Disclosure
            title="Источники и ограничения"
            className="mt-2 border-t border-border text-xs leading-5"
          >
            <p className="mb-3 text-muted-foreground">
              Учитывается первая проверенная сданная попытка по каждому
              источнику, включая пустые ответы. Источник Reading — отдельный
              текст, Listening — целый тест. Известные дубликаты объединяются;
              повторы учитываются отдельно.
            </p>
            <div className="divide-y divide-border">
              {visible.map((task) => (
                <section
                  key={`${task.section}:${task.questionType}`}
                  className="py-3"
                  aria-label={`Источники: ${skillLabels[task.section]} · ${taskTitle(task)}`}
                >
                  <h3 className="font-semibold">
                    {skillLabels[task.section]} · {taskTitle(task)}
                  </h3>
                  {task.practiceAnswered > 0 ? (
                    <p className="mt-1 text-muted-foreground">
                      Ответов в повторных попытках: {task.practiceAnswered}
                    </p>
                  ) : null}
                  <ul className="mt-1 space-y-2">
                    {task.sourceRefs.map((source) => (
                      <li key={`${source.sourceId}:${source.attemptId}`}>
                        {source.attemptId ? (
                          <Link
                            to="/attempts/$attemptId"
                            params={{ attemptId: source.attemptId }}
                            className={learningLink}
                          >
                            {source.title || 'Исходная работа'}
                          </Link>
                        ) : (
                          <p>
                            {source.title ||
                              'Источник работы сейчас недоступен'}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          <SourceDate value={source.occurredAt} /> · неверно{' '}
                          {source.incorrect} из {source.answered}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {task.sourceCount > task.sourceRefs.length ? (
                    <p className="my-2">
                      Ещё {task.sourceCount - task.sourceRefs.length} источников
                      не показано
                    </p>
                  ) : null}
                  <Limitations items={task.limitations} />
                </section>
              ))}
            </div>
          </Disclosure>
        </Tabs.Content>
      </section>
    </Tabs.Root>
  )
}
