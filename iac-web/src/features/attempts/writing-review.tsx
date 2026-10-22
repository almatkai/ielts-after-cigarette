import { Book } from 'iconsax-react'
import { Card } from '@/components/ui/card'
import { AttemptPerformanceReport } from './attempt-ui'
import { WritingTaskReview } from './writing-task-review'
import type { AttemptDetail, WritingEvaluation } from './api'

export function WritingReview({
  attempt,
  evaluation,
  durationMinutes = 60,
  totalQuestions = evaluation.tasks.length,
}: {
  attempt: AttemptDetail
  durationMinutes?: number
  totalQuestions?: number
  evaluation: WritingEvaluation
}) {
  const criteriaList = [
    {
      label: 'Task Achievement / Response',
      band: evaluation.criteria.taskResponse.band,
    },
    { label: 'Coherence & Cohesion', band: evaluation.criteria.coherence.band },
    {
      label: 'Lexical Resource',
      band: evaluation.criteria.lexicalResource.band,
    },
    { label: 'Grammar Accuracy', band: evaluation.criteria.grammar.band },
  ] as const

  return (
    <div className="space-y-6">
      <AttemptPerformanceReport
        band={evaluation.overallBand}
        bandNote={'Оценка сформирована по 4 критериям IELTS Writing'}
        criteria={criteriaList}
        totalQuestions={totalQuestions}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        durationMinutes={durationMinutes}
        paceUnit={'эссе'}
      />

      {evaluation.summary ? (
        <Card className="rounded-[10px] border border-border bg-card p-5 shadow-none">
          <p className="text-xs font-semibold normal-case text-muted-foreground mb-1">
            {'Резюме проверки'}
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            {evaluation.summary}
          </p>
        </Card>
      ) : null}

      {[...evaluation.tasks]
        .sort((left, right) => left.position - right.position)
        .map((task) => {
          const taskAnswer = attempt.answers?.find(
            (answer) => answer.questionId === task.taskId,
          )
          const answerValue = taskAnswer?.answer.value
          const candidateText =
            typeof answerValue === 'string' ? answerValue : ''

          return (
            <WritingTaskReview
              key={task.taskId}
              task={task}
              taskAnswerText={candidateText}
            />
          )
        })}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Book className="size-4" aria-hidden />
        {
          'Оценка носит учебный характер; фактический результат IELTS определяет экзаменатор.'
        }
      </p>
    </div>
  )
}
