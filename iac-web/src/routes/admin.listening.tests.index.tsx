import { createFileRoute } from '@tanstack/react-router'

import { ListeningTestsPage } from '@/pages/admin/listening/listening-tests-page'

export const Route = createFileRoute('/admin/listening/tests/')({
  component: ListeningTestsPage,
})
