import { createFileRoute } from '@tanstack/react-router'

import { ProgressPage } from '@/pages/progress/ui/progress-page'

export const Route = createFileRoute('/dashboard/progress')({
  component: ProgressPage,
})
