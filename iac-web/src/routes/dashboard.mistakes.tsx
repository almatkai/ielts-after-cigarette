import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/mistakes')({
  component: EmptyMistakesPage,
})

function EmptyMistakesPage() {
  return null
}
