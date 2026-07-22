import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/plan')({
  component: EmptyPlanPage,
})

function EmptyPlanPage() {
  return null
}
