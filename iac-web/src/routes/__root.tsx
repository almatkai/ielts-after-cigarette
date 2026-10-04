import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import { useEffect } from 'react'
import { reportError } from '@/lib/error-reporting'
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
        title: 'Daiyndyq IELTS — сдай IELTS выше 7.0 с первого раза',
      },
      {
        name: 'theme-color',
        content: '#FAFAF8',
      },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: `${import.meta.env.BASE_URL}favicon-32.png?v=2`,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: `${import.meta.env.BASE_URL}favicon-16.png?v=2`,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '256x256',
        href: `${import.meta.env.BASE_URL}favicon.png?v=2`,
      },
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: `${import.meta.env.BASE_URL}favicon.ico?v=2`,
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: `${import.meta.env.BASE_URL}apple-touch-icon.png?v=2`,
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
  useEffect(() => reportError(error, 'route'), [error])
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAFAF8] px-6 text-center">
      <h1 className="text-xl font-semibold text-[#111111]">
        Что-то пошло не так
      </h1>
      <p className="max-w-md text-sm leading-6 text-[#69696d]">
        Произошла непредвиденная ошибка. Попробуйте повторить действие или
        вернуться на главную.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[10px] bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]"
        >
          Повторить
        </button>
        <Link
          to="/"
          className="rounded-[10px] border border-[#deded9] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#f4f4f1]"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
