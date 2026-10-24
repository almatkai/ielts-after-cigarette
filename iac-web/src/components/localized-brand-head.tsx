import { useMatches } from '@tanstack/react-router'
import { useEffect } from 'react'
import { localizePageTitle, useLanguage } from '@/lib/i18n'

/** The locale is a device preference (not part of URLs or server API contracts).
 * Keep branded head content in sync after hydration and client navigation. */
export function LocalizedBrandHead() {
  const { language, t } = useLanguage()
  const matches = useMatches()
  const title = matches
    .flatMap((match) => match.meta ?? [])
    .reverse()
    .find((meta) => meta?.title)?.title
  useEffect(() => {
    if (typeof title === 'string')
      document.title = localizePageTitle(title, language)
    for (const image of document.querySelectorAll<HTMLMetaElement>(
      'meta[property="og:image"], meta[name="twitter:image"]',
    )) {
      if (/\/og-yrys(?:-kk)?\.png$/.test(image.content)) {
        image.content = image.content.replace(
          /og-yrys(?:-kk)?\.png$/,
          language === 'kk' ? 'og-yrys-kk.png' : 'og-yrys.png',
        )
      }
    }
    const alt = document.querySelector<HTMLMetaElement>(
      'meta[property="og:image:alt"]',
    )
    if (alt?.content.startsWith('Yrys Academy —'))
      alt.content = t('Yrys Academy — подготовка к IELTS онлайн')
  }, [language, matches, t, title])
  return null
}
