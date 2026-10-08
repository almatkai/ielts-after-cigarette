import { createFileRoute } from '@tanstack/react-router'

import { listPublishedPosts } from '@/features/blog/api'
import {
  BLOG_DESCRIPTION,
  BLOG_TITLE,
  escapeXml,
  siteUrl,
} from '@/features/blog/seo'

export const Route = createFileRoute('/blog/rss.xml')({
  server: {
    handlers: {
      GET: async () => {
        const { items } = await listPublishedPosts(50, 0)
        const blogUrl = siteUrl('/blog')
        const body = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
          '<channel>',
          `<title>${escapeXml(BLOG_TITLE)}</title>`,
          `<link>${escapeXml(blogUrl)}</link>`,
          `<description>${escapeXml(BLOG_DESCRIPTION)}</description>`,
          '<language>ru</language>',
          `<atom:link href="${escapeXml(siteUrl('/blog/rss.xml'))}" rel="self" type="application/rss+xml"/>`,
          ...items.map((post) => {
            const url = escapeXml(siteUrl(`/blog/${post.slug}`))
            return [
              '<item>',
              `<title>${escapeXml(post.title)}</title>`,
              `<link>${url}</link>`,
              `<guid isPermaLink="true">${url}</guid>`,
              `<description>${escapeXml(post.description)}</description>`,
              `<dc:creator>${escapeXml(post.author.displayName)}</dc:creator>`,
              post.publishedAt
                ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`
                : '',
              '</item>',
            ].join('')
          }),
          '</channel>',
          '</rss>',
        ].join('\n')
        return new Response(body, {
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=900',
          },
        })
      },
    },
  },
})
