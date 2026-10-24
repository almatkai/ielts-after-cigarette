import { CloseSquare, Logout, ShieldTick } from 'iconsax-react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { SidebarProgress } from './sidebar-progress'
import { BrandLogo } from '@/components/landing/brand'
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
import { useLanguage } from '@/lib/i18n'

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
  'group relative flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 text-sm font-medium no-underline transition-colors'

const activeNavigationClassName =
  'bg-primary-soft font-semibold text-primary [&_svg]:text-primary'

export function DashboardSidebar({
  id,
  onClose,
  onNavigate,
  className,
  mobile = false,
}: DashboardSidebarProps) {
  const navigate = useNavigate()
  const auth = useAuth()
  const { t } = useLanguage()
  const [logoutIsPending, setLogoutIsPending] = useState(false)

  const location = useLocation()

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
      aria-label={t('Основная навигация приложения')}
      className={cn(
        'flex h-full w-[260px] flex-col border-r border-border bg-card',
        className,
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <BrandLogo />
        {mobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-[9px] text-muted-foreground"
            aria-label={t('Закрыть меню')}
          >
            <CloseSquare aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
        <nav className="space-y-1" aria-label={t('Основная навигация')}>
          {primaryDashboardNavigation.map((item) => {
            const Icon = item.icon
            const isRelatedActive =
              item.to === '/practice' &&
              (location.pathname.startsWith('/listening') ||
                location.pathname.startsWith('/reading') ||
                location.pathname.startsWith('/writing') ||
                location.pathname.startsWith('/speaking') ||
                location.pathname.startsWith('/full-mocks'))

            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                onClick={onNavigate}
                className={cn(
                  navigationLinkClassName,
                  isRelatedActive && activeNavigationClassName,
                )}
                activeProps={{
                  className: activeNavigationClassName,
                }}
                inactiveProps={{
                  className: isRelatedActive
                    ? undefined
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                }}
              >
                <Icon
                  className="size-[19px] shrink-0 text-muted-foreground transition-colors"
                  strokeWidth={1.8}
                  aria-hidden
                />
                <span>{t(item.label)}</span>
              </Link>
            )
          })}
        </nav>

        {auth.user ? (
          <SidebarProgress onNavigate={onNavigate} />
        ) : (
          <section className="mt-auto px-3.5 py-8 text-xs leading-5 text-muted-foreground">
            {t(
              'Один Full Mock доступен бесплатно. Для других тестов и сохранения прогресса войдите в аккаунт.',
            )}
          </section>
        )}

        <div className="shrink-0 space-y-1 border-t border-border pt-4">
          {auth.canAccessAdmin() ? (
            <Link
              to="/admin"
              onClick={onNavigate}
              className={navigationLinkClassName}
              activeProps={{
                className: activeNavigationClassName,
              }}
              inactiveProps={{
                className:
                  'text-muted-foreground hover:bg-muted hover:text-foreground',
              }}
            >
              <ShieldTick
                className="size-[19px] shrink-0 text-muted-foreground transition-colors"
                strokeWidth={1.8}
                aria-hidden
              />
              <span>{t('Администрирование')}</span>
            </Link>
          ) : null}
          <Link
            to={settingsDashboardNavigation.to}
            activeOptions={{ exact: settingsDashboardNavigation.exact }}
            onClick={onNavigate}
            className={navigationLinkClassName}
            activeProps={{
              className: activeNavigationClassName,
            }}
            inactiveProps={{
              className:
                'text-muted-foreground hover:bg-muted hover:text-foreground',
            }}
          >
            <settingsDashboardNavigation.icon
              className="size-[19px] shrink-0 text-muted-foreground transition-colors"
              strokeWidth={1.8}
              aria-hidden
            />
            <span>{t(settingsDashboardNavigation.label)}</span>
          </Link>
          {auth.user ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Logout
                    className="size-[19px] shrink-0 text-muted-foreground"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  <span>{t('Выйти')}</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <span className="mb-2 grid size-11 place-items-center rounded-[10px] bg-primary-soft text-primary">
                    <Logout className="size-5" strokeWidth={1.8} aria-hidden />
                  </span>
                  <AlertDialogTitle>{t('Выйти из аккаунта?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      'Чтобы продолжить подготовку, потребуется войти в аккаунт снова.',
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-10 rounded-[9px] border-border bg-card px-5 shadow-none">
                    {t('Отмена')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={logoutIsPending}
                    onClick={() => void handleLogout()}
                    className="h-10 rounded-[9px] bg-primary px-5 text-primary-foreground shadow-none hover:bg-primary-hover"
                  >
                    {logoutIsPending ? t('Выходим…') : t('Выйти')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button asChild className="mt-3 w-full">
              <Link to="/login" onClick={onNavigate}>
                {t('Войти в аккаунт')}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
