import { ArrowRight } from 'iconsax-react'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'

import { cn } from '#/lib/utils'

type SmoothButtonBaseProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}

type SmoothButtonProps = SmoothButtonBaseProps &
  ({ href: string; to?: never } | { href?: never; to: '/login' | '/register' })

export function SmoothButton(props: SmoothButtonProps) {
  const { children, variant = 'primary', className } = props
  const classes = cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] px-5 text-sm font-semibold no-underline transition-[color,background-color,transform] hover:-translate-y-0.5',
    variant === 'primary'
      ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
      : 'border border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc]',
    className,
  )
  const content = (
    <>
      <span>{children}</span>
      {variant === 'primary' ? (
        <ArrowRight
          size={18}
          color="currentColor"
          variant="Linear"
          aria-hidden
        />
      ) : null}
    </>
  )

  if (props.to) {
    return (
      <Link to={props.to} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <motion.a
      href={props.href}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ duration: 0.2 }}
      className={classes}
    >
      {content}
    </motion.a>
  )
}
