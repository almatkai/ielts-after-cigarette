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
import { useLanguage } from '@/lib/i18n'

import type { BlogPostSummaryDto } from '@/features/blog/api'

const routeApi = getRouteApi('/blog/')

export function BlogIndexPage() {
  const { t } = useLanguage()
  const { page } = routeApi.useLoaderDeps()
  const { data } = useSuspenseQuery(publishedPostsQueryOptions(page))
  const pageCount = Math.max(1, Math.ceil(data.total / BLOG_PAGE_SIZE))

  return (
    <BlogShell>
      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-primary normal-case">
          {t('Блог')}
        </p>
        <h1 className="text-[28px] sm:text-[36px] mt-2 font-semibold tracking-normal sm:text-4xl">
          {t('Опыт и стратегии от авторов с IELTS 7.5+')}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {t(
            'Разборы заданий, планы подготовки и личный опыт. Все статьи пишут авторы, чьи сертификаты IELTS проверила команда платформы.',
          )}
        </p>
      </div>

      {data.items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-[10px] border border-border bg-card px-6 py-14 text-center">
          <DocumentText className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {t('Статей пока нет — скоро здесь появятся первые публикации.')}
          </p>
          <Link
            to="/blog/become-writer"
            className="mt-2 text-sm font-semibold text-primary-hover no-underline hover:underline"
          >
            {t('Хотите написать первую? Станьте автором')}
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
          aria-label={t('Страницы блога')}
        >
          {page > 1 ? (
            <Link
              to="/blog"
              search={page > 2 ? { page: page - 1 } : {}}
              rel="prev"
              className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground no-underline hover:bg-muted"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t('Новее')}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            {t('Страница {page} из {pageCount}')
              .replace('{page}', String(page))
              .replace('{pageCount}', String(pageCount))}
          </span>
          {page < pageCount ? (
            <Link
              to="/blog"
              search={{ page: page + 1 }}
              rel="next"
              className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground no-underline hover:bg-muted"
            >
              {t('Старее')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <section className="mt-14 flex flex-col items-start gap-4 rounded-[10px] border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary-hover">
            <Edit2 className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold">
              {t('Сдали IELTS на 7.5 или выше?')}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t(
                'Делитесь опытом с теми, кто готовится. Подтвердите сертификат и получите доступ к редактору.',
              )}
            </p>
          </div>
        </div>
        <Link
          to="/blog/become-writer"
          className="shrink-0 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground no-underline transition-colors hover:bg-primary-hover"
        >
          {t('Стать автором')}
        </Link>
      </section>
    </BlogShell>
  )
}

function PostCard({ post }: { post: BlogPostSummaryDto }) {
  const { t } = useLanguage()
  const published = formatBlogDate(post.publishedAt)
  return (
    <article className="group flex flex-col overflow-hidden rounded-[10px] border border-border bg-card transition-colors hover:border-primary-soft">
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
            className="flex aspect-[16/9] w-full items-center bg-muted p-6 font-display text-xl font-semibold text-foreground"
            aria-hidden
          >
            {post.title}
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          <h2 className="text-lg leading-snug font-semibold tracking-[-0.02em] text-foreground group-hover:text-primary-hover">
            {post.title}
          </h2>
          {post.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {post.description}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {post.author.displayName}
            </span>
            {published && post.publishedAt ? (
              <time dateTime={post.publishedAt}>· {published}</time>
            ) : null}
            <span>
              ·{' '}
              {t('{count} мин чтения').replace(
                '{count}',
                String(post.readingTimeMinutes),
              )}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
