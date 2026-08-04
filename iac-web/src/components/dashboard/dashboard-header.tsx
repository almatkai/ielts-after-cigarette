import { Link } from '@tanstack/react-router'
import { Bell, BellOff, Menu, UserRound } from 'lucide-react'

import { Brand } from '@/components/landing/brand'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-store'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DashboardHeaderProps = {
  pageTitle: string
  onOpenNavigation: () => void
}

export function DashboardHeader({
  pageTitle,
  onOpenNavigation,
}: DashboardHeaderProps) {
  const { user } = useAuth()
  const accountName = user?.displayName.trim() || 'Аккаунт'

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-[#e7e7e4] bg-[rgba(255,255,255,0.92)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenNavigation}
          className="rounded-[9px] text-[#69696d] lg:hidden"
          aria-label="Открыть меню"
          aria-controls="dashboard-mobile-navigation"
        >
          <Menu aria-hidden />
        </Button>
        <div className="lg:hidden">
          <Brand to="/dashboard" />
        </div>
        <span className="hidden h-7 w-px bg-[#e7e7e4] sm:block lg:hidden" />
        <div className="min-w-0">
          <p className="hidden text-[11px] font-semibold tracking-[0.08em] text-[#9a9a9d] uppercase lg:block">
            Рабочее пространство
          </p>
          <h1 className="truncate text-base font-semibold tracking-[-0.025em] text-[#111111] sm:text-lg">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-[9px] text-[#69696d] data-[state=open]:bg-[#f4f4f1] data-[state=open]:text-[#111111]"
              aria-label="Открыть уведомления"
            >
              <Bell aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-[calc(100vw-32px)] max-w-[360px] overflow-hidden p-0"
          >
            <div className="border-b border-[#ededeb] px-5 py-4">
              <h2 className="text-sm font-semibold tracking-[-0.015em] text-[#111111]">
                Уведомления
              </h2>
            </div>
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-[#f4f4f1] text-[#8b8b8e]">
                <BellOff className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <p className="mt-4 text-sm font-semibold text-[#111111]">
                Пока нет уведомлений
              </p>
              <p className="mt-1 max-w-[240px] text-xs leading-5 text-[#808084]">
                Новые сообщения и напоминания появятся здесь.
              </p>
            </div>
          </PopoverContent>
        </Popover>
        <span className="mx-1 hidden h-7 w-px bg-[#e7e7e4] sm:block" />
        <Button
          asChild
          variant="ghost"
          className="h-11 gap-2 rounded-[10px] px-2.5 text-[#111111] sm:px-3"
        >
          <Link to="/dashboard/profile" aria-label="Открыть профиль">
            <span className="grid size-8 place-items-center rounded-full bg-[#f4f4f1] text-[#69696d]">
              <UserRound
                className="size-[17px]"
                strokeWidth={1.8}
                aria-hidden
              />
            </span>
            <span className="hidden text-sm font-semibold sm:inline">
              {accountName}
            </span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
