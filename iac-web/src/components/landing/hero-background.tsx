import { motion, useReducedMotion } from 'motion/react'

const pulseDelays = [0, 4.5] as const

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

      <div className="absolute top-1/2 left-[-210px] size-[760px] -translate-y-1/2 opacity-55 sm:left-[-170px] lg:left-[-90px] lg:size-[880px]">
        <svg className="h-full w-full" viewBox="0 0 880 880">
          <g fill="none" stroke="#d8d8d4" strokeWidth="1">
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
              stroke="#111111"
              strokeWidth="1"
              initial={false}
              animate={
                shouldReduceMotion
                  ? { r: 204, opacity: 0.08 }
                  : {
                      r: [92, 324],
                      opacity: [0, 0.12, 0],
                    }
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
              stroke="#e23b3b"
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
            fill="#e23b3b"
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
