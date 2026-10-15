import { isPublicBlogEnabled } from '@/features/blog/visibility'
import { createFileRoute, notFound } from '@tanstack/react-router'

import { publishedPostsQueryOptions } from '@/features/blog/api'
import {
  BLOG_SITE_NAME,
  blogDescription,
  blogTitle,
  jsonLd,
  siteUrl,
} from '@/features/blog/seo'
import { translate } from '@/lib/i18n'
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
        ? `${blogTitle()} — ${translate('страница')} ${page}`
        : translate('Блог Daiyndyq IELTS: стратегии и опыт подготовки к IELTS')
    const description = blogDescription()
    return {
      meta: [
        { title },
        { name: 'description', content: description },
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
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonical },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [
        { rel: 'canonical', href: canonical },
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: blogTitle(),
          href: siteUrl('/blog/rss.xml'),
        },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: blogTitle(),
            description,
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
