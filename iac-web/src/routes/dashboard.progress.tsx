import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/progress')({
  component: EmptyProgressPage,
})

function EmptyProgressPage() {
  return null
}
