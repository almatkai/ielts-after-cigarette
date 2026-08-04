import { heroContent } from '#/content/landing-content'

import { Reveal } from '../smoothui/reveal'
import { SmoothButton } from '../smoothui/smooth-button'
import SplashCursor from '../reactbits/splash-cursor'
import { BandTrajectory } from './band-trajectory'
import { HeroBackground } from './hero-background'

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-32 sm:pb-24 sm:pt-40 lg:pb-28 lg:pt-44">
      <HeroBackground />
      <SplashCursor
        className="opacity-70"
        SIM_RESOLUTION={96}
        DYE_RESOLUTION={512}
        DENSITY_DISSIPATION={2.8}
        VELOCITY_DISSIPATION={1.7}
        SPLAT_RADIUS={0.22}
        SPLAT_FORCE={3600}
        COLOR_UPDATE_SPEED={4}
        RAINBOW_MODE={false}
        COLOR="#3b82f6"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,255,255,0.34),rgba(255,255,255,0.08)_58%,rgba(255,255,255,0.28))]"
        aria-hidden
      />
      <div className="container-shell relative z-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="lg:col-span-7">
            <Reveal delay={0.04}>
              <div className="inline-flex flex-col items-start gap-2 text-xs font-semibold tracking-[0.09em] text-[#475569] uppercase">
                <span>{heroContent.eyebrow}</span>
                <span className="h-px w-9 bg-[#3b82f6]" aria-hidden />
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
              className="mt-7 max-w-[610px] text-lg leading-8 text-[#475569] sm:text-xl"
            >
              {heroContent.description}
            </Reveal>
            <Reveal
              delay={0.25}
              className="mt-9 flex flex-col gap-3 min-[440px]:flex-row"
            >
              <SmoothButton to="/register" className="min-[440px]:w-auto">
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
