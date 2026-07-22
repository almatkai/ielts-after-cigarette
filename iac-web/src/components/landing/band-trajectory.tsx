import { Calendar, TrendUp } from 'iconsax-react'

import { skillProgress } from '#/content/landing-content'

import { AnimatedProgress } from '../smoothui/animated-progress'

export function BandTrajectory() {
  return (
    <div
      className="product-panel relative overflow-hidden"
      aria-label="Демонстрация панели прогресса"
    >
      <div className="flex items-center justify-between border-b border-[#e7e7e4] px-5 py-4 sm:px-7">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-[#e23b3b]" aria-hidden />
          <span className="text-xs font-semibold tracking-[0.08em] text-[#69696d] uppercase">
            Демонстрационные данные
          </span>
        </div>
        <span className="text-xs text-[#8b8b8e]">Обзор прогресса</span>
      </div>

      <div className="grid lg:grid-cols-[1.16fr_0.84fr]">
        <div className="border-b border-[#e7e7e4] p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm text-[#69696d]">Текущая траектория</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-[-0.07em] text-[#111111]">
                  6,0
                </span>
                <span className="mb-1.5 text-sm text-[#69696d]">из 9,0</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#69696d]">Целевой балл</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                7,5
              </p>
            </div>
          </div>

          <figure className="mt-8" aria-labelledby="hero-chart-caption">
            <svg
              className="h-36 w-full overflow-visible"
              viewBox="0 0 520 150"
              role="img"
              aria-label="Траектория демонстрационного балла растёт от 5,5 до 6,0; следующая цель — 6,5"
            >
              <g stroke="#e7e7e4" strokeWidth="1">
                <path d="M0 24H520" />
                <path d="M0 75H520" />
                <path d="M0 126H520" />
              </g>
              <path
                d="M5 124 C78 119 92 100 157 102 S245 88 298 81 S385 65 448 46 S493 35 515 25"
                fill="none"
                stroke="#e23b3b"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
              <path
                d="M5 124 C78 119 92 100 157 102 S245 88 298 81 S385 65 448 46 S493 35 515 25"
                fill="none"
                stroke="#e23b3b"
                strokeWidth="8"
                opacity="0.08"
                strokeLinecap="round"
              />
              <circle
                cx="515"
                cy="25"
                r="5"
                fill="#fff"
                stroke="#e23b3b"
                strokeWidth="2.5"
              />
            </svg>
            <figcaption
              id="hero-chart-caption"
              className="mt-1 flex justify-between text-xs text-[#8b8b8e]"
            >
              <span>Текущий уровень — 6,0</span>
              <span>Следующая цель — 6,5</span>
            </figcaption>
          </figure>

          <div className="mt-7 border-t border-[#e7e7e4] pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Calendar
                size={18}
                color="currentColor"
                variant="Linear"
                aria-hidden
              />
              На этой неделе — 4 тренировки
            </div>
          </div>
        </div>

        <div className="flex flex-col p-5 sm:p-7">
          <div>
            <p className="text-sm font-semibold">Навыки</p>
            <div className="mt-5 space-y-4">
              {skillProgress.map((skill) => (
                <div key={skill.label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-[#69696d]">{skill.label}</span>
                    <span className="font-semibold text-[#111111]">
                      {skill.score}
                    </span>
                  </div>
                  <AnimatedProgress
                    value={skill.value}
                    label={`${skill.label}: ${skill.value}%`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-[#e7e7e4] pt-5">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.06em] text-[#69696d] uppercase">
              <TrendUp
                size={17}
                color="currentColor"
                variant="Linear"
                aria-hidden
              />
              Следующая практика
            </div>
            <p className="mt-3 text-base leading-6 font-semibold">
              Чтение — поиск ключевых деталей
            </p>
            <p className="mt-1 text-sm text-[#69696d]">
              18 минут · уровень 6,0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
