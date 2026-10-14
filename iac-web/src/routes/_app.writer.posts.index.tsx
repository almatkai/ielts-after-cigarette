import { createFileRoute, redirect } from '@tanstack/react-router'

import { WriterPostsPage } from '@/pages/blog/writer-posts-page'

export const Route = createFileRoute('/_app/writer/posts/')({
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
    if (!context.auth.hasAnyRole(['WRITER', 'ADMIN'])) {
      throw redirect({ to: '/blog/become-writer' })
    }
  },
  component: WriterPostsPage,
})
