import { motion, useReducedMotion } from 'motion/react'

const pulseDelays = [0, 4.5] as const

export function ValueOrbitBackground() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute top-1/2 left-[-220px] size-[680px] -translate-y-1/2 opacity-55 sm:left-[-160px] lg:left-[-80px] lg:size-[760px]">
        <svg className="size-full" viewBox="0 0 880 880">
          <g fill="none" stroke="#cbd5e1" strokeWidth="1">
            <circle cx="440" cy="440" r="106" opacity="0.44" />
            <circle cx="440" cy="440" r="204" opacity="0.3" />
            <circle cx="440" cy="440" r="302" opacity="0.18" />
          </g>

          {pulseDelays.map((delay) => (
            <motion.circle
              key={delay}
              cx="440"
              cy="440"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1"
              initial={false}
              animate={
                shouldReduceMotion
                  ? { r: 204, opacity: 0.08 }
                  : { r: [92, 324], opacity: [0, 0.12, 0] }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 9,
                      delay,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeOut',
                    }
              }
            />
          ))}

          <motion.g
            style={{ transformOrigin: '440px 440px' }}
            animate={{ rotate: shouldReduceMotion ? 0 : 360 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    duration: 32,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  }
            }
          >
            <circle
              cx="440"
              cy="440"
              r="252"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeDasharray="3 48 72 380"
              opacity="0.42"
            />
          </motion.g>

          <motion.circle
            cx="440"
            cy="440"
            r="3.5"
            fill="#3b82f6"
            animate={{ opacity: shouldReduceMotion ? 0.7 : [0.38, 0.9, 0.38] }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    duration: 3.8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }
            }
          />
        </svg>
      </div>
    </div>
  )
}
