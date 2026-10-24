import { createFileRoute } from '@tanstack/react-router'
import { LearningPage } from '@/pages/plan/learning/learning-page'
import { parseTaskSearch } from '@/features/study-plan/task-performance'

export const Route = createFileRoute('/_app/plan_/learning')({
  validateSearch: parseTaskSearch,
  component: LearningPage,
})
