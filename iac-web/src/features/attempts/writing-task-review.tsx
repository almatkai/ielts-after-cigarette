import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnnotatedEssayView } from './annotated-essay-view'
import { ModelParagraphCard } from './model-paragraph-card'
import type { WritingTaskFeedback } from './api'

export function WritingTaskReview({
  task,
  taskAnswerText,
  showModelAnswer = false,
  modelAnswerAvailability = 'unavailable',
  learningAction,
}: {
  learningAction?: ReactNode
  task: WritingTaskFeedback
  taskAnswerText?: string
  showModelAnswer?: boolean
  modelAnswerAvailability?:
    'loading' | 'unavailable' | 'no-cycle' | 'correction-required'
}) {
  return (
    <Card
      role="region"
      aria-label={`Writing Task ${task.position}`}
      className="gap-0 rounded-[16px] border-border bg-card py-0 shadow-none overflow-hidden"
    >
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <CardTitle className="text-base font-semibold">
          Task {task.position}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-5 p-4 text-sm leading-6 sm:p-5">
        <section aria-label="Разбор по критериям">
          <h3 className="mb-3 text-base font-semibold">Разбор по критериям</h3>
          <table className="block w-full text-left text-sm sm:table">
            <thead className="hidden text-xs text-muted-foreground sm:table-header-group">
              <tr>
                <th scope="col" className="w-1/3 pb-2 pr-5 font-medium">
                  Критерий
                </th>
                <th scope="col" className="pb-2 font-medium">
                  Комментарий
                </th>
              </tr>
            </thead>
            <tbody className="block divide-y divide-border sm:table-row-group">
              {[
                {
                  label:
                    task.position === 1 ? 'Task Achievement' : 'Task Response',
                  criterion: task.criteria.taskResponse,
                },
                {
                  label: 'Coherence & Cohesion',
                  criterion: task.criteria.coherence,
                },
                {
                  label: 'Lexical Resource',
                  criterion: task.criteria.lexicalResource,
                },
                {
                  label: 'Grammar Range & Accuracy',
                  criterion: task.criteria.grammar,
                },
              ].map(({ label, criterion }) => (
                <tr key={label} className="block py-3 sm:table-row">
                  <th
                    scope="row"
                    className="block pb-1 text-left align-top font-medium sm:table-cell sm:py-3 sm:pr-5"
                  >
                    {label}
                  </th>
                  <td className="block break-words text-muted-foreground sm:table-cell sm:py-3">
                    {criterion.feedback || 'Комментарий не получен.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {task.feedback && (
          <div className="text-foreground">
            <p className="text-base font-semibold mb-2">
              {'Общий комментарий'}
            </p>
            <p className="text-sm leading-relaxed">{task.feedback}</p>
          </div>
        )}

        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
          <div className="min-w-0">
            {taskAnswerText ? (
              <AnnotatedEssayView
                text={taskAnswerText}
                annotations={task.annotations ?? []}
              />
            ) : (
              <p role="status" className="text-sm text-muted-foreground">
                Текст ответа недоступен для этой сохранённой попытки.
              </p>
            )}
          </div>
          <div className="min-w-0">
            {task.modelParagraph && showModelAnswer ? (
              <ModelParagraphCard modelParagraph={task.modelParagraph} />
            ) : task.modelParagraph ? (
              <p className="text-sm text-[#69696d]">
                {modelAnswerAvailability === 'loading'
                  ? 'Проверяем доступность учебного цикла для этого задания…'
                  : modelAnswerAvailability === 'unavailable'
                    ? 'Учебные циклы сейчас недоступны. Пример скрыт; попробуйте обновить разбор позже. Ваш ответ и комментарии сохранены.'
                    : modelAnswerAvailability === 'no-cycle'
                      ? 'Для этого задания нет доступного учебного цикла правки. Сравнение с примером пока недоступно; ваш исходный ответ и комментарии доступны.'
                      : 'Сначала сохраните собственное исправление этого задания в учебном цикле. После этого можно сравнить его с примером.'}
              </p>
            ) : null}
          </div>
        </div>

        {learningAction}
        {task.strengths.length || task.improvements.length ? (
          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border">
            <FeedbackList title={'Сильные стороны'} items={task.strengths} />
            <FeedbackList title={'Что улучшить'} items={task.improvements} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-[#69696d]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
