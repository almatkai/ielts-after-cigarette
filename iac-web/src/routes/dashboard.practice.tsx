import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/practice')({
  component: EmptyPracticePage,
})

function EmptyPracticePage() {
  return null
}
