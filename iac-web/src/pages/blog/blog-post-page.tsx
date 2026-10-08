import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { DocumentText } from 'iconsax-react'

import { BlogBackLink, BlogShell } from '@/components/blog/blog-shell'
import { blogMediaUrl, publishedPostQueryOptions } from '@/features/blog/api'
import { landingHref } from '@/features/blog/links'
import { formatBlogDate } from '@/features/blog/seo'

const routeApi = getRouteApi('/blog/$slug')

export function BlogPostPage() {
  const { slug } = routeApi.useParams()
  const { data: post } = useSuspenseQuery(publishedPostQueryOptions(slug))

  const published = formatBlogDate(post.publishedAt)
  const updated =
    post.contentUpdatedAt &&
    post.publishedAt &&
    new Date(post.contentUpdatedAt).getTime() >
      new Date(post.publishedAt).getTime() + 60_000
      ? formatBlogDate(post.contentUpdatedAt)
      : null

  return (
    <BlogShell width="narrow">
      <nav aria-label="Навигационная цепочка">
        <BlogBackLink to="/blog">Все статьи</BlogBackLink>
      </nav>

      <article className="mt-5 rounded-[20px] border border-[#e7e7e4] bg-white px-5 py-8 sm:px-10 sm:py-10">
        <header>
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.04em] text-[#111111] sm:text-[2.6rem]">
            {post.title}
          </h1>
          {post.description ? (
            <p className="mt-4 text-lg leading-8 text-[#525256]">
              {post.description}
            </p>
          ) : null}

          <div className="mt-6 flex items-center gap-3 border-y border-[#e7e7e4] py-4">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eff6ff] text-sm font-semibold text-[#1d4ed8]"
              aria-hidden
            >
              {post.author.avatarInitial ||
                post.author.displayName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111111]">
                {post.author.displayName}
                <span className="ml-2 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-medium text-[#047857]">
                  IELTS 7.5+ подтверждён
                </span>
              </p>
              <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-[#808084]">
                {published && post.publishedAt ? (
                  <time dateTime={post.publishedAt}>{published}</time>
                ) : null}
                {updated && post.contentUpdatedAt ? (
                  <span>
                    · обновлено{' '}
                    <time dateTime={post.contentUpdatedAt}>{updated}</time>
                  </span>
                ) : null}
                <span>· {post.readingTimeMinutes} мин чтения</span>
              </p>
            </div>
          </div>
        </header>

        {post.coverMediaId ? (
          <img
            src={blogMediaUrl(post.coverMediaId)}
            alt=""
            className="mt-8 w-full rounded-[16px] object-cover"
          />
        ) : null}

        <div
          className="blog-article mt-8"
          // The backend stores sanitized editor HTML written only by verified
          // writers and admins; no user-controlled raw HTML is accepted.
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />
      </article>

      <section className="mt-6 rounded-[20px] border border-[#e7e7e4] bg-white p-6">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">
          Готовитесь к IELTS?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#69696d]">
          Тренируйте Listening, Reading, Writing и Speaking на реальных форматах
          заданий с AI-проверкой и разбором ошибок.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={landingHref}
            className="rounded-[10px] bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#2563eb]"
          >
            Начать подготовку
          </a>
          <Link
            to="/blog"
            className="rounded-[10px] border border-[#deded9] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] no-underline transition-colors hover:bg-[#f4f4f1]"
          >
            Другие статьи
          </Link>
        </div>
      </section>
    </BlogShell>
  )
}

export function BlogPostNotFound() {
  return (
    <BlogShell width="narrow">
      <div className="flex flex-col items-center gap-3 rounded-[16px] border border-[#e7e7e4] bg-white px-6 py-14 text-center">
        <DocumentText className="size-8 text-[#a0a0a4]" aria-hidden />
        <h1 className="text-lg font-semibold">Статья не найдена</h1>
        <p className="text-sm text-[#69696d]">
          Возможно, её сняли с публикации или ссылка устарела.
        </p>
        <Link
          to="/blog"
          className="mt-2 rounded-[10px] bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white no-underline"
        >
          Все статьи
        </Link>
      </div>
    </BlogShell>
  )
}
