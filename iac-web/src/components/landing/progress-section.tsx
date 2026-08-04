import { Calendar, Chart, Note1, TrendUp } from 'iconsax-react'

import { skillProgress } from '#/content/landing-content'

import { AnimatedProgress } from '../smoothui/animated-progress'
import { RevealInView } from '../smoothui/reveal'

const recentSessions = [
  {
    skill: 'Чтение',
    focus: 'Ключевые детали',
    date: 'Сегодня',
    duration: '18 мин',
  },
  {
    skill: 'Письмо',
    focus: 'Структура ответа',
    date: 'Вчера',
    duration: '32 мин',
  },
  {
    skill: 'Аудирование',
    focus: 'Имена и даты',
    date: '19 июля',
    duration: '24 мин',
  },
] as const

export function ProgressSection() {
  return (
    <section
      id="progress"
      className="section-shell scroll-mt-20"
      aria-labelledby="progress-heading"
    >
      <div className="container-shell">
        <RevealInView className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow">Прогресс</p>
            <h2 id="progress-heading" className="section-heading mt-5">
              Больше, чем просто итоговый балл.
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-[#475569] lg:col-span-5 lg:justify-self-end">
            Следите за динамикой каждого навыка, регулярностью занятий и
            повторяющимися ошибками.
          </p>
        </RevealInView>

        <RevealInView delay={0.08} className="mt-12">
          <div className="product-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Chart
                  size={19}
                  color="currentColor"
                  variant="Linear"
                  aria-hidden
                />
                Аналитика прогресса
              </div>
              <div className="flex items-center gap-2 text-xs text-[#475569]">
                <span
                  className="size-2 rounded-full bg-[#3b82f6]"
                  aria-hidden
                />
                Демонстрационные данные
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
              <div className="border-b border-[#e2e8f0] p-5 sm:p-8 lg:border-r lg:border-b-0">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p className="preview-label">Динамика балла</p>
                    <div className="mt-3 flex items-baseline gap-3">
                      <span className="text-5xl font-semibold tracking-[-0.07em]">
                        6,0
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-[#0f172a]">
                        <TrendUp
                          size={17}
                          color="currentColor"
                          variant="Linear"
                          aria-hidden
                        />
                        движение к 6,5
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-5 text-xs text-[#475569]">
                    <span className="flex items-center gap-2">
                      <span className="h-0.5 w-5 bg-[#3b82f6]" />
                      Текущая неделя
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-0.5 w-5 bg-[#cbd5e1]" />
                      Предыдущая неделя
                    </span>
                  </div>
                </div>

                <figure
                  className="mt-8"
                  aria-labelledby="progress-chart-caption"
                >
                  <svg
                    viewBox="0 0 720 260"
                    className="h-auto w-full"
                    role="img"
                    aria-label="График постепенного роста демонстрационного балла с 5,5 до 6,0 за восемь недель"
                  >
                    <g stroke="#e2e8f0" strokeWidth="1">
                      <path d="M38 30H700" />
                      <path d="M38 95H700" />
                      <path d="M38 160H700" />
                      <path d="M38 225H700" />
                    </g>
                    <g
                      fill="#64748b"
                      fontSize="11"
                      fontFamily="Manrope Variable"
                    >
                      <text x="0" y="34">
                        7,0
                      </text>
                      <text x="0" y="99">
                        6,5
                      </text>
                      <text x="0" y="164">
                        6,0
                      </text>
                      <text x="0" y="229">
                        5,5
                      </text>
                    </g>
                    <path
                      d="M42 216 C115 210 135 197 204 198 S294 177 366 180 S461 155 530 151 S635 126 696 102"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                      strokeDasharray="5 7"
                    />
                    <path
                      d="M42 216 C106 215 145 202 204 190 S296 182 366 166 S468 151 530 134 S638 104 696 80"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {[42, 204, 366, 530, 696].map((cx, index) => (
                      <circle
                        key={cx}
                        cx={cx}
                        cy={[216, 190, 166, 134, 80][index]}
                        r="4"
                        fill="#fff"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                    ))}
                    <g
                      fill="#64748b"
                      fontSize="11"
                      fontFamily="Manrope Variable"
                    >
                      <text x="38" y="255">
                        Нед. 1
                      </text>
                      <text x="350" y="255">
                        Нед. 4
                      </text>
                      <text x="660" y="255">
                        Нед. 8
                      </text>
                    </g>
                  </svg>
                  <figcaption id="progress-chart-caption" className="sr-only">
                    Красная линия показывает текущую демонстрационную
                    траекторию: рост с 5,5 до 6,0. Пунктиром показана предыдущая
                    неделя.
                  </figcaption>
                </figure>

                <div className="mt-9 border-t border-[#e2e8f0] pt-7">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-sm font-semibold">Баланс навыков</p>
                    <span className="text-xs text-[#64748b]">
                      Последние 30 дней
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {skillProgress.map((skill) => (
                      <div key={skill.label}>
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-[#475569]">{skill.label}</span>
                          <span className="font-semibold">{skill.score}</span>
                        </div>
                        <AnimatedProgress
                          value={skill.value}
                          label={`${skill.label}: демонстрационный прогресс ${skill.value}%`}
                          indicatorClassName={
                            skill.label === 'Письмо'
                              ? 'bg-[#3b82f6]'
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="border-b border-[#e2e8f0] p-5 sm:p-7">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar
                      size={18}
                      color="currentColor"
                      variant="Linear"
                      aria-hidden
                    />
                    Последние занятия
                  </div>
                  <div className="mt-5 divide-y divide-[#e2e8f0]">
                    {recentSessions.map((session) => (
                      <div
                        key={`${session.skill}-${session.date}`}
                        className="py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold">{session.skill}</span>
                          <span className="text-xs text-[#64748b]">
                            {session.date}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between gap-3 text-xs text-[#475569]">
                          <span>{session.focus}</span>
                          <span>{session.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-b border-[#e2e8f0] p-5 sm:p-7">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Note1
                      size={18}
                      color="currentColor"
                      variant="Linear"
                      aria-hidden
                    />
                    Частые ошибки
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-[#475569]">
                        Похожие формулировки
                      </span>
                      <span className="font-semibold">5</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#475569]">
                        Связность аргумента
                      </span>
                      <span className="font-semibold">3</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#475569]">Детали в аудио</span>
                      <span className="font-semibold">2</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 sm:p-7">
                  <p className="text-sm font-semibold">Регулярность</p>
                  <div
                    className="mt-5 grid grid-cols-7 gap-2"
                    aria-label="За текущую неделю выполнено четыре тренировки"
                  >
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(
                      (day, index) => (
                        <div key={day} className="text-center">
                          <span
                            className={`mx-auto block size-6 rounded-[6px] ${[0, 2, 3, 5].includes(index) ? 'bg-[#0f172a]' : 'bg-[#e2e8f0]'}`}
                          />
                          <span className="mt-2 block text-[10px] text-[#64748b]">
                            {day}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealInView>
      </div>
    </section>
  )
}
