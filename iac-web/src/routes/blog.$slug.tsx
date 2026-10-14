import { isPublicBlogEnabled } from '@/features/blog/visibility'
import { createFileRoute, notFound } from '@tanstack/react-router'

import {
  blogMediaAbsoluteUrl,
  publishedPostQueryOptions,
} from '@/features/blog/api'
import {
  BLOG_SITE_NAME,
  BLOG_TITLE,
  jsonLd,
  siteUrl,
} from '@/features/blog/seo'
import { ApiError } from '@/lib/api/client'
import { BlogPostNotFound, BlogPostPage } from '@/pages/blog/blog-post-page'

export const Route = createFileRoute('/blog/$slug')({
  beforeLoad: () => {
    if (!isPublicBlogEnabled()) throw notFound()
  },
  ssr: true,
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(
        publishedPostQueryOptions(params.slug),
      )
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound()
      throw error
    }
  },
  head: ({ loaderData: post, params }) => {
    if (!post) {
      return {
        meta: [
          { title: `Статья не найдена — ${BLOG_TITLE}` },
          { name: 'robots', content: 'noindex, follow' },
        ],
      }
    }
    const url = siteUrl(`/blog/${params.slug}`)
    const title = `${post.title} — ${BLOG_TITLE}`
    const description = post.description || BLOG_TITLE
    const image = post.coverMediaId
      ? blogMediaAbsoluteUrl(post.coverMediaId)
      : null
    const modified = post.contentUpdatedAt ?? post.publishedAt

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'author', content: post.author.displayName },
        {
          name: 'robots',
          content: isPublicBlogEnabled()
            ? 'index, follow, max-image-preview:large'
            : 'noindex, nofollow',
        },
        { property: 'og:type', content: 'article' },
        { property: 'og:site_name', content: BLOG_SITE_NAME },
        { property: 'og:locale', content: 'ru_RU' },
        { property: 'og:title', content: post.title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        ...(image ? [{ property: 'og:image', content: image }] : []),
        ...(post.publishedAt
          ? [{ property: 'article:published_time', content: post.publishedAt }]
          : []),
        ...(modified
          ? [{ property: 'article:modified_time', content: modified }]
          : []),
        { property: 'article:author', content: post.author.displayName },
        {
          name: 'twitter:card',
          content: image ? 'summary_large_image' : 'summary',
        },
        { name: 'twitter:title', content: post.title },
        { name: 'twitter:description', content: description },
        ...(image ? [{ name: 'twitter:image', content: image }] : []),
      ],
      links: [{ rel: 'canonical', href: url }],
      scripts: [
        {
          type: 'application/ld+json',
          children: jsonLd({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'BlogPosting',
                headline: post.title,
                description,
                url,
                mainEntityOfPage: url,
                inLanguage: 'ru',
                ...(image ? { image: [image] } : {}),
                datePublished: post.publishedAt ?? undefined,
                dateModified: modified ?? undefined,
                timeRequired: `PT${post.readingTimeMinutes}M`,
                author: { '@type': 'Person', name: post.author.displayName },
                publisher: { '@type': 'Organization', name: BLOG_SITE_NAME },
                isPartOf: { '@type': 'Blog', url: siteUrl('/blog') },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Блог',
                    item: siteUrl('/blog'),
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: post.title,
                    item: url,
                  },
                ],
              },
            ],
          }),
        },
      ],
    }
  },
  notFoundComponent: BlogPostNotFound,
  component: BlogPostPage,
})
