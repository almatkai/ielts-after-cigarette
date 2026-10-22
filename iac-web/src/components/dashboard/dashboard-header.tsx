import {
  HambergerMenu,
  Notification,
  NotificationBing,
  User,
} from 'iconsax-react'
import { Link } from '@tanstack/react-router'

import { BrandLogo } from '@/components/landing/brand'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-store'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DashboardHeaderProps = {
  pageTitle: string | null
  onOpenNavigation: () => void
}

export function DashboardHeader({
  pageTitle,
  onOpenNavigation,
}: DashboardHeaderProps) {
  const { user } = useAuth()
  const accountName = user?.displayName.trim() || 'Аккаунт'

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center border-b border-border bg-card px-3 sm:px-6 lg:px-8 ">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenNavigation}
          className="shrink-0 rounded-[9px] text-muted-foreground lg:hidden"
          aria-label="Открыть меню"
          aria-controls="dashboard-mobile-navigation"
        >
          <HambergerMenu aria-hidden />
        </Button>
        <div className="shrink-0 lg:hidden">
          <BrandLogo to="/" />
        </div>
        <span className="hidden h-7 w-px bg-border sm:block lg:hidden" />
        {pageTitle ? (
          <div className="min-w-0 flex-1">
            <p className="hidden text-[10px] font-semibold text-muted-foreground normal-case lg:block">
              Рабочее пространство
            </p>
            <h1 className="truncate text-sm sm:text-base font-semibold tracking-normal text-foreground">
              {pageTitle}
            </h1>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-[9px] text-muted-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
              aria-label="Открыть уведомления"
            >
              <Notification aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-[calc(100vw-32px)] max-w-[360px] overflow-hidden p-0"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold tracking-[-0.015em] text-foreground">
                Уведомления
              </h2>
            </div>
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                <NotificationBing
                  className="size-5"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">
                Пока нет уведомлений
              </p>
              <p className="mt-1 max-w-[240px] text-xs leading-5 text-muted-foreground">
                Новые сообщения и напоминания появятся здесь.
              </p>
            </div>
          </PopoverContent>
        </Popover>
        <span className="mx-1 hidden h-7 w-px bg-border sm:block" />
        <Button
          asChild
          variant="ghost"
          className="h-9 sm:h-11 gap-1.5 sm:gap-2 rounded-[10px] px-2 text-foreground sm:px-3"
        >
          <Link
            to={user ? '/profile' : '/login'}
            aria-label={user ? 'Открыть профиль' : 'Войти в аккаунт'}
          >
            <span className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground">
              <User className="size-[17px]" strokeWidth={1.8} aria-hidden />
            </span>
            <span className="hidden text-sm font-semibold sm:inline">
              {user ? accountName : 'Войти в аккаунт'}
            </span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
