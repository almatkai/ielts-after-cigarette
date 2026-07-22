import { motion } from 'motion/react'

import { RevealInView } from '../smoothui/reveal'
import { SmoothButton } from '../smoothui/smooth-button'

export function FinalCta() {
  return (
    <section
      id="start"
      className="section-shell scroll-mt-20"
      aria-labelledby="cta-heading"
    >
      <div className="container-shell">
        <RevealInView>
          <div className="relative overflow-hidden rounded-[18px] border border-[#f2dcdc] bg-[#fff0f0] px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            <div
              className="absolute top-0 right-0 left-0 h-px bg-[#f2dcdc]"
              aria-hidden
            >
              <motion.span
                className="block h-px bg-[#e23b3b]"
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <p className="text-xs font-semibold tracking-[0.09em] text-[#69696d] uppercase">
                  Следующий шаг
                </p>
                <h2
                  id="cta-heading"
                  className="mt-5 max-w-4xl text-[clamp(2.25rem,4.6vw,4.75rem)] leading-[1.02] font-medium tracking-[-0.06em] text-balance"
                >
                  Путь к целевому баллу начинается со следующей сфокусированной
                  тренировки.
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:flex-col lg:items-stretch">
                <SmoothButton href="#practice" className="w-full">
                  Начать подготовку
                </SmoothButton>
                <SmoothButton
                  href="#practice"
                  variant="secondary"
                  className="w-full border-[#e7cdcd] bg-white/70"
                >
                  Перейти к практике
                </SmoothButton>
              </div>
            </div>
          </div>
        </RevealInView>
      </div>
    </section>
  )
}
