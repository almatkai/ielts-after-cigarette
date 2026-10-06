import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { DashboardHeader } from './dashboard-header'
import { getDashboardPageTitle } from './dashboard-navigation'
import { DashboardSidebar } from './dashboard-sidebar'
import { AiAssistantFloatingWidget } from './ai-assistant-widget'

type DashboardShellProps = {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
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
    <div className="min-h-screen bg-[#f7f7f5] text-[#111111]">
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
        <AiAssistantFloatingWidget />
      </div>
    </div>
  )
}
