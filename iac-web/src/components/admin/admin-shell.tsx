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
import { Link, linkOptions, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-store'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [logoutIsPending, setLogoutIsPending] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const isAdmin = auth.hasAnyRole(['ADMIN'])
  const groups = [
    {
      id: 'overview',
      label: 'Обзор',
      visible: true,
      items: linkOptions([
        {
          to: '/admin',
          label: 'Обзор',
          icon: ShieldTick,
          visible: true,
          activeOptions: { exact: true },
        },
        {
          to: '/admin/analytics',
          label: 'Аналитика',
          icon: TrendUp,
          visible: isAdmin,
        },
      ]),
    },
    {
      id: 'materials',
      label: 'Учебные материалы',
      visible: auth.hasAnyPermission(['CONTENT_EDITOR']),
      items: linkOptions([
        {
          to: '/admin/reading/materials',
          label: 'Reading материалы',
          icon: Book,
        },
        {
          to: '/admin/listening/tests',
          label: 'Listening тесты',
          icon: Headphone,
        },
        {
          to: '/admin/writing/materials',
          label: 'Writing материалы',
          icon: Edit2,
        },
        {
          to: '/admin/speaking/materials',
          label: 'Speaking материалы',
          icon: Microphone2,
        },
        {
          to: '/admin/full-mocks',
          label: 'Архив Full Mock',
          icon: ClipboardTick,
        },
      ]),
    },
    {
      id: 'blog',
      label: 'Блог и авторы',
      visible: auth.hasAnyPermission(['BLOG_MODERATOR']),
      items: linkOptions([
        { to: '/admin/blog/posts', label: 'Статьи блога', icon: Edit2 },
        {
          to: '/admin/writers/applications',
          label: 'Заявки авторов',
          icon: People,
        },
      ]),
    },
    {
      id: 'users',
      label: 'Пользователи',
      visible: isAdmin,
      items: linkOptions([
        { to: '/admin/users', label: 'Пользователи', icon: People },
        { to: '/admin/waitlist', label: 'Waitlist', icon: People },
      ]),
    },
    {
      id: 'system',
      label: 'Система',
      visible: isAdmin,
      items: linkOptions([
        {
          to: '/admin/ai-providers',
          label: 'AI-провайдеры',
          icon: ClipboardTick,
        },
        { to: '/admin/admins', label: 'Администраторы', icon: UserEdit },
      ]),
    },
  ]

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
                {auth.user?.displayName} ·{' '}
                {auth.user?.role === 'EDITOR' ? 'Сотрудник' : auth.user?.role}
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
          className={`${navOpen ? 'block' : 'hidden'} space-y-5 lg:block lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto`}
        >
          {groups
            .filter((group) => group.visible)
            .map((group) => (
              <section key={group.id} aria-labelledby={`admin-nav-${group.id}`}>
                <h2
                  id={`admin-nav-${group.id}`}
                  className="mb-2 px-4 text-xs font-medium text-[#808084]"
                >
                  {group.label}
                </h2>
                <ul className="space-y-1">
                  {group.items
                    .filter((item) => !('visible' in item) || item.visible)
                    .map(({ label, icon: Icon, ...options }) => (
                      <li key={options.to}>
                        <Link
                          to={options.to}
                          activeOptions={
                            'activeOptions' in options
                              ? options.activeOptions
                              : undefined
                          }
                          activeProps={{
                            className:
                              'bg-[#eff6ff] font-semibold text-[#1d4ed8]',
                          }}
                          inactiveProps={{
                            className: 'text-[#69696d] hover:bg-[#f4f4f1]',
                          }}
                          className="flex min-h-10 items-center gap-3 rounded-[10px] px-4 py-2 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b82f6]"
                        >
                          <Icon className="size-[18px] shrink-0" aria-hidden />
                          {label}
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
