import {
  ArrowLeft2,
  ArrowRight2,
  CloseCircle,
  Refresh,
  Send2,
} from 'iconsax-react'
import { useEffect, useRef, useState } from 'react'

import { FoxMascot } from './fox-mascot'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const quickPrompts = [
  'Критерии Writing Task 2',
  'Разница True / False / Not Given',
  'Как готовить Speaking Part 2?',
  'Тайм-менеджмент в Reading',
  'Расчёт Band Score',
  'Структура Writing Task 1',
  'Советы для Listening Part 4',
  'Как избежать ошибок в spelling?',
] as const

type Message = {
  id: string
  sender: 'fox' | 'user'
  text: string
  time: string
}

function getInitialMessages(): Message[] {
  return [
    {
      id: 'welcome',
      sender: 'fox',
      text: 'Привет! Меня зовут Юки 🦊 — я твой наставник по IELTS. Могу подсказать структуру эссе, разобрать критерии Band Descriptors, объяснить логику вопросов в Reading и дать советы по таймингу. Что тебя интересует?',
      time: 'сейчас',
    },
  ]
}

function generateAnswer(query: string): string {
  const lower = query.toLowerCase()

  if (lower.includes('task 1') || lower.includes('график') || lower.includes('диаграмм')) {
    return 'В Writing Task 1 (описание графика, диаграммы, таблицы или схемы процесса):\n\n1. Introduction — перефразируйте задание одним чётким предложением.\n2. Overview (критически важный абзац!) — опишите 2–3 главных тренда/отличия без углубления в цифры (без чёткого Overview балл не поднимается выше 5.0).\n3. Body 1 & Body 2 — сгруппируйте данные логично, сравните показатели и приведите конкретные цифры.\n\nРекомендация: пишите минимум 150 слов и тратьте не более 20 минут.'
  }

  if (lower.includes('writing') || lower.includes('эссе') || lower.includes('task 2')) {
    return 'В Writing Task 2 эссе оценивается по 4 критериям (по 25% каждый):\n\n1. Task Response — полный ответ на все части темы, ясная позиция и аргументы.\n2. Coherence & Cohesion — логика абзацев и естественные связки.\n3. Lexical Resource — точный академический вокабуляр и коллокации.\n4. Grammatical Range — разнообразие сложных структур и пунктуация.\n\nСовет: напишите минимум 250 слов и всегда оставляйте 3–5 минут на финальную вычитку.'
  }

  if (lower.includes('false') || lower.includes('not given') || lower.includes('tfng')) {
    return 'Главное отличие True / False / Not Given:\n\n• TRUE — факт подтверждается в тексте напрямую или перифразом.\n• FALSE — факт в тексте прямо противоречит утверждению (противоположный смысл).\n• NOT GIVEN — об этом в тексте просто нет информации (или она не подтверждена, даже если факт верен в реальной жизни).\n\nЗолотое правило: опирайтесь только на написанное в тексте, не додумывайте логические выводы!'
  }

  if (lower.includes('speaking') || lower.includes('part 2') || lower.includes('говорен')) {
    return 'Для Speaking Part 2 (карточка монолога на 2 минуты):\n\n1. Используйте минуту на подготовку: запишите 3–4 ключевых слова по каждому пункту карточки.\n2. Используйте метод PPF (Past, Present, Future): расскажите предысторию, текущее положение дел и свои планы/чувства на будущее — это поможет говорить легко и без пауз.\n3. Не бойтесь перефразировать и использовать связки: "To be completely honest...", "What struck me most was...".'
  }

  if (lower.includes('listening') || lower.includes('аудио') || lower.includes('part 4')) {
    return 'Listening Part 4 — непрерывная академическая лекция на 10 вопросов без пауз:\n\n1. До начала записи быстро прочитайте вопросы и подчеркните ключевые ориентиры.\n2. Определите форму слова перед пропуском: существительное (ед./мн. ч.), число, глагол.\n3. Внимательно следите за словами-указателями лектора: "First of all...", "However...", "The key finding was...".'
  }

  if (lower.includes('spelling') || lower.includes('правописан') || lower.includes('букв')) {
    return 'В IELTS ошибка даже в одной букве лишает балла за ответ:\n\n• Частые коварные слова: accommodation, environment, definitely, embarrass, necessary, questionnaire.\n• Внимательно проверяйте окончания множественного числа (-s / -es) в Listening.\n• Выберите единый стандарт написания (British или American English) и придерживайтесь его.'
  }

  if (lower.includes('reading') || lower.includes('время') || lower.includes('тайм') || lower.includes('чтени')) {
    return 'Стратегия тайм-менеджмента в IELTS Reading (60 минут на 3 текста):\n\n• Текст 1: до 17 минут\n• Текст 2: до 20 минут\n• Текст 3: до 23 минут\n\nСначала читайте заголовок и вопросы, подчеркивайте ключевые слова (имена, даты, термины), а затем применяйте Skimming и Scanning. Не застревайте на одном вопросе дольше 1.5 минут!'
  }

  if (lower.includes('band') || lower.includes('балл') || lower.includes('расчет') || lower.includes('оценк')) {
    return 'Общий IELTS Band Score рассчитывается как среднее арифметическое четырёх навыков (Listening + Reading + Writing + Speaking) / 4 с округлением до ближайшего 0.5:\n\n• Если результат оканчивается на .25 — округляется вверх до .5 (например, 6.25 → 6.5).\n• Если результат оканчивается на .75 — округляется вверх до следующего целого (например, 6.75 → 7.0).'
  }

  return `Отличный вопрос по теме «${query.trim()}»! Для уверенной подготовки держите фокус на ключевых навыках:\n\n• Регулярно решайте материалы в разделе «Практика».\n• Обязательно разбирайте неверные ответы в разделе «Ошибки».\n• Раз в 1–2 недели проходите Full Mock для тренировки концентрации и выносливости.`
}

