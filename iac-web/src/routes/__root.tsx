import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { NotFoundPage } from '@/pages/not-found/ui/not-found-page'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { AuthStore } from '@/features/auth/auth-store'

interface MyRouterContext {
  queryClient: QueryClient
  auth: AuthStore
}

const themeInitScript = `(function () {
  try {
    var preference = window.localStorage.getItem('iac-theme') || 'system'
    var isDark =
      preference === 'dark' ||
      (preference !== 'light' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    var isAppRoute = /(?:^|\\/)(dashboard|admin)(\\/|$)/.test(
      window.location.pathname,
    )
    if (isDark && isAppRoute) {
      document.documentElement.classList.add('dark')
    }
  } catch (error) {}
})()`

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
        title: 'IAC — современная подготовка к IELTS',
      },
      {
        name: 'theme-color',
        content: '#FAFAF8',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
    scripts: [{ children: themeInitScript }],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
