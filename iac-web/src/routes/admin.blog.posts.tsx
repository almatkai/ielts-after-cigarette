import { requireAdminPermission } from '@/features/auth/admin-access'
import { createFileRoute } from '@tanstack/react-router'

import { AdminBlogPostsPage } from '@/pages/admin/blog/admin-blog-posts-page'

export const Route = createFileRoute('/admin/blog/posts')({
  beforeLoad: ({ context }) =>
    requireAdminPermission(context.auth, 'BLOG_MODERATOR'),
  component: AdminBlogPostsPage,
})
