import { motion, useReducedMotion } from 'motion/react'

import { RevealInView } from '../smoothui/reveal'

export function DifferentiationSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      className="relative isolate overflow-hidden border-y border-[#e2e8f0] bg-white py-24 sm:py-32"
      aria-labelledby="focus-heading"
    >
      <div
        className="editorial-grid absolute inset-0 -z-30 opacity-55"
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        viewBox="0 0 1200 420"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M-80 310 C170 112 360 362 590 206 S980 88 1280 278"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1"
          opacity="0.32"
        />
        <motion.path
          d="M-80 310 C170 112 360 362 590 206 S980 88 1280 278"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.35"
          strokeLinecap="round"
          pathLength="1"
          style={{ strokeDasharray: '0.14 0.86' }}
          animate={{ strokeDashoffset: shouldReduceMotion ? 0 : [0, -1] }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: 14,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }
          }
          opacity="0.42"
        />
      </svg>
      <div className="container-shell relative">
        <RevealInView>
          <h2
            id="focus-heading"
            className="max-w-5xl text-[clamp(2.75rem,6vw,6.25rem)] leading-[0.96] font-medium tracking-[-0.065em] text-balance"
          >
            Меньше шума. Больше осознанной практики.
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#475569]">
            Спокойное рабочее пространство, которое помогает сосредоточиться на
            следующем полезном шаге.
          </p>
        </RevealInView>
      </div>
    </section>
  )
}
