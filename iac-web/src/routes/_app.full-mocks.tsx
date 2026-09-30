import { createFileRoute } from '@tanstack/react-router'

import { FullMockLibraryPage } from '@/pages/fullmock/full-mock-library-page'

export const Route = createFileRoute('/_app/full-mocks')({
  component: FullMockLibraryPage,
})
