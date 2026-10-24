import type { LearningCycle, TaskPerformance } from './learning-api'

export type TaskSearch = {
  section?: 'reading' | 'listening'
  type?: string
}
export function parseTaskSearch(search: Record<string, unknown>): TaskSearch {
  const section =
    search.section === 'reading' || search.section === 'listening'
      ? search.section
      : undefined
  return {
    section,
    type:
      section && typeof search.type === 'string' && search.type.trim()
        ? search.type
        : undefined,
  }
}
export function matchesTask(cycle: LearningCycle, search: TaskSearch) {
  return (
    (!search.section || cycle.section === search.section) &&
    (!search.type ||
      (cycle.source.questionType === search.type &&
        !!cycle.source.attemptId.trim()))
  )
}
export function taskTitle(
  task: Pick<TaskPerformance, 'title' | 'questionType'>,
) {
  return (
    task.title.trim() ||
    task.questionType.replace(/[_-]+/g, ' ').trim() ||
    'Другой тип задания'
  )
}
export function orderTasks(a: TaskPerformance, b: TaskPerformance) {
  return (
    (a.section === b.section ? 0 : a.section === 'reading' ? -1 : 1) ||
    b.incorrect - a.incorrect ||
    b.sourceCount - a.sourceCount ||
    taskTitle(a).localeCompare(taskTitle(b))
  )
}
