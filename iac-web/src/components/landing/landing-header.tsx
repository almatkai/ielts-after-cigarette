import { CloseSquare, HambergerMenu } from 'iconsax-react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { navigation } from '#/content/landing-content'
import { cn } from '#/lib/utils'

import { Brand } from './brand'

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-50 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-300',
        (isScrolled || isMenuOpen) &&
          'border-[#e2e8f0] bg-[rgba(255,255,255,0.88)] backdrop-blur-xl',
      )}
    >
      <div className="container-shell flex h-16 items-center justify-between gap-6">
        <Brand />

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Основная навигация"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-[#475569] no-underline transition-colors hover:text-[#0f172a]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-[#475569] no-underline transition-colors hover:text-[#0f172a]"
          >
            Войти
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center rounded-[10px] bg-[#3b82f6] px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#2563eb]"
          >
            Начать подготовку
          </Link>
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center text-[#0f172a] md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          {isMenuOpen ? (
            <CloseSquare
              size={23}
              color="currentColor"
              variant="Linear"
              aria-hidden
            />
          ) : (
            <HambergerMenu
              size={23}
              color="currentColor"
              variant="Linear"
              aria-hidden
            />
          )}
        </button>
      </div>

      {isMenuOpen ? (
        <nav
          id="mobile-navigation"
          className="container-shell border-t border-[#e2e8f0] py-3 md:hidden"
          aria-label="Мобильная навигация"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="flex min-h-12 items-center border-b border-[#e2e8f0] text-base font-medium text-[#0f172a] no-underline last:border-0"
            >
              {item.label}
            </a>
          ))}
          <div className="mt-3 flex items-center gap-3">
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#475569] no-underline"
            >
              Войти
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMenuOpen(false)}
              className="ml-auto inline-flex min-h-11 items-center rounded-[10px] bg-[#3b82f6] px-4 text-sm font-semibold text-white no-underline"
            >
              Начать подготовку
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
