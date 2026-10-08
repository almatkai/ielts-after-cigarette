import {
  Book,
  Category,
  ClipboardTick,
  Edit2,
  Headphone,
  HambergerMenu,
  Logout,
  Microphone2,
  People,
  ShieldTick,
  TrendUp,
  UserEdit,
} from 'iconsax-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-store'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [logoutIsPending, setLogoutIsPending] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

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
              <ShieldTick className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">IAC Admin</p>
              <p className="truncate text-xs text-[#808084]">
                {auth.user?.displayName} · {auth.user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="lg:hidden"
              aria-label="Меню"
              aria-expanded={navOpen}
              aria-controls="admin-navigation"
              onClick={() => setNavOpen(!navOpen)}
            >
              <HambergerMenu aria-hidden />
            </Button>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/">
                <Category aria-hidden />
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
              <Logout aria-hidden />
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
          id="admin-navigation"
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest('a'))
              setNavOpen(false)
          }}
          className={`${navOpen ? 'block' : 'hidden'} lg:block lg:sticky lg:top-6 lg:self-start`}
        >
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            activeProps={{
              className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
            }}
            inactiveProps={{ className: 'text-[#69696d] hover:bg-[#f4f4f1]' }}
            className="flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
          >
            <ShieldTick className="size-[18px]" aria-hidden />
            Обзор
          </Link>
          {auth.user?.role === 'ADMIN' ? (
            <Link
              to="/admin/analytics"
              activeProps={{
                className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
              }}
              inactiveProps={{
                className: 'text-[#69696d] hover:bg-[#f4f4f1]',
              }}
              className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
            >
              <TrendUp className="size-[18px]" aria-hidden />
              Аналитика
            </Link>
          ) : null}
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
            <Book className="size-[18px]" aria-hidden />
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
            <Headphone className="size-[18px]" aria-hidden />
            Listening тесты
          </Link>
          <Link
            to="/admin/writing/materials"
            activeProps={{
              className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
            }}
            inactiveProps={{ className: 'text-[#69696d] hover:bg-[#f4f4f1]' }}
            className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
          >
            <Edit2 className="size-[18px]" aria-hidden />
            Writing материалы
          </Link>
          <Link
            to="/admin/speaking/materials"
            activeProps={{
              className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
            }}
            inactiveProps={{ className: 'text-[#69696d] hover:bg-[#f4f4f1]' }}
            className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
          >
            <Microphone2 className="size-[18px]" aria-hidden />
            Speaking материалы
          </Link>
          <Link
            to="/admin/full-mocks"
            activeProps={{
              className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
            }}
            inactiveProps={{
              className: 'text-[#69696d] hover:bg-[#f4f4f1]',
            }}
            className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
          >
            <ClipboardTick className="size-[18px]" aria-hidden />
            Архив Full Mock
          </Link>
          <Link
            to="/admin/blog/posts"
            activeProps={{
              className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
            }}
            inactiveProps={{
              className: 'text-[#69696d] hover:bg-[#f4f4f1]',
            }}
            className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
          >
            <Edit2 className="size-[18px]" aria-hidden />
            Статьи блога
          </Link>
          {auth.user?.role === 'ADMIN' ? (
            <>
              <Link
                to="/admin/users"
                activeProps={{
                  className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
                }}
                inactiveProps={{
                  className: 'text-[#69696d] hover:bg-[#f4f4f1]',
                }}
                className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
              >
                <People className="size-[18px]" aria-hidden />
                Пользователи
              </Link>
              <Link
                to="/admin/writers/applications"
                activeProps={{
                  className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
                }}
                inactiveProps={{
                  className: 'text-[#69696d] hover:bg-[#f4f4f1]',
                }}
                className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
              >
                <People className="size-[18px]" aria-hidden />
                Заявки авторов
              </Link>
              <Link
                to="/admin/ai-providers"
                activeProps={{
                  className: 'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
                }}
                inactiveProps={{
                  className: 'text-[#69696d] hover:bg-[#f4f4f1]',
                }}
                className="mt-2 flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-sm no-underline transition-colors"
              >
                <ClipboardTick className="size-[18px]" aria-hidden />
                AI-провайдеры
              </Link>
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
                <People className="size-[18px]" aria-hidden />
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
                <UserEdit className="size-[18px]" aria-hidden />
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
