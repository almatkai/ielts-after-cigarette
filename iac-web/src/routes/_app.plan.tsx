import { createFileRoute } from '@tanstack/react-router'

import { PlanPage } from '@/pages/plan/ui/plan-page'

export const Route = createFileRoute('/dashboard/plan')({
  component: PlanPage,
})
