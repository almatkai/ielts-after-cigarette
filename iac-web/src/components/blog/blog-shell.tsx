import { BrandLogo } from '@/components/landing/brand'
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
  'rounded-[9px] px-3 py-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground'
const activeNavLinkClassName = 'bg-primary-soft text-primary-hover'

export function BlogShell({ children, width = 'wide' }: BlogShellProps) {
  const containerClassName = cn(
    'mx-auto px-5 sm:px-7',
    width === 'narrow' ? 'max-w-[860px]' : 'max-w-[1040px]',
  )

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card ">
        <div className="mx-auto flex min-h-16 max-w-[1040px] items-center justify-between gap-4 px-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-5">
            <a
              href={landingHref}
              className="inline-flex shrink-0 items-center gap-1 text-base font-bold tracking-tight no-underline"
              aria-label="Yrys Academy — на главную"
            >
              <BrandLogo linked={false} decorative />
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

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <a href={landingHref} className="no-underline hover:text-foreground">
            © 2026 Yrys Academy. Астана, Казахстан.
          </a>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"
            aria-label="Ссылки в подвале"
          >
            <Link to="/blog" className="hover:text-foreground">
              Блог
            </Link>
            <Link to="/blog/become-writer" className="hover:text-foreground">
              Стать автором
            </Link>
            <a href={landingHref} className="hover:text-foreground">
              Главная
            </a>
            <a
              href={`${import.meta.env.BASE_URL}blog/rss.xml`}
              className="hover:text-foreground"
            >
              RSS
            </a>
            <Link to="/privacy" className="hover:text-foreground">
              Конфиденциальность
            </Link>
            <Link to="/terms" className="hover:text-foreground">
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
        className="shrink-0 rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground no-underline transition-colors hover:bg-primary-hover"
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
          className="hidden rounded-[10px] border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-muted sm:inline-flex"
        >
          Мои статьи
        </Link>
      ) : null}
      <Link
        to="/"
        className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground no-underline transition-colors hover:bg-primary-hover"
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
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-primary-hover"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </Link>
  )
}
