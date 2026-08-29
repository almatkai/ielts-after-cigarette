import { Link, useNavigate } from '@tanstack/react-router'
import {
  BookOpenText,
  Headphones,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-store'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [logoutIsPending, setLogoutIsPending] = useState(false)

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
    <div className="min-h-screen bg-[#f7f7f5] text-[#111111]">
      <header className="border-b border-[#e7e7e4] bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#111111] text-white">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">IAC Admin</p>
              <p className="truncate text-xs text-[#808084]">
                {auth.user?.displayName} · {auth.user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="hidden sm:inline-flex">
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
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            className="flex min-h-11 items-center gap-3 rounded-[10px] bg-[#eff6ff] px-4 text-sm font-semibold text-[#1d4ed8] no-underline"
          >
            <ShieldCheck className="size-[18px]" aria-hidden />
            Обзор
          </Link>
          <Link
            to="/admin/reading/materials"
            activeProps={{
              className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
            }}
            inactiveProps={{
              className: 'text-[#69696d] hover:bg-[#f4f4f1]',
            }}
            className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
          >
            <BookOpenText className="size-[18px]" aria-hidden />
            Reading материалы
          </Link>
          <Link
            to="/admin/listening/tests"
            activeProps={{
              className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
            }}
            inactiveProps={{ className: 'text-[#69696d] hover:bg-[#f4f4f1]' }}
            className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
          >
            <Headphones className="size-[18px]" aria-hidden />
            Listening тесты
          </Link>
          {auth.user?.role === 'ADMIN' ? (
            <>
              <Link
                to="/admin/waitlist"
                activeProps={{
                  className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
                }}
                inactiveProps={{
                  className: 'text-[#69696d] hover:bg-[#f4f4f1]',
                }}
                className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
              >
                <Users className="size-[18px]" aria-hidden />
                Waitlist
              </Link>
              <Link
                to="/admin/admins"
                activeProps={{
                  className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
                }}
                inactiveProps={{
                  className: 'text-[#69696d] hover:bg-[#f4f4f1]',
                }}
                className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
              >
                <UserCog className="size-[18px]" aria-hidden />
                Администраторы
              </Link>
            </>
          ) : null}
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
