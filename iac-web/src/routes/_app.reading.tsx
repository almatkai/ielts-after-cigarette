import { createFileRoute } from '@tanstack/react-router'

import { ReadingLibraryPage } from '@/pages/reading/reading-library-page'

export const Route = createFileRoute('/dashboard/reading')({
  component: ReadingLibraryPage,
})
