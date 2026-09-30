import { createFileRoute } from '@tanstack/react-router'

import { ListeningLibraryPage } from '@/pages/listening/listening-library-page'

export const Route = createFileRoute('/dashboard/listening')({
  component: ListeningLibraryPage,
})
