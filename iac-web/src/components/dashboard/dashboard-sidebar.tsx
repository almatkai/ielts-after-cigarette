import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { LogOut, ShieldCheck, X } from 'lucide-react'

import { Brand } from '@/components/landing/brand'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-store'
import { cn } from '@/lib/utils'

import {
  primaryDashboardNavigation,
  settingsDashboardNavigation,
} from './dashboard-navigation'

type DashboardSidebarProps = {
  id?: string
  onClose?: () => void
  onNavigate?: () => void
  className?: string
  mobile?: boolean
}

const navigationLinkClassName =
  'group flex min-h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium no-underline transition-colors'

const activeLinkClassName =
  'bg-blue-50 font-semibold text-slate-900 [&_svg]:text-blue-500 dark:bg-blue-500/10 dark:text-slate-100 dark:[&_svg]:text-blue-400'

const inactiveLinkClassName =
  'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'

const iconClassName =
  'size-[19px] shrink-0 text-slate-400 transition-colors group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'

export function DashboardSidebar({
  id,
  onClose,
  onNavigate,
  className,
  mobile = false,
}: DashboardSidebarProps) {
  const navigate = useNavigate()
  const auth = useAuth()
  const [logoutIsPending, setLogoutIsPending] = useState(false)

  const handleLogout = async () => {
    setLogoutIsPending(true)
    try {
      await auth.logout()
      onNavigate?.()
      await navigate({ to: '/login' })
    } finally {
      setLogoutIsPending(false)
    }
  }

  return (
    <aside
      id={id}
      className={cn(
        'flex h-full w-[268px] flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      style={{
        fontFamily:
          '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
      aria-label="Боковая навигация"
    >
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
        <Brand to="/dashboard" />
        {mobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Закрыть меню"
          >
            <X aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
        <p className="px-3.5 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Обучение
        </p>
        <nav className="space-y-1" aria-label="Основная навигация">
          {primaryDashboardNavigation.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                onClick={onNavigate}
                className={navigationLinkClassName}
                activeProps={{ className: activeLinkClassName }}
                inactiveProps={{ className: inactiveLinkClassName }}
              >
                <Icon className={iconClassName} strokeWidth={1.8} aria-hidden />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-slate-100 pt-4 dark:border-slate-800">
          {auth.hasAnyRole(['EDITOR', 'ADMIN']) ? (
            <Link
              to="/admin"
              onClick={onNavigate}
              className={navigationLinkClassName}
              inactiveProps={{ className: inactiveLinkClassName }}
            >
              <ShieldCheck
                className={iconClassName}
                strokeWidth={1.8}
                aria-hidden
              />
              <span>Администрирование</span>
            </Link>
          ) : null}
          <Link
            to={settingsDashboardNavigation.to}
            activeOptions={{ exact: settingsDashboardNavigation.exact }}
            onClick={onNavigate}
            className={navigationLinkClassName}
            activeProps={{ className: activeLinkClassName }}
            inactiveProps={{ className: inactiveLinkClassName }}
          >
            <settingsDashboardNavigation.icon
              className={iconClassName}
              strokeWidth={1.8}
              aria-hidden
            />
            <span>{settingsDashboardNavigation.label}</span>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <LogOut
                  className="size-[19px] shrink-0 text-slate-400 dark:text-slate-500"
                  strokeWidth={1.8}
                  aria-hidden
                />
                <span>Выйти</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <span className="mb-2 grid size-11 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                  <LogOut className="size-5" strokeWidth={1.8} aria-hidden />
                </span>
                <AlertDialogTitle>Выйти из аккаунта?</AlertDialogTitle>
                <AlertDialogDescription>
                  Чтобы продолжить подготовку, потребуется войти в аккаунт
                  снова.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-10 rounded-lg border-slate-300 bg-white px-5 shadow-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  Отмена
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={logoutIsPending}
                  onClick={() => void handleLogout()}
                  className="h-10 rounded-lg bg-red-500 px-5 text-white shadow-none hover:bg-red-600"
                >
                  {logoutIsPending ? 'Выходим…' : 'Выйти'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </aside>
  )
}
