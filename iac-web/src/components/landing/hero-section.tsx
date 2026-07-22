import { heroContent } from '#/content/landing-content'

import { Reveal } from '../smoothui/reveal'
import { SmoothButton } from '../smoothui/smooth-button'
import { BandTrajectory } from './band-trajectory'
import { HeroBackground } from './hero-background'

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-32 sm:pb-24 sm:pt-40 lg:pb-28 lg:pt-44">
      <HeroBackground />
      <div className="container-shell relative z-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="lg:col-span-7">
            <Reveal delay={0.04}>
              <div className="inline-flex flex-col items-start gap-2 text-xs font-semibold tracking-[0.09em] text-[#69696d] uppercase">
                <span>{heroContent.eyebrow}</span>
                <span className="h-px w-9 bg-[#e23b3b]" aria-hidden />
              </div>
            </Reveal>
            <Reveal delay={0.11}>
              <h1 className="hero-heading mt-7">
                {heroContent.titleStart}{' '}
                <em className="font-accent font-normal italic">
                  {heroContent.titleAccent}
                </em>
                .
              </h1>
            </Reveal>
            <Reveal
              as="p"
              delay={0.18}
              className="mt-7 max-w-[610px] text-lg leading-8 text-[#69696d] sm:text-xl"
            >
              {heroContent.description}
            </Reveal>
            <Reveal
              delay={0.25}
              className="mt-9 flex flex-col gap-3 min-[440px]:flex-row"
            >
              <SmoothButton href="#start" className="min-[440px]:w-auto">
                {heroContent.primaryAction}
              </SmoothButton>
              <SmoothButton
                href="#method"
                variant="secondary"
                className="min-[440px]:w-auto"
              >
                {heroContent.secondaryAction}
              </SmoothButton>
            </Reveal>
          </div>

          <Reveal delay={0.32} className="lg:col-span-5 lg:self-center">
            <BandTrajectory />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
