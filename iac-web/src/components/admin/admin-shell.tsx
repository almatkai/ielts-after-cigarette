import { BrandLogo } from '@/components/landing/brand'
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
import { useLanguage } from '@/lib/i18n'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [logoutIsPending, setLogoutIsPending] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const isAdmin = auth.hasAnyRole(['ADMIN'])
  const groups = [
    {
      id: 'overview',
      label: t('Обзор'),
      visible: true,
      items: linkOptions([
        {
          to: '/admin',
          label: t('Обзор'),
          icon: ShieldTick,
          visible: true,
          activeOptions: { exact: true },
        },
        {
          to: '/admin/analytics',
          label: t('Аналитика'),
          icon: TrendUp,
          visible: isAdmin,
        },
      ]),
    },
    {
      id: 'materials',
      label: t('Учебные материалы'),
      visible: auth.hasAnyPermission(['CONTENT_EDITOR']) || isAdmin,
      items: linkOptions([
        {
          to: '/admin/reading/materials',
          label: t('Reading материалы'),
          icon: Book,
        },
        {
          to: '/admin/listening/tests',
          label: t('Listening тесты'),
          icon: Headphone,
        },
        {
          to: '/admin/writing/materials',
          label: t('Writing материалы'),
          icon: Edit2,
        },
        {
          to: '/admin/speaking/materials',
          label: t('Speaking материалы'),
          icon: Microphone2,
        },
        {
          to: '/admin/full-mocks',
          label: t('Архив Full Mock'),
          icon: ClipboardTick,
        },
        {
          to: '/admin/learning-content',
          label: t('Редактура Academic'),
          icon: ClipboardTick,
          visible: isAdmin,
        },
      ]),
    },
    {
      id: 'blog',
      label: t('Блог и авторы'),
      visible: auth.hasAnyPermission(['BLOG_MODERATOR']),
      items: linkOptions([
        { to: '/admin/blog/posts', label: t('Статьи блога'), icon: Edit2 },
        {
          to: '/admin/writers/applications',
          label: t('Заявки авторов'),
          icon: People,
        },
      ]),
    },
    {
      id: 'users',
      label: t('Пользователи'),
      visible: isAdmin,
      items: linkOptions([
        { to: '/admin/users', label: t('Пользователи'), icon: People },
        { to: '/admin/waitlist', label: 'Waitlist', icon: People },
      ]),
    },
    {
      id: 'system',
      label: t('Система'),
      visible: isAdmin,
      items: linkOptions([
        {
          to: '/admin/ai-providers',
          label: t('AI-провайдеры'),
          icon: ClipboardTick,
        },
        { to: '/admin/admins', label: t('Администраторы'), icon: UserEdit },
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold">
                {t('Администрирование')}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {auth.user?.displayName} ·{' '}
                {auth.user?.role === 'EDITOR'
                  ? t('Сотрудник')
                  : auth.user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="lg:hidden"
              aria-label={t('Меню')}
              aria-expanded={navOpen}
              aria-controls="admin-navigation"
              onClick={() => setNavOpen(!navOpen)}
            >
              <HambergerMenu aria-hidden />
            </Button>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/">
                <Category aria-hidden />
                {t('Кабинет студента')}
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={logoutIsPending}
              onClick={() => void handleLogout()}
              aria-label={t('Выйти из аккаунта')}
            >
              <Logout aria-hidden />
              <span className="hidden sm:inline">
                {logoutIsPending ? t('Выходим…') : t('Выйти')}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-8">
        <nav
          aria-label={t('Администрирование')}
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
                  className="mb-2 px-4 text-xs font-medium text-muted-foreground"
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
                              'bg-primary-soft font-semibold text-primary',
                          }}
                          inactiveProps={{
                            className: 'text-muted-foreground hover:bg-muted',
                          }}
                          className="flex min-h-10 items-center gap-3 rounded-[10px] px-4 py-2 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
