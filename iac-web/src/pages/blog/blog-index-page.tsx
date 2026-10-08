import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, DocumentText, Edit2 } from 'iconsax-react'

import { BlogShell } from '@/components/blog/blog-shell'
import {
  BLOG_PAGE_SIZE,
  blogMediaUrl,
  publishedPostsQueryOptions,
} from '@/features/blog/api'
import { formatBlogDate } from '@/features/blog/seo'

import type { BlogPostSummaryDto } from '@/features/blog/api'

const routeApi = getRouteApi('/blog/')

export function BlogIndexPage() {
  const { page } = routeApi.useLoaderDeps()
  const { data } = useSuspenseQuery(publishedPostsQueryOptions(page))
  const pageCount = Math.max(1, Math.ceil(data.total / BLOG_PAGE_SIZE))

  return (
    <BlogShell>
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.08em] text-[#3b82f6] uppercase">
          Блог
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Опыт и стратегии от авторов с IELTS 7.5+
        </h1>
        <p className="mt-3 text-base leading-7 text-[#69696d]">
          Разборы заданий, планы подготовки и личный опыт. Все статьи пишут
          авторы, чьи сертификаты IELTS проверила команда платформы.
        </p>
      </div>

      {data.items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-[16px] border border-[#e7e7e4] bg-white px-6 py-14 text-center">
          <DocumentText className="size-8 text-[#a0a0a4]" aria-hidden />
          <p className="text-sm text-[#69696d]">
            Статей пока нет — скоро здесь появятся первые публикации.
          </p>
          <Link
            to="/blog/become-writer"
            className="mt-2 text-sm font-semibold text-[#2563eb] no-underline hover:underline"
          >
            Хотите написать первую? Станьте автором
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {pageCount > 1 ? (
        <nav
          className="mt-10 flex items-center justify-between gap-4"
          aria-label="Страницы блога"
        >
          {page > 1 ? (
            <Link
              to="/blog"
              search={page > 2 ? { page: page - 1 } : {}}
              rel="prev"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#deded9] bg-white px-4 py-2 text-sm font-semibold text-[#111111] no-underline hover:bg-[#f4f4f1]"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Новее
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-[#808084]">
            Страница {page} из {pageCount}
          </span>
          {page < pageCount ? (
            <Link
              to="/blog"
              search={{ page: page + 1 }}
              rel="next"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#deded9] bg-white px-4 py-2 text-sm font-semibold text-[#111111] no-underline hover:bg-[#f4f4f1]"
            >
              Старее
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <section className="mt-14 flex flex-col items-start gap-4 rounded-[16px] border border-[#e7e7e4] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#eff6ff] text-[#2563eb]">
            <Edit2 className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold">
              Сдали IELTS на 7.5 или выше?
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#69696d]">
              Делитесь опытом с теми, кто готовится. Подтвердите сертификат и
              получите доступ к редактору.
            </p>
          </div>
        </div>
        <Link
          to="/blog/become-writer"
          className="shrink-0 rounded-[10px] bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#2563eb]"
        >
          Стать автором
        </Link>
      </section>
    </BlogShell>
  )
}

function PostCard({ post }: { post: BlogPostSummaryDto }) {
  const published = formatBlogDate(post.publishedAt)
  return (
    <article className="group flex flex-col overflow-hidden rounded-[16px] border border-[#e7e7e4] bg-white transition-colors hover:border-[#c9d8f5]">
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="flex flex-1 flex-col no-underline"
      >
        {post.coverMediaId ? (
          <img
            src={blogMediaUrl(post.coverMediaId)}
            alt=""
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div
            className="aspect-[16/9] w-full bg-gradient-to-br from-[#eff6ff] to-[#f7f7f5]"
            aria-hidden
          />
        )}
        <div className="flex flex-1 flex-col p-5">
          <h2 className="text-lg leading-snug font-semibold tracking-[-0.02em] text-[#111111] group-hover:text-[#2563eb]">
            {post.title}
          </h2>
          {post.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#69696d]">
              {post.description}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-xs text-[#808084]">
            <span className="font-semibold text-[#111111]">
              {post.author.displayName}
            </span>
            {published && post.publishedAt ? (
              <time dateTime={post.publishedAt}>· {published}</time>
            ) : null}
            <span>· {post.readingTimeMinutes} мин чтения</span>
          </div>
        </div>
      </Link>
    </article>
  )
}
