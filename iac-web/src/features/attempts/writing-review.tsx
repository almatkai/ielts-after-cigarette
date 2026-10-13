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
        bandNote={'Score based on the 4 IELTS Writing criteria'}
        criteria={criteriaList}
        totalQuestions={totalQuestions}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        durationMinutes={durationMinutes}
        paceUnit={'essay'}
      />

      {evaluation.summary ? (
        <Card className="rounded-[16px] border border-[#e7e7e4] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {'Assessment summary'}
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
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

      <p className="flex items-center gap-2 text-xs text-[#808084]">
        <Book className="size-4" aria-hidden />
        {
          'This score is for practice only; your official IELTS result is determined by an examiner.'
        }
      </p>
    </div>
  )
}
