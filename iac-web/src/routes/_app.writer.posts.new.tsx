import { createFileRoute, redirect } from '@tanstack/react-router'

import { BlogPostEditorPage } from '@/pages/blog/blog-post-editor-page'

export const Route = createFileRoute('/_app/writer/posts/new')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
    if (!context.auth.hasAnyRole(['WRITER', 'EDITOR', 'ADMIN'])) {
      throw redirect({ to: '/blog/become-writer' })
    }
  },
  component: BlogPostEditorPage,
})
