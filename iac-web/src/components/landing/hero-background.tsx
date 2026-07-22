import { motion, useReducedMotion } from 'motion/react'

export function HeroBackground() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(17, 17, 17, 0.16) 0.8px, transparent 0.9px)',
          backgroundSize: '26px 26px',
          maskImage:
            'radial-gradient(ellipse 54% 66% at 19% 49%, black 0%, rgba(0, 0, 0, 0.72) 42%, transparent 78%)',
        }}
        animate={
          shouldReduceMotion
            ? { backgroundPosition: '0px 0px' }
            : {
                backgroundPosition: ['0px 0px', '26px 13px', '0px 0px'],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                duration: 20,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }
        }
      />
    </div>
  )
}
