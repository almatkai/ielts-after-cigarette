import { Link, useNavigate } from '@tanstack/react-router'
import {
  BookOpenText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-store'
import { useDashboardTheme } from '@/features/theme/theme'

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const navigationLinkClassName =
  'group flex min-h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium no-underline transition-colors'

const activeLinkClassName =
  'bg-blue-50 font-semibold text-slate-900 [&_svg]:text-blue-500 dark:bg-blue-500/10 dark:text-slate-100 dark:[&_svg]:text-blue-400'

const inactiveLinkClassName =
  'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'

const iconClassName =
  'size-[19px] shrink-0 text-slate-400 transition-colors group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [logoutIsPending, setLogoutIsPending] = useState(false)

  useDashboardTheme()

  const handleLogout = async () => {
    setLogoutIsPending(true)
    try {
      await auth.logout()
      await navigate({ to: '/login' })
    } finally {
      setLogoutIsPending(false)
    }
  }

  return (
    <div
      style={interFont}
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
              <ShieldCheck className="size-5" strokeWidth={1.8} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                IAC Admin
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                {auth.user?.displayName} · {auth.user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="hidden rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white hover:text-slate-900 sm:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            >
              <Link to="/dashboard">
                <LayoutDashboard aria-hidden />
                Кабинет студента
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={logoutIsPending}
              onClick={() => void handleLogout()}
              aria-label="Выйти из аккаунта"
              className="rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <LogOut aria-hidden />
              <span className="hidden sm:inline">
                {logoutIsPending ? 'Выходим…' : 'Выйти'}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-8">
        <nav
          aria-label="Администрирование"
          className="lg:sticky lg:top-6 lg:self-start"
        >
          <p className="px-3.5 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Администрирование
          </p>
          <div className="space-y-1">
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              className={navigationLinkClassName}
              activeProps={{ className: activeLinkClassName }}
              inactiveProps={{ className: inactiveLinkClassName }}
            >
              <ShieldCheck
                className={iconClassName}
                strokeWidth={1.8}
                aria-hidden
              />
              Обзор
            </Link>
            <Link
              to="/admin/reading/materials"
              className={navigationLinkClassName}
              activeProps={{ className: activeLinkClassName }}
              inactiveProps={{ className: inactiveLinkClassName }}
            >
              <BookOpenText
                className={iconClassName}
                strokeWidth={1.8}
                aria-hidden
              />
              Reading материалы
            </Link>
            {auth.user?.role === 'ADMIN' ? (
              <>
                <Link
                  to="/admin/waitlist"
                  className={navigationLinkClassName}
                  activeProps={{ className: activeLinkClassName }}
                  inactiveProps={{ className: inactiveLinkClassName }}
                >
                  <Users
                    className={iconClassName}
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  Waitlist
                </Link>
                <Link
                  to="/admin/admins"
                  className={navigationLinkClassName}
                  activeProps={{ className: activeLinkClassName }}
                  inactiveProps={{ className: inactiveLinkClassName }}
                >
                  <UserCog
                    className={iconClassName}
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  Администраторы
                </Link>
              </>
            ) : null}
          </div>
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
