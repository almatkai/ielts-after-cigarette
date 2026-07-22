import { motion } from 'motion/react'

import { cn } from '#/lib/utils'

type AnimatedProgressProps = {
  value: number
  className?: string
  indicatorClassName?: string
  label: string
}

export function AnimatedProgress({
  value,
  className,
  indicatorClassName,
  label,
}: AnimatedProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div
      className={cn(
        'h-1.5 overflow-hidden rounded-full bg-[#e7e7e4]',
        className,
      )}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <motion.div
        className={cn('h-full rounded-full bg-[#111111]', indicatorClassName)}
        initial={{ width: 0 }}
        whileInView={{ width: `${safeValue}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
