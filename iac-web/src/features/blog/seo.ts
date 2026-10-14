import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestUrl } from '@tanstack/react-start/server'

export const BLOG_SITE_NAME = 'Daiyndyq IELTS'
export const BLOG_TITLE = `Блог ${BLOG_SITE_NAME}`
export const BLOG_DESCRIPTION =
  'Стратегии, разборы и личный опыт подготовки к IELTS от авторов с подтверждённым баллом 7.5+.'

// VITE_SITE_URL pins canonical URLs in production; otherwise the public origin
// comes from the proxied request on the server and the location in the browser.
const getSiteOrigin = createIsomorphicFn()
  .server(() => {
    const configured = import.meta.env.VITE_SITE_URL?.replace(/\/+$/, '')
    return (
      configured ??
      getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin
    )
  })
  .client(() => {
    const configured = import.meta.env.VITE_SITE_URL?.replace(/\/+$/, '')
    return configured ?? window.location.origin
  })

export function siteUrl(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '')
  return `${getSiteOrigin()}${base}${path}`
}

// Embedded JSON-LD must never close its own script tag.
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function formatBlogDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    // A fixed zone keeps server and browser renders identical.
    timeZone: 'Asia/Almaty',
  })
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