type AiAssistantChatWindowProps = {
  isOpen: boolean
  onClose: () => void
}

export function AiAssistantChatWindow({
  isOpen,
  onClose,
}: AiAssistantChatWindowProps) {
  const foxSrc = `${import.meta.env.BASE_URL}thoughtful_arctic_fox.webp`
  const [messages, setMessages] = useState<Message[]>(getInitialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Quick Prompts Carousel State & Refs
  const quickPromptsRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Drag to scroll tracking
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragScrollLeft = useRef(0)
  const hasDragged = useRef(false)

  const checkScroll = () => {
    const el = quickPromptsRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6)
  }

  const scrollPrompts = (direction: 'left' | 'right') => {
    const el = quickPromptsRef.current
    if (!el) return
    const offset = direction === 'left' ? -180 : 180
    el.scrollBy({ left: offset, behavior: 'smooth' })
  }

  // Mouse wheel horizontal scroll listener
  useEffect(() => {
    const el = quickPromptsRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if (delta !== 0) {
        e.preventDefault()
        el.scrollLeft += delta * 1.2
        checkScroll()
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    checkScroll()

    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [isOpen])

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = quickPromptsRef.current
    if (!el) return
    setIsDragging(true)
    hasDragged.current = false
    dragStartX.current = e.pageX - el.offsetLeft
    dragScrollLeft.current = el.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = quickPromptsRef.current
    if (!isDragging || !el) return
    const x = e.pageX - el.offsetLeft
    const walk = (x - dragStartX.current) * 1.3
    if (Math.abs(walk) > 4) {
      hasDragged.current = true
    }
    el.scrollLeft = dragScrollLeft.current - walk
    checkScroll()
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        checkScroll()
      }, 150)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim()
    if (!text) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const replyText = generateAnswer(text)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'fox',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    }, 450)
  }

  const handleReset = () => {
    setMessages(getInitialMessages())
    setInput('')
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden origin-bottom-right',
        'bottom-4 right-4 sm:bottom-6 sm:right-6',
        'w-[calc(100vw-32px)] sm:w-[390px] md:w-[420px] h-[530px] sm:h-[580px] max-h-[calc(100vh-80px)]',
        'rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90',
        'shadow-[0_24px_60px_-15px_rgba(15,23,42,0.28),0_0_0_1px_rgba(226,232,240,0.6)]',
        'transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-90 translate-y-6 pointer-events-none',
      )}
    >
      {/* Modern Messenger Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/40 px-4 py-3 select-none">
        <div className="flex items-center gap-2.5">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-blue-50 shadow-xs ring-1 ring-blue-100 flex items-center justify-center">
            <img
              src={foxSrc}
              alt="Юки"
              className="size-full object-contain p-0.5"
            />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500 ring-1 ring-emerald-400/40" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                Юки
              </span>
              <Badge className="border-none bg-blue-50 text-blue-700 px-1.5 py-0 text-[10px] font-bold">
                IELTS AI
              </Badge>
            </div>
            <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Онлайн наставник
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {messages.length > 1 ? (
            <button
              type="button"
              onClick={handleReset}
              title="Очистить диалог"
              className="p-1.5 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Очистить диалог"
            >
              <Refresh className="size-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            title="Закрыть чат"
            className="p-1.5 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Закрыть чат"
          >
            <CloseCircle className="size-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-slate-50/40 via-white to-slate-50/20 text-slate-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-end gap-2',
              msg.sender === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            {msg.sender === 'fox' ? (
              <div className="size-6 shrink-0 overflow-hidden rounded-full border border-blue-200 bg-blue-50/60 p-0.5 flex items-center justify-center">
                <img src={foxSrc} alt="Юки" className="size-full object-contain" />
              </div>
            ) : null}

            <div
              className={cn(
                'max-w-[85%] rounded-2xl p-3 text-xs sm:text-[13px] leading-relaxed shadow-2xs whitespace-pre-wrap',
                msg.sender === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-xs shadow-blue-500/10'
                  : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs',
              )}
            >
              {msg.text}
              <div
                className={cn(
                  'mt-1 text-[9px] font-medium text-right select-none',
                  msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400',
                )}
              >
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {isTyping ? (
          <div className="flex items-end gap-2">
            <div className="size-6 shrink-0 overflow-hidden rounded-full border border-blue-200 bg-blue-50/60 p-0.5 flex items-center justify-center">
              <img src={foxSrc} alt="Юки" className="size-full object-contain" />
            </div>
            <div className="rounded-2xl rounded-bl-xs bg-white border border-slate-200/80 px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 rounded-full bg-blue-600 animate-bounce" />
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel Bar with Mouse Wheel & Arrow Nav & Drag */}
      <div className="relative border-t border-slate-100/90 bg-slate-50/80 backdrop-blur-sm px-2 py-2 select-none group/carousel">
        {/* Left Scroll Arrow */}
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollPrompts('left')}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full bg-white/95 shadow-md border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Прокрутить темы влево"
          >
            <ArrowLeft2 className="size-3.5" />
          </button>
        ) : null}

        {/* Scrollable Prompts Container */}
        <div
          ref={quickPromptsRef}
          onScroll={checkScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={cn(
            'flex items-center gap-1.5 overflow-x-auto px-1 py-0.5 no-scrollbar scroll-smooth',
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab',
          )}
        >
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                if (hasDragged.current) return
                handleSend(prompt)
              }}
              className="rounded-full border border-slate-200/90 bg-white hover:border-blue-300 hover:bg-blue-50/80 hover:text-blue-600 text-[11px] font-medium text-slate-600 px-2.5 py-1 transition-all whitespace-nowrap cursor-pointer shadow-2xs shrink-0 select-none active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Right Scroll Arrow */}
        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scrollPrompts('right')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full bg-white/95 shadow-md border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Прокрутить темы вправо"
          >
            <ArrowRight2 className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Modern Capsule Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="p-3 border-t border-slate-100 bg-white/95 backdrop-blur-md flex items-center gap-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Спроси Юки о подготовке к IELTS..."
          className="flex-1 bg-slate-50/90 border border-slate-200/90 rounded-2xl px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className={cn(
            'size-9 rounded-xl flex items-center justify-center transition-all shrink-0',
            input.trim() && !isTyping
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 hover:scale-105 active:scale-95 cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed',
          )}
          aria-label="Отправить"
        >
          <Send2 className="size-4" />
        </button>
      </form>
    </div>
  )
}

