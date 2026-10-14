import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'iconsax-react'
import { useEffect } from 'react'

import { authStore, useAuth } from '@/features/auth/auth-store'
import { landingHref } from '@/features/blog/links'
import { cn } from '@/lib/utils'

type BlogShellProps = {
  children: React.ReactNode
  width?: 'narrow' | 'wide'
}

const navLinkClassName =
  'rounded-[9px] px-3 py-2 text-sm font-medium text-[#69696d] no-underline transition-colors hover:bg-[#f4f4f1] hover:text-[#111111]'
const activeNavLinkClassName = 'bg-[#eff6ff] text-[#2563eb]'

export function BlogShell({ children, width = 'wide' }: BlogShellProps) {
  const containerClassName = cn(
    'mx-auto px-5 sm:px-7',
    width === 'narrow' ? 'max-w-[860px]' : 'max-w-[1040px]',
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5] text-[#111111]">
      <header className="sticky top-0 z-30 border-b border-[#e7e7e4] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-[1040px] items-center justify-between gap-4 px-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-5">
            <a
              href={landingHref}
              className="inline-flex shrink-0 items-center gap-1 text-base font-bold tracking-tight no-underline"
              aria-label="Daiyndyq IELTS — главная"
            >
              <span className="text-[#3b82f6]">Daiyndyq</span>
              <span className="text-[#0f172a]">IELTS</span>
              <span className="ml-1.5 rounded-[6px] bg-[#eff6ff] px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-[#2563eb] uppercase">
                Блог
              </span>
            </a>
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Разделы блога"
            >
              <Link
                to="/blog"
                activeOptions={{ includeSearch: false }}
                className={navLinkClassName}
                activeProps={{ className: activeNavLinkClassName }}
              >
                Статьи
              </Link>
              <Link
                to="/blog/become-writer"
                className={navLinkClassName}
                activeProps={{ className: activeNavLinkClassName }}
              >
                Авторам
              </Link>
              <a href={landingHref} className={navLinkClassName}>
                О платформе
              </a>
            </nav>
          </div>
          <BlogHeaderActions />
        </div>
      </header>

      <main className={cn(containerClassName, 'w-full flex-1 py-10')}>
        {children}
      </main>

      <footer className="border-t border-[#e7e7e4] bg-white">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-4 px-5 py-8 text-sm text-[#69696d] sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <a href={landingHref} className="no-underline hover:text-[#111111]">
            © 2026 Daiyndyq IELTS · Подготовка к IELTS
          </a>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"
            aria-label="Ссылки в подвале"
          >
            <Link to="/blog" className="hover:text-[#111111]">
              Блог
            </Link>
            <Link to="/blog/become-writer" className="hover:text-[#111111]">
              Стать автором
            </Link>
            <a href={landingHref} className="hover:text-[#111111]">
              Главная
            </a>
            <a
              href={`${import.meta.env.BASE_URL}blog/rss.xml`}
              className="hover:text-[#111111]"
            >
              RSS
            </a>
            <Link to="/privacy" className="hover:text-[#111111]">
              Конфиденциальность
            </Link>
            <Link to="/terms" className="hover:text-[#111111]">
              Условия
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function BlogHeaderActions() {
  const auth = useAuth()

  // Blog pages are public and server-rendered, so the session is restored
  // only in the browser; actions appear once it is known.
  useEffect(() => {
    void authStore.initialize()
  }, [])

  if (!auth.initialized) return <div className="h-9" aria-hidden />

  const signedIn = Boolean(auth.user && auth.accessToken)
  if (!signedIn) {
    return (
      <Link
        to="/login"
        className="shrink-0 rounded-[10px] bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#2563eb]"
      >
        Войти
      </Link>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {auth.hasAnyRole(['WRITER', 'ADMIN']) ? (
        <Link
          to="/writer/posts"
          className="hidden rounded-[10px] border border-[#deded9] bg-white px-3.5 py-2 text-sm font-semibold text-[#111111] no-underline transition-colors hover:bg-[#f4f4f1] sm:inline-flex"
        >
          Мои статьи
        </Link>
      ) : null}
      <Link
        to="/"
        className="rounded-[10px] bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#2563eb]"
      >
        В кабинет
      </Link>
    </div>
  )
}

type BlogBackLinkProps = {
  to: '/blog' | '/blog/become-writer'
  children: React.ReactNode
}

export function BlogBackLink({ to, children }: BlogBackLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#69696d] no-underline transition-colors hover:text-[#2563eb]"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </Link>
  )
}
