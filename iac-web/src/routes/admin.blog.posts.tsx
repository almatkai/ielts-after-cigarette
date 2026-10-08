import { createFileRoute } from '@tanstack/react-router'

import { AdminBlogPostsPage } from '@/pages/admin/blog/admin-blog-posts-page'

export const Route = createFileRoute('/admin/blog/posts')({
  component: AdminBlogPostsPage,
})
