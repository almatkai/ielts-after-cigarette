import { motion } from 'motion/react'

import type { PropsWithChildren } from 'react'

type RevealProps = PropsWithChildren<{
  className?: string
  delay?: number
  as?: 'div' | 'p'
}>

export function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
}: RevealProps) {
  const Component = as === 'p' ? motion.p : motion.div

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  )
}

export function RevealInView({
  children,
  className,
  delay = 0,
}: Omit<RevealProps, 'as'>) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
