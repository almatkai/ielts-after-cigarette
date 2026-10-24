import { createFileRoute } from '@tanstack/react-router'
import {
  LearningDrillPage,
  parseLearningSearch,
} from '@/pages/plan/learning/drill-page'

export const Route = createFileRoute('/_app/plan_/learning_/drills/$drillId')({
  validateSearch: parseLearningSearch,
  component: LearningDrillPage,
})
