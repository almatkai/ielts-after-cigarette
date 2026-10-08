import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import {
  archivePost,
  blogQueryKeys,
  listAdminBlogPosts,
  publishPost,
} from '@/features/blog/api'
import type { BlogPostDto } from '@/features/blog/api'
import { Button } from '@/components/ui/button'

function PostStatusBadge({ post }: { post: BlogPostDto }) {
  const styles =
    post.status === 'PUBLISHED'
      ? 'bg-[#ecfdf5] text-[#047857]'
      : post.status === 'ARCHIVED'
        ? 'bg-[#f4f4f1] text-[#69696d]'
        : 'bg-[#eff6ff] text-[#1d4ed8]'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {post.status}
    </span>
  )
}

export function AdminBlogPostsPage() {
  const queryClient = useQueryClient()

  const postsQuery = useQuery({
    queryKey: blogQueryKeys.adminPosts,
    queryFn: ({ signal }) => listAdminBlogPosts(signal),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: blogQueryKeys.adminPosts })
    void queryClient.invalidateQueries({ queryKey: blogQueryKeys.myPosts })
  }

  const publishMutation = useMutation({
    mutationFn: publishPost,
    onSuccess: invalidate,
  })

  const archiveMutation = useMutation({
    mutationFn: archivePost,
    onSuccess: invalidate,
  })

  const posts = postsQuery.data?.items ?? []

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">
          Статьи блога
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#69696d]">
          Все статьи платформы: черновики авторов и опубликованные материалы.
          Опубликованная статья недоступна, если её заархивировать.
        </p>
      </div>

      <div className="grid gap-3">
        {postsQuery.isPending ? (
          <p className="text-sm text-[#69696d]">Загружаем…</p>
        ) : posts.length === 0 ? (
          <p className="rounded-[16px] border border-[#e7e7e4] bg-white px-5 py-10 text-center text-sm text-[#69696d]">
            Статей пока нет.
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] border border-[#e7e7e4] bg-white p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <PostStatusBadge post={post} />
                  <span className="text-xs text-[#808084]">
                    {post.author.displayName} ·{' '}
                    {new Date(post.updatedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="mt-1.5 block truncate text-base font-semibold text-[#111111] no-underline"
                >
                  {post.title}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                {post.status !== 'PUBLISHED' ? (
                  <Button
                    variant="outline"
                    disabled={publishMutation.isPending}
                    onClick={() => publishMutation.mutate(post.id)}
                  >
                    Опубликовать
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    disabled={archiveMutation.isPending}
                    onClick={() => archiveMutation.mutate(post.id)}
                  >
                    В архив
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
