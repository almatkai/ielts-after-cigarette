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
import { useLanguage } from '@/lib/i18n'

function PostStatusBadge({ post }: { post: BlogPostDto }) {
  const styles =
    post.status === 'PUBLISHED'
      ? 'bg-success-bg text-success'
      : post.status === 'ARCHIVED'
        ? 'bg-muted text-muted-foreground'
        : 'bg-primary-soft text-primary'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {post.status}
    </span>
  )
}

export function AdminBlogPostsPage() {
  const { t } = useLanguage()
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
        <h1 className="text-2xl font-semibold tracking-normal">
          {t('Статьи блога')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t(
            'Все статьи платформы: черновики авторов и опубликованные материалы. Опубликованная статья недоступна, если её заархивировать.',
          )}
        </p>
      </div>

      <div className="grid gap-3">
        {postsQuery.isPending ? (
          <p className="text-sm text-muted-foreground">{t('Загружаем…')}</p>
        ) : posts.length === 0 ? (
          <p className="rounded-[10px] border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            {t('Статей пока нет.')}
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-border bg-card p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <PostStatusBadge post={post} />
                  <span className="text-xs text-muted-foreground">
                    {post.author.displayName} ·{' '}
                    {new Date(post.updatedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="mt-1.5 block truncate text-base font-semibold text-foreground no-underline"
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
                    {t('Опубликовать')}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    disabled={archiveMutation.isPending}
                    onClick={() => archiveMutation.mutate(post.id)}
                  >
                    {t('В архив')}
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
