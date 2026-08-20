import { motion, useReducedMotion } from 'motion/react'

export function AuthBackground() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #eff6ff 0%, #f8fafc 45%, #f8fafc 100%)',
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(15, 23, 42, 0.26) 1px, transparent 1.1px)',
          backgroundSize: '24px 24px',
          maskImage:
            'radial-gradient(ellipse 90% 80% at 50% 45%, black 0%, rgba(0, 0, 0, 0.75) 55%, transparent 85%)',
        }}
        animate={
          shouldReduceMotion
            ? { backgroundPosition: '0px 0px' }
            : {
                backgroundPosition: ['0px 0px', '24px 12px', '0px 0px'],
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
      <div
        className="absolute top-[-18%] left-[-12%] size-[680px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute right-[-14%] bottom-[-22%] size-[640px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
