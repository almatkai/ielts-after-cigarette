import { MotionConfig } from 'motion/react'

import { DifferentiationSection } from '#/components/landing/differentiation-section'
import { FinalCta } from '#/components/landing/final-cta'
import { HeroSection } from '#/components/landing/hero-section'
import { LandingFooter } from '#/components/landing/landing-footer'
import { LandingHeader } from '#/components/landing/landing-header'
import { MethodSection } from '#/components/landing/method-section'
import { ProgressSection } from '#/components/landing/progress-section'
import { SkillsSection } from '#/components/landing/skills-section'
import { ValueSection } from '#/components/landing/value-section'

export function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div
        id="top"
        className="min-h-screen overflow-clip bg-[#fafaf8] text-[#111111]"
      >
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-[10px] bg-[#111111] px-4 py-3 text-white focus:fixed focus:top-3 focus:left-3 focus:inline-flex focus:min-h-11 focus:items-center focus:not-sr-only"
        >
          Перейти к содержанию
        </a>
        <LandingHeader />
        <main id="main-content">
          <HeroSection />
          <ValueSection />
          <SkillsSection />
          <MethodSection />
          <ProgressSection />
          <DifferentiationSection />
          <FinalCta />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  )
}
