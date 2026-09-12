import { createFileRoute } from '@tanstack/react-router'

import { FullMockListPage } from '@/pages/admin/fullmock/full-mock-list-page'

export const Route = createFileRoute('/admin/full-mocks/')({
  component: FullMockListPage,
})
