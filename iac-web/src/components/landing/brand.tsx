import { Link } from '@tanstack/react-router'

type BrandProps = {
  to?: '/' | '/dashboard'
}

export function Brand({ to = '/' }: BrandProps) {
  const isDashboardLink = to === '/dashboard'

  return (
    <Link
      to={to}
      hash={isDashboardLink ? undefined : 'top'}
      className="inline-flex min-h-11 items-center gap-1 text-lg font-bold tracking-tight no-underline"
      aria-label={
        isDashboardLink
          ? 'Daiyndyq IELTS — к обзору'
          : 'Daiyndyq IELTS — к началу страницы'
      }
    >
      <span className="text-[#3b82f6]">Daiyndyq</span>
      <span className="text-[#0f172a]">IELTS</span>
    </Link>
  )
}
