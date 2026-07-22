import { Link } from '@tanstack/react-router'
import { LogOut, X } from 'lucide-react'

import { Brand } from '@/components/landing/brand'
import { Button } from '@/components/ui/button'
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
        <Brand />
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
          <Link
            to="/login"
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm font-medium text-[#69696d] no-underline transition-colors hover:bg-[#f4f4f1] hover:text-[#111111]"
          >
            <LogOut
              className="size-[19px] shrink-0 text-[#8b8b8e]"
              strokeWidth={1.8}
              aria-hidden
            />
            <span>Выйти</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
