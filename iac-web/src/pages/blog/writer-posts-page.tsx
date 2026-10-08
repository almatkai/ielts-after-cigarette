import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { AddCircle, DocumentText } from 'iconsax-react'
import { useState } from 'react'

import {
  archivePost,
  blogQueryKeys,
  listMyPosts,
  publishPost,
} from '@/features/blog/api'
import { useAuth } from '@/features/auth/auth-store'
import { Button } from '@/components/ui/button'

function statusLabel(status: string) {
  switch (status) {
    case 'PUBLISHED':
      return { text: 'Опубликовано', className: 'bg-[#ecfdf5] text-[#047857]' }
    case 'ARCHIVED':
      return { text: 'В архиве', className: 'bg-[#f4f4f1] text-[#69696d]' }
    default:
      return { text: 'Черновик', className: 'bg-[#eff6ff] text-[#1d4ed8]' }
  }
}

export function WriterPostsPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const postsQuery = useQuery({
    queryKey: blogQueryKeys.myPosts,
    queryFn: ({ signal }) => listMyPosts(signal),
  })

  const publishMutation = useMutation({
    mutationFn: publishPost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: blogQueryKeys.myPosts })
    },
    onError: () => {
      setActionError(
        'Не удалось опубликовать: заполните заголовок и текст (минимум 100 символов).',
      )
    },
  })

  const archiveMutation = useMutation({
    mutationFn: archivePost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: blogQueryKeys.myPosts })
    },
  })

  const posts = postsQuery.data?.items ?? []

  if (!auth.user || !auth.accessToken) {
    void navigate({ to: '/login' })
  }

  return (
    <div className="mx-auto w-full max-w-[880px] min-w-0">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">
          Мои статьи
        </h1>
        <Button asChild>
          <Link to="/writer/posts/new">
            <AddCircle className="size-4" aria-hidden />
            Новая статья
          </Link>
        </Button>
      </div>

      {actionError ? (
        <p className="mt-4 rounded-[10px] bg-[#fef2f2] px-4 py-3 text-sm text-[#c92f2f]">
          {actionError}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3">
        {postsQuery.isPending ? (
          <p className="text-sm text-[#69696d]">Загружаем…</p>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[16px] border border-[#e7e7e4] bg-white px-6 py-14 text-center">
            <DocumentText className="size-8 text-[#a0a0a4]" aria-hidden />
            <p className="text-sm text-[#69696d]">
              У вас пока нет статей. Создайте первую!
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const status = statusLabel(post.status)
            return (
              <div
                key={post.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] border border-[#e7e7e4] bg-white p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.text}
                    </span>
                    <span className="text-xs text-[#808084]">
                      Изменена{' '}
                      {new Date(post.updatedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <h2 className="mt-1.5 truncate text-base font-semibold text-[#111111]">
                    {post.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <Link
                      to="/writer/posts/$postId"
                      params={{ postId: post.id }}
                    >
                      Редактировать
                    </Link>
                  </Button>
                  {post.status === 'DRAFT' ? (
                    <Button
                      variant="outline"
                      disabled={publishMutation.isPending}
                      onClick={() => publishMutation.mutate(post.id)}
                    >
                      Опубликовать
                    </Button>
                  ) : post.status === 'PUBLISHED' ? (
                    <>
                      <Button asChild variant="ghost">
                        <Link to="/blog/$slug" params={{ slug: post.slug }}>
                          Открыть
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={archiveMutation.isPending}
                        onClick={() => archiveMutation.mutate(post.id)}
                      >
                        В архив
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
