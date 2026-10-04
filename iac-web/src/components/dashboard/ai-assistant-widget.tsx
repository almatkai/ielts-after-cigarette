import { CloseCircle, Messages1 } from 'iconsax-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'

import { FoxMascot } from './fox-mascot'
import { cn } from '@/lib/utils'
import { useMascotVisibility } from '@/features/assistant/mascot-store'

const AiAssistantChatWindow = lazy(() =>
  import('./ai-assistant').then((module) => ({
    default: module.AiAssistantChatWindow,
  })),
)

export function AiAssistantFloatingWidget({
  className,
}: {
  className?: string
}) {
  const foxSrc = `${import.meta.env.BASE_URL}thoughtful_arctic_fox.webp`
  const { isVisible, setVisible } = useMascotVisibility()
  const [bubbleDismissed, setBubbleDismissed] = useState(false)
  const [chatIsOpen, setChatOpen] = useState(false)
  const [chatWasOpened, setChatWasOpened] = useState(false)
  const setChatIsOpen = (open: boolean) => {
    if (open) setChatWasOpened(true)
    setChatOpen(open)
  }
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const mascotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number | null = null
    const PROXIMITY_RADIUS = 520 // px proximity threshold on screen
    const MAX_SVG_OFFSET = 14 // SVG coordinate displacement

    const handleMouseMove = (e: MouseEvent) => {
      if (chatIsOpen || !isVisible) return
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
          setEyeOffset((prev) =>
            prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 },
          )
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
  }, [chatIsOpen, isVisible])

  return (
    <>
      {/* 1. In-page Floating Chat Messenger at bottom-right (in place of Yuki) */}
      {chatWasOpened ? (
        <Suspense
          fallback={
            chatIsOpen ? (
              <div
                className="fixed bottom-4 right-4 z-50 rounded-2xl border bg-white p-5 shadow-xl"
                role="status"
              >
                Загружаем чат Юки…
                <button
                  type="button"
                  className="ml-4"
                  aria-label="Закрыть чат"
                  onClick={() => setChatIsOpen(false)}
                >
                  <CloseCircle />
                </button>
              </div>
            ) : null
          }
        >
          <AiAssistantChatWindow
            isOpen={chatIsOpen}
            onClose={() => setChatIsOpen(false)}
          />
        </Suspense>
      ) : null}

      {/* 2. Floating Mascot & Comic Speech Bubble (shown when isVisible is true, smoothly hidden when chat is open) */}
      {isVisible ? (
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
                Привет! Меня зовут <strong>Юки</strong> — я твой наставник по
                IELTS.
              </p>

              <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] font-semibold text-[#2563eb]">
                <span>Открыть чат</span>
                <span className="text-xs transition-transform duration-200 group-hover/bubble:translate-x-1">
                  →
                </span>
              </div>
            </div>
          ) : null}

          {/* Large Animated Fox Mascot with Hide Button */}
          <div className="relative group/mascot">
            {/* Hide Pet Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setVisible(false)
              }}
              className="absolute top-0 right-1 sm:top-1 sm:right-2 z-20 flex size-6 sm:size-7 items-center justify-center rounded-full bg-white/95 text-slate-400 hover:text-slate-700 shadow-md border border-slate-200/90 backdrop-blur-xs transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer opacity-75 sm:opacity-0 sm:group-hover/mascot:opacity-100 focus:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Скрыть питомца"
              aria-label="Скрыть питомца"
            >
              <CloseCircle className="size-4" variant="Outline" />
            </button>

            <button
              type="button"
              onClick={() => setChatIsOpen(true)}
              className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl block"
              aria-label="Открыть чат с Юки"
            >
              <div ref={mascotRef} className="relative animate-fox-float">
                <FoxMascot
                  eyeOffset={eyeOffset}
                  className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36"
                />
              </div>
            </button>
          </div>
        </div>
      ) : (
        /* 3. Compact Floating Chat Button (shown when pet mascot is hidden) */
        <div
          className={cn(
            'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 origin-bottom-right transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)',
            chatIsOpen
              ? 'opacity-0 scale-75 translate-y-6 pointer-events-none'
              : 'opacity-100 scale-100 translate-y-0 pointer-events-auto',
            className,
          )}
        >
          <button
            type="button"
            onClick={() => setChatIsOpen(true)}
            className="group relative flex size-12 sm:size-13 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Открыть чат с Юки (включить питомца можно в Настройках)"
            aria-label="Открыть чат с Юки"
          >
            <Messages1
              className="size-6 transition-transform group-hover:scale-110"
              variant="Bold"
            />
            <span className="absolute -top-1 -right-1 flex size-5.5 items-center justify-center rounded-full bg-white shadow-xs border border-blue-100 overflow-hidden">
              <img
                src={foxSrc}
                alt="Юки"
                className="size-full object-contain p-0.5"
              />
            </span>
          </button>
        </div>
      )}
    </>
  )
}
