import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: EmptyDashboardPage,
})

function EmptyDashboardPage() {
  return null
}
