import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'iconsax-react'
import * as React from 'react'

import { BrandLogo } from '@/components/landing/brand'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type TocItem = {
  id: string
  title: string
}

type LegalShellProps = {
  title: string
  subtitle: string
  lastUpdated: string
  version?: string
  toc: TocItem[]
  children: React.ReactNode
}

export function LegalShell({
  title,
  subtitle,
  lastUpdated,
  version = '1.0',
  toc,
  children,
}: LegalShellProps) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const [activeSection, setActiveSection] = React.useState<string>(
    toc[0]?.id ?? '',
  )

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140
      for (let i = toc.length - 1; i >= 0; i--) {
        const item = toc[i]
        const element = document.getElementById(item.id)
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(item.id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  const handlePrint = () => {
    window.print()
  }

  const isPrivacy = currentPath.includes('/privacy')
  const isTerms = currentPath.includes('/terms')

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 ">
        <div className="container-shell flex h-18 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <BrandLogo />
            <nav
              className="hidden items-center gap-1 sm:flex"
              aria-label="Юридические документы"
            >
              <Link
                to="/privacy"
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  isPrivacy
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                Политика конфиденциальности
              </Link>
              <Link
                to="/terms"
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  isTerms
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                Условия использования
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="hidden h-9 items-center gap-1.5 rounded-[9px] border-border bg-card px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground md:inline-flex"
              title="Распечатать документ"
            >
              <Printer size={15} aria-hidden />
              <span>Печать</span>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-9 rounded-[9px] bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              <Link to="/login">Войти в кабинет</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-card py-10 sm:py-14">
        <div className="container-shell">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft size={14} aria-hidden />
              <span>Назад ко входу</span>
            </Link>
            <span className="text-border">•</span>

            <Badge
              variant="outline"
              className="border-border text-[11px] font-normal text-muted-foreground"
            >
              Редакция {version}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground">
            <div>
              <span className="text-muted-foreground">
                Последнее обновление:{' '}
              </span>
              <span className="font-medium text-muted-foreground">
                {lastUpdated}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Юрисдикция: </span>
              <span className="font-medium text-muted-foreground">
                Республика Казахстан
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Контакты: </span>
              <a
                href="mailto:kairatovalmat2003@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                kairatovalmat2003@gmail.com
              </a>
            </div>
          </div>

          {/* Mobile subnavigation tabs */}
          <div className="mt-6 flex gap-2 border-t border-muted pt-4 sm:hidden">
            <Link
              to="/privacy"
              className={cn(
                'flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors',
                isPrivacy
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-border',
              )}
            >
              Политика конфиденциальности
            </Link>
            <Link
              to="/terms"
              className={cn(
                'flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors',
                isTerms
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-border',
              )}
            >
              Условия использования
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="container-shell py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Sidebar / Table of Contents (Desktop) */}
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-26 rounded-[10px] border border-border bg-card p-5 shadow-none">
              <h2 className="mb-3 text-xs font-bold normal-case text-muted-foreground">
                Содержание документа
              </h2>
              <nav className="flex flex-col space-y-1">
                {toc.map((item) => {
                  const isActive = activeSection === item.id
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={cn(
                        'block rounded-md px-2.5 py-1.5 text-xs transition-colors',
                        isActive
                          ? 'bg-primary-soft font-semibold text-primary'
                          : 'text-muted-foreground hover:bg-background hover:text-foreground',
                      )}
                    >
                      {item.title}
                    </a>
                  )
                })}
              </nav>

              <div className="mt-6 border-t border-muted pt-4 text-xs text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">
                  Возникли вопросы?
                </p>
                <p className="leading-relaxed">
                  По любым вопросам обработки персональных данных пишите на{' '}
                  <a
                    href="mailto:kairatovalmat2003@gmail.com"
                    className="text-primary hover:underline"
                  >
                    kairatovalmat2003@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </aside>

          {/* Document Content */}
          <article className="lg:col-span-8">
            <div className="rounded-[10px] border border-border bg-card p-6 shadow-none sm:p-10">
              {children}
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 text-sm text-muted-foreground">
        <div className="container-shell flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© 2026 Yrys Academy. Астана, Казахстан.</p>
          <div className="flex items-center gap-5 text-xs">
            <Link
              to="/privacy"
              className={cn(
                'transition-colors hover:text-foreground',
                isPrivacy && 'font-semibold text-primary',
              )}
            >
              Политика конфиденциальности
            </Link>
            <span className="text-border-strong">•</span>
            <Link
              to="/terms"
              className={cn(
                'transition-colors hover:text-foreground',
                isTerms && 'font-semibold text-primary',
              )}
            >
              Условия использования
            </Link>
            <span className="text-border-strong">•</span>
            <Link
              to="/login"
              className="transition-colors hover:text-foreground"
            >
              Вход
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
