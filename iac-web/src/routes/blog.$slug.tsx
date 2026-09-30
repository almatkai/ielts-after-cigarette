import { createFileRoute } from '@tanstack/react-router'

import { BlogPostPage } from '@/pages/blog/blog-post-page'

export const Route = createFileRoute('/blog/$slug')({
  ssr: true,
  component: BlogPostPage,
})
