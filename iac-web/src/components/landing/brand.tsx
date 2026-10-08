import { Link } from '@tanstack/react-router'

type BrandProps = {
  to?: '/'
}

export function Brand({ to = '/' }: BrandProps) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-1 text-base sm:text-lg font-bold tracking-tight no-underline shrink-0"
      aria-label="Daiyndyq IELTS — к обзору"
    >
      <span className="text-[#3b82f6]">Daiyndyq</span>
      <span className="text-[#0f172a]">IELTS</span>
    </Link>
  )
}
