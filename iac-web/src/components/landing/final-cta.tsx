import { motion } from 'motion/react'

import { RevealInView } from '../smoothui/reveal'
import { SmoothButton } from '../smoothui/smooth-button'

export function FinalCta() {
  return (
    <section
      id="start"
      className="scroll-mt-20 py-14 sm:py-16 lg:py-20"
      aria-labelledby="cta-heading"
    >
      <div className="container-shell">
        <RevealInView>
          <div className="relative overflow-hidden rounded-[18px] border border-[#e7e7e4] bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-12">
            <div
              className="absolute top-0 right-0 left-0 h-px bg-[#e7e7e4]"
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
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-4">
              <div className="lg:col-span-7">
                <p className="text-xs font-semibold tracking-[0.09em] text-[#69696d] uppercase">
                  Следующий шаг
                </p>
                <h2
                  id="cta-heading"
                  className="mt-4 max-w-4xl text-[clamp(2.15rem,3.8vw,3.65rem)] leading-[1.03] font-medium tracking-[-0.055em] text-balance"
                >
                  Следующая тренировка — шаг к целевому баллу.
                </h2>
                <p className="mt-5 max-w-[580px] text-base leading-7 text-[#69696d] sm:text-lg">
                  Соберите подготовку вокруг своей цели и практикуйтесь в
                  удобном темпе.
                </p>
                <div className="mt-7 w-full sm:max-w-[280px]">
                  <SmoothButton to="/register" className="w-full">
                    Начать подготовку
                  </SmoothButton>
                </div>
              </div>

              <div className="flex min-w-0 flex-col items-center lg:col-span-5">
                <motion.div
                  className="relative flex w-full max-w-[350px] justify-center lg:-my-5 lg:-mr-4"
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{
                    duration: 0.75,
                    delay: 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <img
                    src="/fox_focused_training.png"
                    alt="Лиса сосредоточенно выполняет тренировочное задание"
                    width={1600}
                    height={1600}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full max-w-[280px] object-contain sm:max-w-[320px] lg:max-w-[350px]"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </RevealInView>
      </div>
    </section>
  )
}
