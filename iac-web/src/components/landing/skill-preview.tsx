import {
  ArrowLeft,
  ArrowRight,
  Book1,
  Clock,
  Edit2,
  Headphone,
  Microphone2,
  Play,
} from 'iconsax-react'

import type { SkillId } from '#/content/landing-content'

const waveform = [
  22, 45, 30, 64, 39, 72, 56, 32, 61, 78, 44, 28, 54, 68, 34, 50, 73, 42, 25,
  59, 38, 70, 48, 31,
]

function PreviewHeader({
  icon: Icon,
  title,
  meta,
}: {
  icon: typeof Headphone
  title: string
  meta: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#e7e7e4] px-5 py-4 sm:px-7">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-[10px] bg-[#f4f4f1] text-[#111111]">
          <Icon size={19} color="currentColor" variant="Linear" aria-hidden />
        </span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <span className="text-xs text-[#8b8b8e]">{meta}</span>
    </div>
  )
}

function ListeningPreview() {
  return (
    <div className="skill-interface">
      <PreviewHeader icon={Headphone} title="Аудирование" meta="Часть 2 из 4" />
      <div className="grid min-h-[390px] md:grid-cols-[1.25fr_0.75fr]">
        <div className="border-b border-[#e7e7e4] p-5 sm:p-7 md:border-r md:border-b-0">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-[#69696d]">
              Фрагмент 02:18
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#69696d]">
              <Clock
                size={16}
                color="currentColor"
                variant="Linear"
                aria-hidden
              />
              Осталось 21:42
            </span>
          </div>

          <div className="mt-12 flex items-center gap-4">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-full bg-[#111111] text-white"
              aria-label="Прослушать"
            >
              <Play
                size={18}
                color="currentColor"
                variant="Linear"
                aria-hidden
              />
            </span>
            <div className="flex h-20 flex-1 items-center gap-1" aria-hidden>
              {waveform.map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className={
                    index < 9 ? 'wave-bar wave-bar--active' : 'wave-bar'
                  }
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-[#e7e7e4] pt-5 text-xs text-[#69696d]">
            <span>00:48</span>
            <span>Пауза доступна один раз</span>
            <span>02:18</span>
          </div>
        </div>

        <div className="flex flex-col p-5 sm:p-7">
          <span className="text-xs font-semibold tracking-[0.08em] text-[#69696d] uppercase">
            Вопрос 8 из 40
          </span>
          <p className="mt-5 text-lg leading-7 font-semibold">
            В какое время начинается экскурсия?
          </p>
          <div className="mt-6 space-y-2.5 text-sm">
            {['В 9:15', 'В 9:30', 'В 9:45'].map((answer, index) => (
              <div
                key={answer}
                className={`flex min-h-11 items-center gap-3 rounded-[10px] border px-3 ${index === 1 ? 'border-[#111111] bg-[#f4f4f1]' : 'border-[#e7e7e4]'}`}
              >
                <span className="grid size-5 place-items-center rounded-full border border-[#c9c9c5] text-[10px]">
                  {String.fromCharCode(65 + index)}
                </span>
                {answer}
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-end gap-2 pt-7 text-sm font-semibold">
            Следующий вопрос
            <ArrowRight
              size={17}
              color="currentColor"
              variant="Linear"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ReadingPreview() {
  return (
    <div className="skill-interface">
      <PreviewHeader
        icon={Book1}
        title="Чтение"
        meta="Текст 1 · Вопрос 12 из 40"
      />
      <div className="grid min-h-[390px] md:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-[#e7e7e4] p-5 sm:p-7 md:border-r md:border-b-0">
          <div className="mb-5 flex gap-5 text-xs font-semibold">
            <span className="text-[#111111]">Текст</span>
            <span className="text-[#8b8b8e]">Вопросы</span>
          </div>
          <h3 className="text-xl font-semibold tracking-[-0.03em]">
            Как города возвращают пространство пешеходам
          </h3>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[#69696d]">
            <p>
              Небольшие изменения городской среды постепенно влияют на
              повседневные маршруты жителей.
            </p>
            <p>
              <mark className="bg-[#fff0f0] px-1.5 py-0.5 text-[#111111]">
                Наиболее заметный эффект появляется там, где новые маршруты
                соединяют уже существующие общественные пространства.
              </mark>
            </p>
            <p className="hidden sm:block">
              Исследователи отмечают: важна не длина отдельного участка, а
              связность всей сети.
            </p>
          </div>
        </div>
        <div className="flex flex-col p-5 sm:p-7">
          <span className="text-xs font-semibold tracking-[0.08em] text-[#69696d] uppercase">
            Выделенный фрагмент
          </span>
          <p className="mt-5 text-base leading-7 font-semibold">
            Какое условие автор считает главным для успеха изменений?
          </p>
          <div className="mt-6 rounded-[10px] bg-[#f4f4f1] p-4 text-sm leading-6 text-[#69696d]">
            Выберите формулировку, которая точнее всего передаёт мысль автора.
          </div>
          <div className="mt-auto flex items-center justify-between pt-8 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <ArrowLeft
                size={17}
                color="currentColor"
                variant="Linear"
                aria-hidden
              />
              Предыдущий
            </span>
            <span className="flex items-center gap-2">
              Следующий
              <ArrowRight
                size={17}
                color="currentColor"
                variant="Linear"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function WritingPreview() {
  const categories = ['Структура', 'Связность', 'Лексика', 'Грамматика']
  return (
    <div className="skill-interface">
      <PreviewHeader icon={Edit2} title="Письмо" meta="Задание 2 · 34:12" />
      <div className="grid min-h-[390px] md:grid-cols-[1.25fr_0.75fr]">
        <div className="border-b border-[#e7e7e4] p-5 sm:p-7 md:border-r md:border-b-0">
          <div className="rounded-[10px] bg-[#f4f4f1] p-4 text-sm leading-6">
            <span className="mb-2 block text-xs font-semibold tracking-[0.08em] text-[#69696d] uppercase">
              Задание
            </span>
            Обсудите обе точки зрения и сформулируйте собственную позицию.
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-[#69696d]">
              <span>Ваш ответ</span>
              <span>Количество слов — 184</span>
            </div>
            <div
              className="editor-lines mt-5"
              aria-label="Демонстрационный текст ответа"
            >
              <span className="w-full" />
              <span className="w-[92%]" />
              <span className="w-[96%]" />
              <span className="w-[78%]" />
              <span className="mt-3 w-[94%]" />
              <span className="w-[88%]" />
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <span className="text-xs font-semibold tracking-[0.08em] text-[#69696d] uppercase">
            Критерии для разбора
          </span>
          <p className="mt-4 text-sm leading-6 text-[#69696d]">
            После тренировки отметьте, что стоит проверить внимательнее.
          </p>
          <div className="mt-7 divide-y divide-[#e7e7e4] border-y border-[#e7e7e4]">
            {categories.map((category, index) => (
              <div
                key={category}
                className="flex min-h-13 items-center justify-between text-sm"
              >
                <span>{category}</span>
                <span
                  className={`size-2 rounded-full ${index === 1 ? 'bg-[#e23b3b]' : 'bg-[#c9c9c5]'}`}
                  aria-hidden
                />
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-[#8b8b8e]">
            Без автоматической оценки — только структура для самостоятельного
            разбора.
          </p>
        </div>
      </div>
    </div>
  )
}

function SpeakingPreview() {
  return (
    <div className="skill-interface">
      <PreviewHeader
        icon={Microphone2}
        title="Устная речь"
        meta="Часть 2 из 3"
      />
      <div className="grid min-h-[390px] md:grid-cols-[0.85fr_1.15fr]">
        <div className="border-b border-[#e7e7e4] p-5 sm:p-7 md:border-r md:border-b-0">
          <span className="text-xs font-semibold tracking-[0.08em] text-[#69696d] uppercase">
            Тема
          </span>
          <p className="mt-5 text-xl leading-8 font-semibold tracking-[-0.02em]">
            Расскажите о месте, в котором вам легко сосредоточиться.
          </p>
          <p className="mt-4 text-sm leading-6 text-[#69696d]">
            Объясните, где оно находится и почему помогает вам работать.
          </p>
          <div className="mt-8 flex justify-between border-t border-[#e7e7e4] pt-5 text-xs text-[#69696d]">
            <span>Подготовка — 1 минута</span>
            <span>Ответ — до 2 минут</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-5 text-center sm:p-7">
          <span className="relative grid size-24 place-items-center rounded-full border border-[#e7e7e4] bg-[#fafaf8]">
            <span
              className="absolute inset-2 rounded-full border border-[#e23b3b]/25"
              aria-hidden
            />
            <Microphone2
              size={28}
              color="#e23b3b"
              variant="Linear"
              aria-hidden
            />
          </span>
          <span className="mt-6 text-xs font-semibold tracking-[0.08em] text-[#e23b3b] uppercase">
            Запись
          </span>
          <span className="mt-2 text-4xl font-semibold tracking-[-0.06em]">
            01:24
          </span>
          <div
            className="mt-8 flex w-full max-w-xs items-center gap-1.5"
            aria-label="Временная шкала сессии"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <span
                key={index}
                className={`h-1 flex-1 rounded-full ${index < 8 ? 'bg-[#111111]' : 'bg-[#e7e7e4]'}`}
              />
            ))}
          </div>
          <span className="mt-7 text-sm font-semibold">Завершить запись</span>
        </div>
      </div>
    </div>
  )
}

export function SkillPreview({ skill }: { skill: SkillId }) {
  if (skill === 'reading') return <ReadingPreview />
  if (skill === 'writing') return <WritingPreview />
  if (skill === 'speaking') return <SpeakingPreview />
  return <ListeningPreview />
}
