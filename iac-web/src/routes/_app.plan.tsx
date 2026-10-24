import { createFileRoute } from '@tanstack/react-router'

import { PlanPage } from '@/pages/plan/ui/plan-page'
import { parsePlanSearch } from '@/features/study-plan/calendar'

export const Route = createFileRoute('/_app/plan')({
  validateSearch: parsePlanSearch,
  component: PlanPage,
})
