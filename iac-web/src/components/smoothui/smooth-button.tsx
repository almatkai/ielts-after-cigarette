import { ArrowRight } from 'iconsax-react'
import { motion } from 'motion/react'

import { cn } from '#/lib/utils'

type SmoothButtonProps = {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}

export function SmoothButton({
  href,
  children,
  variant = 'primary',
  className,
}: SmoothButtonProps) {
  return (
    <motion.a
      href={href}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] px-5 text-sm font-semibold no-underline transition-colors',
        variant === 'primary'
          ? 'bg-[#e23b3b] text-white hover:bg-[#c92f2f]'
          : 'border border-[#e7e7e4] bg-white text-[#111111] hover:bg-[#f4f4f1]',
        className,
      )}
    >
      <span>{children}</span>
      {variant === 'primary' ? (
        <ArrowRight
          size={18}
          color="currentColor"
          variant="Linear"
          aria-hidden
        />
      ) : null}
    </motion.a>
  )
}
