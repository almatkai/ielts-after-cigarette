import { THEME_INIT_SCRIPT, ThemeSync } from '@/features/theme/theme'
import { LocalizedBrandHead } from '@/components/localized-brand-head'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import { useEffect } from 'react'
import { PresenceBeacon } from '@/features/analytics/presence-beacon'
import { reportError } from '@/lib/error-reporting'
import { LanguageProvider, useLanguage, tr } from '@/lib/i18n'
import { NotFoundPage } from '@/pages/not-found/ui/not-found-page'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { AuthStore } from '@/features/auth/auth-store'

interface MyRouterContext {
  queryClient: QueryClient
  auth: AuthStore
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: tr('Yrys Academy — подготовка к IELTS онлайн'),
      },
      { property: 'og:site_name', content: 'Yrys Academy' },
      {
        property: 'og:image',
        content: 'https://ielts.academy-ai.kz/app/og-yrys.png',
      },
      {
        property: 'og:image:alt',
        content: 'Yrys Academy — Подготовка к IELTS онлайн',
      },
      {
        name: 'twitter:image',
        content: 'https://ielts.academy-ai.kz/app/og-yrys.png',
      },
    ],
    links: [
      {
        rel: 'manifest',
        href: `${import.meta.env.BASE_URL}manifest.webmanifest?v=3`,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: `${import.meta.env.BASE_URL}favicon-32.png?v=3`,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: `${import.meta.env.BASE_URL}favicon-16.png?v=3`,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '256x256',
        href: `${import.meta.env.BASE_URL}favicon.png?v=3`,
      },
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: `${import.meta.env.BASE_URL}favicon.ico?v=3`,
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: `${import.meta.env.BASE_URL}apple-touch-icon.png?v=3`,
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function RootErrorComponent({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const { t } = useLanguage()
  useEffect(() => reportError(error, 'route'), [error])
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">
        {t('Что-то пошло не так')}
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        {t(
          'Произошла непредвиденная ошибка. Попробуйте повторить действие или вернуться на главную.',
        )}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {t('Повторить')}
        </button>
        <Link
          to="/"
          className="rounded-[10px] border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          {t('На главную')}
        </Link>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#F6F7F5"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#121416"
        />
        <HeadContent />
      </head>
      <body>
        <ThemeSync />
        <LanguageProvider>
          <LocalizedBrandHead />
          {children}
        </LanguageProvider>
        <PresenceBeacon />
        <Scripts />
      </body>
    </html>
  )
}
