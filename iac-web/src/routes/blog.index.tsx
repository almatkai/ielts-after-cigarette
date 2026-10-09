import { isPublicBlogEnabled } from '@/features/blog/visibility'
import { createFileRoute, notFound } from '@tanstack/react-router'

import { publishedPostsQueryOptions } from '@/features/blog/api'
import {
  BLOG_DESCRIPTION,
  BLOG_SITE_NAME,
  BLOG_TITLE,
  jsonLd,
  siteUrl,
} from '@/features/blog/seo'
import { BlogIndexPage } from '@/pages/blog/blog-index-page'

export const Route = createFileRoute('/blog/')({
  beforeLoad: () => {
    if (!isPublicBlogEnabled()) throw notFound()
  },
  ssr: true,
  validateSearch: (search: Record<string, unknown>): { page?: number } => {
    const page = Number(search.page)
    return Number.isInteger(page) && page > 1 ? { page } : {}
  },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(publishedPostsQueryOptions(deps.page)),
  head: ({ match }) => {
    const page = match.loaderDeps.page
    const canonical = siteUrl(page > 1 ? `/blog?page=${page}` : '/blog')
    const title =
      page > 1
        ? `${BLOG_TITLE} — страница ${page}`
        : `${BLOG_TITLE}: стратегии и опыт подготовки к IELTS`
    return {
      meta: [
        { title },
        { name: 'description', content: BLOG_DESCRIPTION },
        {
          name: 'robots',
          content: isPublicBlogEnabled()
            ? 'index, follow, max-image-preview:large'
            : 'noindex, nofollow',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: BLOG_SITE_NAME },
        { property: 'og:locale', content: 'ru_RU' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: BLOG_DESCRIPTION },
        { property: 'og:url', content: canonical },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: BLOG_DESCRIPTION },
      ],
      links: [
        { rel: 'canonical', href: canonical },
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: BLOG_TITLE,
          href: siteUrl('/blog/rss.xml'),
        },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: BLOG_TITLE,
            description: BLOG_DESCRIPTION,
            url: siteUrl('/blog'),
            inLanguage: 'ru',
            publisher: { '@type': 'Organization', name: BLOG_SITE_NAME },
          }),
        },
      ],
    }
  },
  component: BlogIndexPage,
})
