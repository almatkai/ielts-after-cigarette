import { Link } from '@tanstack/react-router'

export function Brand() {
  return (
    <Link
      to="/"
      hash="top"
      className="group inline-flex min-h-11 flex-col items-start justify-center gap-1 text-[#111111] no-underline"
      aria-label="IAC — к началу страницы"
    >
      <span className="text-[17px] leading-none font-bold tracking-[-0.04em]">
        IAC
      </span>
      <span
        className="h-px w-7 origin-left bg-[#e23b3b] transition-transform duration-300 group-hover:scale-x-75"
        aria-hidden
      />
    </Link>
  )
}
