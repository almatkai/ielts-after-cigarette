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
  'group relative flex min-h-11 items-center gap-3 rounded-[10px] border-l-2 border-transparent px-3.5 text-sm font-medium no-underline transition-colors'

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
        'flex h-full w-[268px] flex-col border-r border-[#e7e7e4] bg-white',
        className,
      )}
      aria-label="Боковая навигация"
    >
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#eeeeeb] px-6">
        <Brand to="/dashboard" />
        {mobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-[9px] text-[#69696d]"
            aria-label="Закрыть меню"
          >
            <X aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
        <p className="px-3.5 pb-3 text-[11px] font-semibold tracking-[0.09em] text-[#9a9a9d] uppercase">
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
                activeProps={{
                  className:
                    'border-l-[#e23b3b] bg-[#fff0f0] text-[#111111] [&_svg]:text-[#e23b3b]',
                }}
                inactiveProps={{
                  className:
                    'text-[#69696d] hover:bg-[#f4f4f1] hover:text-[#111111]',
                }}
              >
                <Icon
                  className="size-[19px] shrink-0 text-[#8b8b8e] transition-colors"
                  strokeWidth={1.8}
                  aria-hidden
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-[#eeeeeb] pt-4">
          {auth.hasAnyRole(['EDITOR', 'ADMIN']) ? (
            <Link
              to="/admin"
              onClick={onNavigate}
              className={navigationLinkClassName}
              inactiveProps={{
                className:
                  'text-[#69696d] hover:bg-[#f4f4f1] hover:text-[#111111]',
              }}
            >
              <ShieldCheck
                className="size-[19px] shrink-0 text-[#8b8b8e] transition-colors"
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
            activeProps={{
              className:
                'border-l-[#e23b3b] bg-[#fff0f0] text-[#111111] [&_svg]:text-[#e23b3b]',
            }}
            inactiveProps={{
              className:
                'text-[#69696d] hover:bg-[#f4f4f1] hover:text-[#111111]',
            }}
          >
            <settingsDashboardNavigation.icon
              className="size-[19px] shrink-0 text-[#8b8b8e] transition-colors"
              strokeWidth={1.8}
              aria-hidden
            />
            <span>{settingsDashboardNavigation.label}</span>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-4 text-sm font-medium text-[#69696d] transition-colors hover:bg-[#f4f4f1] hover:text-[#111111]"
              >
                <LogOut
                  className="size-[19px] shrink-0 text-[#8b8b8e]"
                  strokeWidth={1.8}
                  aria-hidden
                />
                <span>Выйти</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <span className="mb-2 grid size-11 place-items-center rounded-[11px] bg-[#fff0f0] text-[#e23b3b]">
                  <LogOut className="size-5" strokeWidth={1.8} aria-hidden />
                </span>
                <AlertDialogTitle>Выйти из аккаунта?</AlertDialogTitle>
                <AlertDialogDescription>
                  Чтобы продолжить подготовку, потребуется войти в аккаунт
                  снова.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-10 rounded-[9px] border-[#deded9] bg-white px-5 shadow-none">
                  Отмена
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={logoutIsPending}
                  onClick={() => void handleLogout()}
                  className="h-10 rounded-[9px] bg-[#e23b3b] px-5 text-white shadow-none hover:bg-[#c92f2f]"
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
