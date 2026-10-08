import { isPublicBlogEnabled } from '@/features/blog/visibility'
import { createFileRoute } from '@tanstack/react-router'

import { listAllPublishedPosts } from '@/features/blog/api'
import { escapeXml, siteUrl } from '@/features/blog/seo'

export const Route = createFileRoute('/blog/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        if (!isPublicBlogEnabled())
          return new Response(null, {
            status: 404,
            headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
          })
        const posts = await listAllPublishedPosts()
        const entries = [
          { loc: siteUrl('/blog'), lastmod: posts[0]?.publishedAt ?? null },
          { loc: siteUrl('/blog/become-writer'), lastmod: null },
          ...posts.map((post) => ({
            loc: siteUrl(`/blog/${post.slug}`),
            lastmod: post.contentUpdatedAt ?? post.publishedAt,
          })),
        ]
        const body = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...entries.map(
            ({ loc, lastmod }) =>
              `  <url><loc>${escapeXml(loc)}</loc>${
                lastmod ? `<lastmod>${lastmod}</lastmod>` : ''
              }</url>`,
          ),
          '</urlset>',
        ].join('\n')
        return new Response(body, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=900',
          },
        })
      },
    },
  },
})
