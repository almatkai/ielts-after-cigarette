import { createFileRoute } from '@tanstack/react-router'

import { ListeningLibraryPage } from '@/pages/listening/listening-library-page'

export const Route = createFileRoute('/_app/listening')({
  component: ListeningLibraryPage,
})
