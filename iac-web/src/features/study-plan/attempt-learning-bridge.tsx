import { Link } from '@tanstack/react-router'
import { useLearning } from './learning-queries'
import { ArrowRight2 } from 'iconsax-react'
import { Button } from '@/components/ui/button'

// Parent-owned Writing reviews pass correctedTaskIds per task, never globally.
// Only a persisted, nonempty server correction unlocks a model paragraph.
export function useAttemptLearning(attemptId: string) {
  const query = useLearning()
  const cycles =
    !query.isError && Array.isArray(query.data?.cycles)
      ? query.data.cycles.filter((c) => c.source.attemptId === attemptId)
      : []
  return {
    ...query,
    cycles,
    correctedTaskIds: cycles
      .filter(
        (c) =>
          c.section === 'writing' &&
          !!c.source.questionId &&
          !!c.correction?.text.trim(),
      )
      .map((c) => c.source.questionId!),
  }
}
export function AttemptLearningBridge({
  attemptId,
  taskId,
  taskLabel,
}: {
  attemptId: string
  taskId?: string
  taskLabel?: string
}) {
  const learning = useAttemptLearning(attemptId)
  const cycles = taskId
    ? learning.cycles.filter((cycle) => cycle.source.questionId === taskId)
    : learning.cycles
  return cycles.length ? (
    <div className="flex flex-wrap gap-2">
      {cycles.map((cycle) => (
        <Button key={cycle.id} asChild variant="outline" className="min-h-11">
          <Link
            to="/plan/learning/cycles/$cycleId"
            params={{ cycleId: cycle.id }}
          >
            {taskLabel ? `${taskLabel} · ` : ''}
            {cycle.correction?.text.trim()
              ? 'Правка сохранена · открыть цикл'
              : 'Исправить эту ошибку'}
            <ArrowRight2 size={16} aria-hidden />
          </Link>
        </Button>
      ))}
    </div>
  ) : null
}
