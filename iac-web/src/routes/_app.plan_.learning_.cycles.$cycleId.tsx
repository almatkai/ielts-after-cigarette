import { createFileRoute } from '@tanstack/react-router'
import { LearningCyclePage } from '@/pages/plan/learning/cycle-page'

export const Route = createFileRoute('/_app/plan_/learning_/cycles/$cycleId')({
  component: LearningCyclePage,
})
