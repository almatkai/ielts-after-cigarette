import { createFileRoute } from '@tanstack/react-router'

import { PlanPage } from '@/pages/plan/ui/plan-page'

export const Route = createFileRoute('/_app/plan')({
  component: PlanPage,
})
