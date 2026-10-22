import { Edit2 } from 'iconsax-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnnotatedEssayView } from './annotated-essay-view'
import { ModelParagraphCard } from './model-paragraph-card'
import type { WritingTaskFeedback } from './api'

export function WritingTaskReview({
  task,
  taskAnswerText,
}: {
  task: WritingTaskFeedback
  taskAnswerText?: string
}) {
  return (
    <Card
      role="region"
      aria-label={`Writing Task ${task.position}`}
      className="rounded-[10px] border border-border bg-card shadow-none overflow-hidden"
    >
      <CardHeader className="border-b border-border bg-background/80 py-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-lg">
            <Edit2 className="size-4 text-primary" aria-hidden />
            Task {task.position}
          </CardTitle>
          <span className="rounded-md bg-primary-soft px-2.5 py-1 text-sm font-bold text-primary">
            Band {task.band.toFixed(1)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 sm:p-6 text-sm leading-6">
        <div>
          <p className="text-xs font-semibold normal-case text-muted-foreground mb-2">
            {'Оценки по критериям'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                task.position === 1 ? 'Task Achievement' : 'Task Response',
                task.criteria.taskResponse,
              ],
              ['Coherence & Cohesion', task.criteria.coherence],
              ['Lexical Resource', task.criteria.lexicalResource],
              ['Grammar Range & Accuracy', task.criteria.grammar],
            ].map(([label, criterion]) => {
              const typedCriterion = criterion as {
                band: number
                feedback: string
              }
              return (
                <div
                  key={label as string}
                  className="flex flex-col justify-between rounded-xl border border-border bg-background p-3.5 transition-all hover:border-border-strong"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold normal-case text-muted-foreground">
                      {label as string}
                    </span>
                    <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-xs font-bold text-primary">
                      {typedCriterion.band.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground">
                    {typedCriterion.feedback}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {task.feedback && (
          <div className="rounded-xl bg-background p-4 text-foreground">
            <p className="text-xs font-semibold normal-case text-muted-foreground mb-1">
              {'Общий комментарий'}
            </p>
            <p className="text-sm leading-relaxed">{task.feedback}</p>
          </div>
        )}

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

        {task.modelParagraph ? (
          <ModelParagraphCard modelParagraph={task.modelParagraph} />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
          <FeedbackList title={'Сильные стороны'} items={task.strengths} />
          <FeedbackList title={'Что улучшить'} items={task.improvements} />
        </div>
      </CardContent>
    </Card>
  )
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
