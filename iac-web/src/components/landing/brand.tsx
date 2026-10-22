import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

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
  const { t } = useLanguage()
  const dimensions = {
    horizontal: [1690, 539],
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
      {['', '-white'].map((suffix) => (
        <img
          key={suffix}
          src={`${import.meta.env.BASE_URL}brand/yrys-${kind}${suffix}@2x.png`}
          srcSet={`${import.meta.env.BASE_URL}brand/yrys-${kind}${suffix}@1x.png 1x, ${import.meta.env.BASE_URL}brand/yrys-${kind}${suffix}@2x.png 2x`}
          width={dimensions[kind][0]}
          height={dimensions[kind][1]}
          alt={linked || decorative ? '' : 'Yrys Academy'}
          className={cn(
            'brand-logo',
            `brand-logo-${kind}`,
            suffix ? 'brand-logo-dark' : 'brand-logo-light',
            className,
          )}
        />
      ))}
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
      aria-label={t('Yrys Academy — к обзору')}
      className="inline-flex min-h-11 shrink-0 items-center no-underline"
    >
      {logo}
    </Link>
  ) : (
    logo
  )
}
