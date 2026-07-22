import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings')({
  component: EmptySettingsPage,
})

function EmptySettingsPage() {
  return null
}
