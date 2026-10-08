import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'iconsax-react'
import * as React from 'react'

import { Brand } from '@/components/landing/brand'
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
    <div className="min-h-screen bg-[#fafaf8] text-[#111111]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#e7e7e4] bg-[#fafaf8]/90 backdrop-blur-md">
        <div className="container-shell flex h-18 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Brand />
            <nav
              className="hidden items-center gap-1 sm:flex"
              aria-label="Юридические документы"
            >
              <Link
                to="/privacy"
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  isPrivacy
                    ? 'bg-[#eef4ff] text-[#1d4ed8]'
                    : 'text-[#69696d] hover:bg-[#f4f4f1] hover:text-[#111111]',
                )}
              >
                Политика конфиденциальности
              </Link>
              <Link
                to="/terms"
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  isTerms
                    ? 'bg-[#eef4ff] text-[#1d4ed8]'
                    : 'text-[#69696d] hover:bg-[#f4f4f1] hover:text-[#111111]',
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
              className="hidden h-9 items-center gap-1.5 rounded-[9px] border-[#deded9] bg-white px-3 text-xs font-medium text-[#475569] hover:bg-[#f4f4f1] hover:text-[#111111] md:inline-flex"
              title="Распечатать документ"
            >
              <Printer size={15} aria-hidden />
              <span>Печать</span>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-9 rounded-[9px] bg-[#3b82f6] px-3.5 text-xs font-semibold text-white hover:bg-[#2563eb]"
            >
              <Link to="/login">Войти в кабинет</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-[#e7e7e4] bg-white py-10 sm:py-14">
        <div className="container-shell">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#69696d] transition-colors hover:text-[#3b82f6]"
            >
              <ArrowLeft size={14} aria-hidden />
              <span>Назад ко входу</span>
            </Link>
            <span className="text-[#deded9]">•</span>

            <Badge
              variant="outline"
              className="border-[#e7e7e4] text-[11px] font-normal text-[#69696d]"
            >
              Редакция {version}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#475569] sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#69696d]">
            <div>
              <span className="text-[#94a3b8]">Последнее обновление: </span>
              <span className="font-medium text-[#475569]">{lastUpdated}</span>
            </div>
            <div>
              <span className="text-[#94a3b8]">Юрисдикция: </span>
              <span className="font-medium text-[#475569]">
                Республика Казахстан
              </span>
            </div>
            <div>
              <span className="text-[#94a3b8]">Контакты: </span>
              <a
                href="mailto:kairatovalmat2003@gmail.com"
                className="font-medium text-[#3b82f6] hover:underline"
              >
                kairatovalmat2003@gmail.com
              </a>
            </div>
          </div>

          {/* Mobile subnavigation tabs */}
          <div className="mt-6 flex gap-2 border-t border-[#f1f5f9] pt-4 sm:hidden">
            <Link
              to="/privacy"
              className={cn(
                'flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors',
                isPrivacy
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#f4f4f1] text-[#475569] hover:bg-[#e2e8f0]',
              )}
            >
              Политика конфиденциальности
            </Link>
            <Link
              to="/terms"
              className={cn(
                'flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors',
                isTerms
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#f4f4f1] text-[#475569] hover:bg-[#e2e8f0]',
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
            <div className="sticky top-26 rounded-[14px] border border-[#e7e7e4] bg-white p-5 shadow-xs">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
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
                          ? 'bg-[#eef4ff] font-semibold text-[#1d4ed8]'
                          : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]',
                      )}
                    >
                      {item.title}
                    </a>
                  )
                })}
              </nav>

              <div className="mt-6 border-t border-[#f1f5f9] pt-4 text-xs text-[#64748b]">
                <p className="mb-2 font-medium text-[#0f172a]">
                  Возникли вопросы?
                </p>
                <p className="leading-relaxed">
                  По любым вопросам обработки персональных данных пишите на{' '}
                  <a
                    href="mailto:kairatovalmat2003@gmail.com"
                    className="text-[#3b82f6] hover:underline"
                  >
                    kairatovalmat2003@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </aside>

          {/* Document Content */}
          <article className="lg:col-span-8">
            <div className="rounded-[16px] border border-[#e7e7e4] bg-white p-6 shadow-xs sm:p-10">
              {children}
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e7e7e4] bg-white py-8 text-sm text-[#64748b]">
        <div className="container-shell flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© 2026 Daiyndyq IELTS. Все права защищены. Астана, Казахстан.</p>
          <div className="flex items-center gap-5 text-xs">
            <Link
              to="/privacy"
              className={cn(
                'transition-colors hover:text-[#0f172a]',
                isPrivacy && 'font-semibold text-[#3b82f6]',
              )}
            >
              Политика конфиденциальности
            </Link>
            <span className="text-[#cbd5e1]">•</span>
            <Link
              to="/terms"
              className={cn(
                'transition-colors hover:text-[#0f172a]',
                isTerms && 'font-semibold text-[#3b82f6]',
              )}
            >
              Условия использования
            </Link>
            <span className="text-[#cbd5e1]">•</span>
            <Link
              to="/login"
              className="transition-colors hover:text-[#0f172a]"
            >
              Вход
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
