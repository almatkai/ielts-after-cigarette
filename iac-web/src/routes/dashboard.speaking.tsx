import { createFileRoute } from '@tanstack/react-router'

import { SpeakingLibraryPage } from '@/pages/speaking/speaking-library-page'

export const Route = createFileRoute('/dashboard/speaking')({
  component: SpeakingLibraryPage,
})
