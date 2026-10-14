import { useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { DashboardHeader } from './dashboard-header'
import { getDashboardPageTitle } from './dashboard-navigation'
import { DashboardSidebar } from './dashboard-sidebar'
import { AiAssistantFloatingWidget } from './ai-assistant-widget'
import { LoginDialog } from '@/components/auth/login-dialog'
import type { MouseEvent } from 'react'
import { useAuth } from '@/features/auth/auth-store'

const accountDestinations = [
  '/listening',
  '/reading',
  '/writing',
  '/speaking',
  '/plan',
  '/mistakes',
  '/progress',
  '/profile',
  '/settings',
] as const
type AccountDestination = (typeof accountDestinations)[number]

function isAccountDestination(path: string): path is AccountDestination {
  return accountDestinations.some((destination) => destination === path)
}

type DashboardShellProps = {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loginIsOpen, setLoginIsOpen] = useState(false)
  const [loginDestination, setLoginDestination] = useState<AccountDestination>()
  const loginTrigger = useRef<HTMLElement | null>(null)

  // All account-only links share this interaction boundary. Their normal hrefs
  // remain useful for new tabs; the API still enforces authentication.
  const requireLogin = (event: MouseEvent<HTMLDivElement>) => {
    if (
      user ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const anchor =
      event.target instanceof Element ? event.target.closest('a[href]') : null
    if (
      !(anchor instanceof HTMLAnchorElement) ||
      anchor.target === '_blank' ||
      anchor.hasAttribute('download')
    )
      return
    const url = new URL(anchor.href)
    if (url.origin !== window.location.origin) return
    const path = url.pathname.replace(/^\/app(?=\/|$)/, '') || '/'
    const destination = isAccountDestination(path) ? path : undefined
    const privatePage =
      destination &&
      !['/listening', '/reading', '/writing', '/speaking'].includes(destination)
    if (
      path !== '/login' &&
      !privatePage &&
      anchor.dataset.requiresAccount !== 'true'
    )
      return
    event.preventDefault()
    event.stopPropagation()
    loginTrigger.current = anchor
    setLoginDestination(destination)
    setNavigationIsOpen(false)
    setLoginIsOpen(true)
  }

  const completeLogin = async () => {
    setLoginIsOpen(false)
    if (loginDestination) await router.navigate({ to: loginDestination })
    await router.invalidate()
  }
  const [navigationIsOpen, setNavigationIsOpen] = useState(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const pageTitle = getDashboardPageTitle(pathname)

  useEffect(() => {
    if (!navigationIsOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavigationIsOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigationIsOpen])

  return (
    <div
      className="min-h-screen bg-[#f7f7f5] text-[#111111]"
      onClickCapture={requireLogin}
    >
      <DashboardSidebar className="fixed inset-y-0 left-0 z-40 hidden lg:flex" />

      {navigationIsOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setNavigationIsOpen(false)}
            aria-label="Закрыть меню"
          />
          <DashboardSidebar
            id="dashboard-mobile-navigation"
            mobile
            onClose={() => setNavigationIsOpen(false)}
            onNavigate={() => setNavigationIsOpen(false)}
            className="relative animate-in slide-in-from-left-5 duration-200"
          />
        </div>
      ) : null}

      <div className="min-h-screen lg:pl-[260px] min-w-0 overflow-x-clip">
        <DashboardHeader
          pageTitle={pageTitle}
          onOpenNavigation={() => setNavigationIsOpen(true)}
        />
        <main className="min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] p-3 sm:p-7 lg:p-9 min-w-0 max-w-full overflow-x-clip">
          {children}
        </main>
        {user ? <AiAssistantFloatingWidget /> : null}
      </div>
      <LoginDialog
        open={loginIsOpen}
        onOpenChange={setLoginIsOpen}
        onSuccess={completeLogin}
        trigger={loginTrigger.current}
      />
    </div>
  )
}
