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
      className="rounded-[16px] border border-[#e7e7e4] bg-white shadow-xs overflow-hidden"
    >
      <CardHeader className="border-b border-slate-100 bg-[#fafafa]/80 py-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-slate-900 text-lg">
            <Edit2 className="size-4 text-[#3b82f6]" aria-hidden />
            Task {task.position}
          </CardTitle>
          <span className="rounded-md bg-blue-50 px-2.5 py-1 text-sm font-bold text-[#3b82f6]">
            Band {task.band.toFixed(1)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 sm:p-6 text-sm leading-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {'Criterion scores'}
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
                  className="flex flex-col justify-between rounded-xl border border-[#ecece8] bg-[#fbfbf9] p-3.5 transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {label as string}
                    </span>
                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-[#3b82f6]">
                      {typedCriterion.band.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700">
                    {typedCriterion.feedback}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {task.feedback && (
          <div className="rounded-xl bg-[#f7f7f5] p-4 text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {'Overall feedback'}
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
            The original answer is not available for this saved attempt.
          </p>
        )}

        {task.modelParagraph ? (
          <ModelParagraphCard modelParagraph={task.modelParagraph} />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
          <FeedbackList title={'Strengths'} items={task.strengths} />
          <FeedbackList title={'Areas to improve'} items={task.improvements} />
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
      <ul className="mt-1 list-disc pl-5 text-[#69696d]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
