import { RevealInView } from '../smoothui/reveal'
import { ValueOrbitBackground } from './value-orbit-background'

export function ValueSection() {
  return (
    <section
      className="section-shell relative isolate overflow-hidden border-y border-[#e7e7e4] bg-white"
      aria-labelledby="value-heading"
    >
      <ValueOrbitBackground />
      <div className="container-shell relative z-10 grid gap-10 lg:grid-cols-12 lg:items-end">
        <RevealInView className="lg:col-span-8">
          <div className="mb-7 flex items-center gap-3" aria-hidden>
            <span className="size-2 rounded-full bg-[#e23b3b]" />
            <span className="h-px w-16 bg-[#e23b3b]" />
          </div>
          <h2 id="value-heading" className="section-heading max-w-[850px]">
            Подготовка должна быть точной, а не изматывающей.
          </h2>
        </RevealInView>
        <RevealInView delay={0.08} className="lg:col-span-4 lg:pb-2">
          <p className="max-w-md text-base leading-7 text-[#69696d] lg:ml-auto">
            Вместо бесконечного повторения полных тестов — понятный план,
            сфокусированная практика и разбор ошибок.
          </p>
        </RevealInView>
      </div>
    </section>
  )
}