export function AiAssistantFloatingWidget({
  className,
}: {
  className?: string
}) {
  const [bubbleDismissed, setBubbleDismissed] = useState(false)
  const [chatIsOpen, setChatIsOpen] = useState(false)
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const mascotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number | null = null
    const PROXIMITY_RADIUS = 520 // px proximity threshold on screen
    const MAX_SVG_OFFSET = 14 // SVG coordinate displacement

    const handleMouseMove = (e: MouseEvent) => {
      if (chatIsOpen) return
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (!mascotRef.current) return
        const rect = mascotRef.current.getBoundingClientRect()
        const eyeX = rect.left + rect.width * 0.43
        const eyeY = rect.top + rect.height * 0.38

        const dx = e.clientX - eyeX
        const dy = e.clientY - eyeY
        const dist = Math.hypot(dx, dy)

        if (dist < PROXIMITY_RADIUS && dist > 3) {
          const factor = Math.min(1, Math.max(0, 1 - dist / PROXIMITY_RADIUS))
          const angle = Math.atan2(dy, dx)
          const strength = 0.35 + 0.65 * factor
          const targetX = Math.cos(angle) * MAX_SVG_OFFSET * strength
          const targetY = Math.sin(angle) * MAX_SVG_OFFSET * strength
          setEyeOffset({
            x: Math.round(targetX * 10) / 10,
            y: Math.round(targetY * 10) / 10,
          })
        } else {
          setEyeOffset((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }))
        }
      })
    }

    const handleMouseLeave = () => {
      setEyeOffset({ x: 0, y: 0 })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [chatIsOpen])

  return (
    <>
      {/* 1. In-page Floating Chat Messenger at bottom-right (in place of Yuki) */}
      <AiAssistantChatWindow
        isOpen={chatIsOpen}
        onClose={() => setChatIsOpen(false)}
      />

      {/* 2. Floating Mascot & Comic Speech Bubble (smoothly hidden when chat is open) */}
      <div
        className={cn(
          'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end select-none origin-bottom-right transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)',
          chatIsOpen
            ? 'opacity-0 scale-75 translate-y-6 pointer-events-none'
            : 'opacity-100 scale-100 translate-y-0 pointer-events-auto',
          className,
        )}
      >
        {/* Comic Speech Bubble */}
        {!bubbleDismissed ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setChatIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setChatIsOpen(true)
              }
            }}
            className="group/bubble relative mb-2 cursor-pointer max-w-[240px] sm:max-w-[280px] rounded-2xl bg-white/95 p-3.5 shadow-[0_12px_32px_rgba(29,39,61,0.16)] border border-blue-100/90 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-300 hover:shadow-[0_16px_40px_rgba(37,99,235,0.22)] animate-speech-bubble outline-none after:absolute after:-bottom-2.5 after:right-8 sm:after:right-12 after:size-0 after:border-x-8 after:border-x-transparent after:border-t-10 after:border-t-white after:filter after:drop-shadow-[0_2px_1px_rgba(29,39,61,0.06)]"
            aria-label="Открыть чат с Юки"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0f172a] tracking-tight">
                  Юки
                </span>
                <span className="rounded-full bg-blue-50 px-1.5 py-0.2 text-[9px] font-bold text-[#2563eb]">
                  IELTS AI
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setBubbleDismissed(true)
                }}
                className="text-[#94a3b8] hover:text-[#0f172a] -mr-1 -mt-1 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Скрыть подсказку"
                aria-label="Скрыть подсказку"
              >
                <CloseCircle className="size-4" variant="Outline" />
              </button>
            </div>

            <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-[#334155]">
              Привет! Меня зовут <strong>Юки</strong> 🦊 — я твой наставник по IELTS. Спроси меня о структуре, критериях или стратегиях!
            </p>

            <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] font-semibold text-[#2563eb]">
              <span>Нажми, чтобы открыть чат</span>
              <span className="text-xs transition-transform duration-200 group-hover/bubble:translate-x-1">
                →
              </span>
            </div>
          </div>
        ) : null}

        {/* Large Animated Fox Mascot */}
        <button
          type="button"
          onClick={() => setChatIsOpen(true)}
          className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
          aria-label="Открыть чат с Юки"
        >
          <div ref={mascotRef} className="relative animate-fox-float">
            <FoxMascot
              eyeOffset={eyeOffset}
              className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40"
            />
          </div>
        </button>
      </div>
    </>
  )
}
