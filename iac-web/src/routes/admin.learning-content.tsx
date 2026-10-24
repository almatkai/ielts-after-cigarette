import { createFileRoute, redirect } from '@tanstack/react-router'
import { LearningContentPage } from '@/pages/admin/learning-content-page'

export const Route = createFileRoute('/admin/learning-content')({
  beforeLoad: ({ context }) => {
    if (!context.auth.hasAnyRole(['ADMIN']))
      throw redirect({ to: '/forbidden' })
  },
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    section?: string
    status?: string
    kind?: string
    q?: string
    ref?: string
    version?: string
  } =>
    Object.fromEntries(
      ['section', 'status', 'kind', 'q', 'ref', 'version'].flatMap((key) =>
        typeof search[key] === 'string' && search[key]
          ? [[key, search[key]]]
          : [],
      ),
    ),
  component: LearningContentPage,
})
