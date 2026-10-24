import { AttemptPerformanceReport } from './attempt-ui'
import { WritingTaskReview } from './writing-task-review'
import type { AttemptDetail, WritingEvaluation } from './api'
import {
  AttemptLearningBridge,
  useAttemptLearning,
} from '@/features/study-plan/attempt-learning-bridge'
import { useLanguage } from '@/lib/i18n'

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
  const { t } = useLanguage()
  const learning = useAttemptLearning(attempt.id)
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
    {
      label: 'Grammatical Range & Accuracy',
      band: evaluation.criteria.grammar.band,
    },
  ] as const

  return (
    <div className="space-y-6">
      {evaluation.summary ? (
        <p className="text-sm leading-5 text-muted-foreground">
          {evaluation.summary}
        </p>
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
              learningAction={
                <AttemptLearningBridge
                  attemptId={attempt.id}
                  taskId={task.taskId}
                  taskLabel={`Task ${task.position}`}
                />
              }
              showModelAnswer={learning.correctedTaskIds.includes(task.taskId)}
              modelAnswerAvailability={
                learning.isPending
                  ? 'loading'
                  : learning.isError
                    ? 'unavailable'
                    : !learning.data.readOnly &&
                        learning.cycles.some(
                          (cycle) =>
                            cycle.section === 'writing' &&
                            cycle.source.questionId === task.taskId &&
                            !cycle.skippedAt,
                        )
                      ? 'correction-required'
                      : 'no-cycle'
              }
            />
          )
        })}

      <AttemptPerformanceReport
        showBand={false}
        band={evaluation.overallBand}
        bandNote={t(
          'Комментарии сгруппированы по четырём критериям Writing. Факты Task 1 нужно сверять с исходным графиком.',
        )}
        criteria={criteriaList}
        totalQuestions={totalQuestions}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        durationMinutes={durationMinutes}
        paceUnit="essay"
      />
    </div>
  )
}
