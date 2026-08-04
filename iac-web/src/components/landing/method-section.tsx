import { DocumentText, RouteSquare, TickCircle } from 'iconsax-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { methodSteps } from '#/content/landing-content'
import { cn } from '#/lib/utils'

import { RevealInView } from '../smoothui/reveal'

function DiagnosePreview() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="preview-label">Стартовая точка</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.06em]">6,0</p>
        </div>
        <span className="grid size-10 place-items-center rounded-[10px] bg-[#eff6ff] text-[#3b82f6]">
          <RouteSquare
            size={21}
            color="currentColor"
            variant="Linear"
            aria-hidden
          />
        </span>
      </div>
      <div className="mt-10 space-y-5">
        {[
          ['Письмо', 'Аргументация', 48],
          ['Чтение', 'Поиск деталей', 62],
          ['Аудирование', 'Карта маршрута', 74],
        ].map(([skill, focus, value]) => (
          <div
            key={String(skill)}
            className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm"
          >
            <span className="font-semibold">{skill}</span>
            <span className="text-[#475569]">{focus}</span>
            <div className="col-span-2 h-1 rounded-full bg-[#e2e8f0]">
              <div
                className="h-full rounded-full bg-[#0f172a]"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 border-t border-[#e2e8f0] pt-5 text-sm text-[#475569]">
        Фокус недели — структура письменного ответа
      </p>
    </div>
  )
}

function PracticePreview() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="preview-label">Следующая задача</p>
          <h3 className="mt-3 text-2xl leading-8 font-semibold tracking-[-0.04em]">
            Чтение: ключевые детали
          </h3>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#eff6ff] text-[#3b82f6]">
          <DocumentText
            size={21}
            color="currentColor"
            variant="Linear"
            aria-hidden
          />
        </span>
      </div>
      <div className="mt-8 grid grid-cols-3 border-y border-[#e2e8f0] py-5 text-center">
        <div>
          <span className="block text-lg font-semibold">18</span>
          <span className="text-xs text-[#475569]">минут</span>
        </div>
        <div className="border-x border-[#e2e8f0]">
          <span className="block text-lg font-semibold">8</span>
          <span className="text-xs text-[#475569]">вопросов</span>
        </div>
        <div>
          <span className="block text-lg font-semibold">6,0</span>
          <span className="text-xs text-[#475569]">уровень</span>
        </div>
      </div>
      <ol className="mt-7 space-y-4 text-sm">
        {[
          'Найдите опорные слова',
          'Сопоставьте формулировки',
          'Проверьте отвлекающие варианты',
        ].map((item, index) => (
          <li key={item} className="flex items-center gap-3">
            <span className="grid size-6 place-items-center rounded-full bg-[#f8fafc] text-[11px] font-semibold">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}

function ReviewPreview() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="preview-label">Разбор тренировки</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            Повторяющийся паттерн
          </h3>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#eff6ff] text-[#3b82f6]">
          <TickCircle
            size={21}
            color="currentColor"
            variant="Linear"
            aria-hidden
          />
        </span>
      </div>
      <div className="mt-8 rounded-[10px] bg-[#f8fafc] p-5">
        <p className="text-sm font-semibold">
          Похожие формулировки в вариантах ответа
        </p>
        <p className="mt-2 text-sm leading-6 text-[#475569]">
          Три ошибки связаны с выбором знакомого слова вместо точного смысла
          фразы.
        </p>
      </div>
      <div className="mt-7 flex items-center justify-between border-b border-[#e2e8f0] pb-4 text-sm">
        <span className="text-[#475569]">Следующий полезный шаг</span>
        <span className="font-semibold">Короткий повтор</span>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs text-[#475569]">
        <span className="size-2 rounded-full bg-[#3b82f6]" />
        Добавлено в план на завтра
      </div>
    </div>
  )
}

const previews = [
  <DiagnosePreview key="diagnose" />,
  <PracticePreview key="practice" />,
  <ReviewPreview key="review" />,
]

export function MethodSection() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section
      id="method"
      className="section-shell scroll-mt-20 border-y border-[#e2e8f0] bg-white"
      aria-labelledby="method-heading"
    >
      <div className="container-shell">
        <RevealInView className="max-w-3xl">
          <p className="eyebrow">Методика</p>
          <h2 id="method-heading" className="section-heading mt-5">
            Сфокусированный цикл для стабильного прогресса.
          </h2>
        </RevealInView>

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:items-center">
          <RevealInView className="relative lg:col-span-7">
            <ol className="relative space-y-2">
              {methodSteps.map((step, index) => {
                const isActive = activeStep === index
                const isComplete = index < activeStep
                return (
                  <li key={step.number} className="relative">
                    {index < methodSteps.length - 1 ? (
                      <>
                        <span
                          className="pointer-events-none absolute top-10 -bottom-2 left-[23.5px] w-px bg-[#e2e8f0]"
                          aria-hidden
                        />
                        <motion.span
                          className="pointer-events-none absolute top-10 -bottom-2 left-[23.5px] w-px bg-[#3b82f6]"
                          initial={false}
                          animate={{ opacity: index < activeStep ? 1 : 0 }}
                          transition={{
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          aria-hidden
                        />
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setActiveStep(index)}
                      aria-pressed={isActive}
                      className="group relative grid min-h-32 w-full grid-cols-[48px_1fr] gap-5 py-4 text-left"
                    >
                      <span
                        className={cn(
                          'relative z-10 grid size-12 place-items-center rounded-full border bg-white text-xs font-semibold transition-colors',
                          isActive &&
                            'border-[#3b82f6] bg-[#3b82f6] text-white',
                          isComplete && 'border-[#3b82f6] text-[#3b82f6]',
                          !isActive &&
                            !isComplete &&
                            'border-[#cbd5e1] text-[#475569]',
                        )}
                      >
                        {step.number}
                      </span>
                      <span className="relative z-10 pt-1">
                        <span className="block text-xl font-semibold tracking-[-0.03em]">
                          {step.title}
                        </span>
                        <span className="mt-2 block max-w-xl text-sm leading-6 text-[#475569] transition-colors group-hover:text-[#334155] sm:text-base sm:leading-7">
                          {step.description}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </RevealInView>

          <RevealInView delay={0.08} className="lg:col-span-5">
            <div className="product-panel min-h-[430px] p-6 sm:p-8">
              <div className="mb-10 flex items-center justify-between text-xs text-[#64748b]">
                <span>Демонстрация метода</span>
                <span>
                  {activeStep + 1} / {methodSteps.length}
                </span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.28 }}
                >
                  {previews[activeStep]}
                </motion.div>
              </AnimatePresence>
            </div>
          </RevealInView>
        </div>
      </div>
    </section>
  )
}
