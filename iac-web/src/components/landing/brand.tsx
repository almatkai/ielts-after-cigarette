import { Link } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { useThemePreference } from '@/features/theme/theme'

function subscribeSystemTheme(listener: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

type BrandLogoProps = {
  variant?: 'horizontal' | 'stacked' | 'mark'
  to?: '/'
  linked?: boolean
  decorative?: boolean
  className?: string
}

/** All variants are crops of the supplied artwork, with explicit intrinsic size. */
export function BrandLogo({
  variant = 'horizontal',
  to = '/',
  linked = variant === 'horizontal',
  className,
  decorative = false,
}: BrandLogoProps) {
  const { preference } = useThemePreference()
  const systemIsDark = useSyncExternalStore(
    subscribeSystemTheme,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  )
  const suffix =
    preference === 'dark' || (preference === 'system' && systemIsDark)
      ? '-white'
      : ''
  const dimensions = {
    horizontal: [1687, 541],
    stacked: [1142, 1316],
    mark: [821, 712],
  }
  const render = (kind: typeof variant) => (
    <span
      className={cn(
        variant === 'horizontal' &&
          (kind === 'mark'
            ? 'brand-responsive-mark'
            : 'brand-responsive-horizontal'),
      )}
    >
      <img
        src={`${import.meta.env.BASE_URL}brand/yrys-${kind}${suffix}@2x.png`}
        srcSet={`${import.meta.env.BASE_URL}brand/yrys-${kind}${suffix}@1x.png 1x, ${import.meta.env.BASE_URL}brand/yrys-${kind}${suffix}@2x.png 2x`}
        width={dimensions[kind][0]}
        height={dimensions[kind][1]}
        alt={linked || decorative ? '' : 'Yrys Academy'}
        className={cn('brand-logo', `brand-logo-${kind}`, className)}
      />
    </span>
  )
  const logo = (
    <>
      {render(variant)}
      {variant === 'horizontal' ? render('mark') : null}
    </>
  )
  return linked ? (
    <Link
      to={to}
      aria-label="Yrys Academy — к обзору"
      className="inline-flex min-h-11 shrink-0 items-center no-underline"
    >
      {logo}
    </Link>
  ) : (
    logo
  )
}
