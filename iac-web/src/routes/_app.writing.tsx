import { createFileRoute } from '@tanstack/react-router'

import { WritingLibraryPage } from '@/pages/writing/writing-library-page'

export const Route = createFileRoute('/_app/writing')({
  component: WritingLibraryPage,
})
