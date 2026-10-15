import { isPublicBlogEnabled } from '@/features/blog/visibility'
import { createFileRoute, notFound } from '@tanstack/react-router'

import { BLOG_SITE_NAME, siteUrl } from '@/features/blog/seo'
import { translate } from '@/lib/i18n'
import { BecomeWriterPage } from '@/pages/blog/become-writer-page'

export const Route = createFileRoute('/blog/become-writer')({
  beforeLoad: () => {
    if (!isPublicBlogEnabled()) throw notFound()
  },
  ssr: true,
  head: () => {
    const title = `${translate('Стать автором блога')} — ${BLOG_SITE_NAME}`
    const description = translate(
      'Пишите статьи о подготовке к IELTS: подтвердите официальный балл 7.5+ и получите доступ к редактору блога.',
    )
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        {
          name: 'robots',
          content: isPublicBlogEnabled()
            ? 'index, follow'
            : 'noindex, nofollow',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: BLOG_SITE_NAME },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: siteUrl('/blog/become-writer') },
      ],
      links: [{ rel: 'canonical', href: siteUrl('/blog/become-writer') }],
    }
  },
  component: BecomeWriterPage,
})
