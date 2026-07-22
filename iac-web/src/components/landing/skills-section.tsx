import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { skillData } from '#/content/landing-content'

import type { SkillId } from '#/content/landing-content'

import { AnimatedTabs } from '../smoothui/animated-tabs'
import { RevealInView } from '../smoothui/reveal'
import { SkillPreview } from './skill-preview'

export function SkillsSection() {
  const [activeSkill, setActiveSkill] = useState<SkillId>('listening')
  const activeContent =
    skillData.find((skill) => skill.id === activeSkill) ?? skillData[0]

  return (
    <section
      id="practice"
      className="section-shell scroll-mt-20"
      aria-labelledby="skills-heading"
    >
      <div className="container-shell">
        <RevealInView className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow">Практика навыков</p>
            <h2 id="skills-heading" className="section-heading mt-5">
              Одна система. Четыре навыка.
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-[#69696d] lg:col-span-4 lg:justify-self-end">
            Меняется не только содержание — каждый навык получает подходящий
            рабочий формат.
          </p>
        </RevealInView>

        <RevealInView delay={0.08} className="mt-12">
          <AnimatedTabs
            items={skillData}
            value={activeSkill}
            onChange={setActiveSkill}
            label="Навыки IELTS"
          />

          <div className="mt-7 grid gap-7 lg:grid-cols-[0.3fr_0.7fr] lg:items-start">
            <div className="lg:pt-8">
              <p className="text-xs font-semibold tracking-[0.08em] text-[#69696d] uppercase">
                Активный навык
              </p>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
                {activeContent.label}
              </h3>
              <p className="mt-4 max-w-sm text-base leading-7 text-[#69696d]">
                {activeContent.description}
              </p>
              <div className="mt-8 flex items-center gap-3 text-xs text-[#8b8b8e]">
                <span
                  className="size-2 rounded-full bg-[#e23b3b]"
                  aria-hidden
                />
                Демонстрация интерфейса
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeSkill}
                id={`panel-${activeSkill}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeSkill}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <SkillPreview skill={activeSkill} />
              </motion.div>
            </AnimatePresence>
          </div>
        </RevealInView>
      </div>
    </section>
  )
}
