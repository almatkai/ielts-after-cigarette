import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Profile } from 'iconsax-react'

import { blogMediaUrl, getPublishedPost } from '@/features/blog/api'

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogPostPage() {
  const { slug } = useParams({ from: '/blog/$slug' })
  const postQuery = useQuery({
    queryKey: ['blog', 'posts', slug],
    queryFn: ({ signal }) => getPublishedPost(slug, signal),
  })

  if (postQuery.isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f7f5]">
        <p className="text-sm text-[#69696d]">Загружаем статью…</p>
      </div>
    )
  }

  if (postQuery.isError) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f7f5] px-6 text-center">
        <div>
          <p className="text-sm text-[#69696d]">
            Статья не найдена или ещё не опубликована.
          </p>
          <Link
            to="/blog"
            className="mt-4 inline-flex rounded-[10px] bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white no-underline"
          >
            Все статьи
          </Link>
        </div>
      </div>
    )
  }

  const post = postQuery.data
  const published = formatDate(post.publishedAt)
  const updated =
    post.contentUpdatedAt &&
    post.publishedAt &&
    new Date(post.contentUpdatedAt).getTime() >
      new Date(post.publishedAt).getTime() + 60_000
      ? formatDate(post.contentUpdatedAt)
      : null

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-[#e7e7e4] bg-white">
        <div className="mx-auto flex min-h-16 max-w-[760px] items-center px-5 sm:px-7">
          <Link
            to="/blog"
            className="flex items-center gap-2 text-sm font-semibold text-[#111111] no-underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Все статьи
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-[760px] px-5 py-10 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eff6ff] text-sm font-semibold text-[#1d4ed8]">
            {post.author.avatarInitial}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#111111]">
              <Profile className="size-4 text-[#1d4ed8]" aria-hidden />
              {post.author.displayName}
            </p>
            <p className="text-xs text-[#808084]">
              Подтверждённый автор · IELTS 7.5+
            </p>
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-4xl">
          {post.title}
        </h1>
        {post.description ? (
          <p className="mt-3 text-base leading-7 text-[#525256]">
            {post.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#808084]">
          {published ? <span>Опубликовано {published}</span> : null}
          {updated ? <span>· Обновлено {updated}</span> : null}
          <span>· {post.readingTimeMinutes} мин чтения</span>
        </div>

        {post.coverMediaId ? (
          <img
            src={blogMediaUrl(post.coverMediaId)}
            alt=""
            className="mt-6 w-full rounded-[16px] object-cover"
          />
        ) : null}

        <div
          className="blog-article mt-8"
          // The backend stores sanitized editor HTML written only by verified
          // writers and admins; no user-controlled raw HTML is accepted.
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />
      </article>
    </div>
  )
}
