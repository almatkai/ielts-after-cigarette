import { CloseCircle, Messages1 } from 'iconsax-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { FoxMascot } from './fox-mascot'
import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useMascotVisibility } from '@/features/assistant/mascot-store'

const AiAssistantChatWindow = lazy(() =>
  import('./ai-assistant').then((module) => ({
    default: module.AiAssistantChatWindow,
  })),
)
const HINT_SESSION_KEY = 'iac_yuki_hint_dismissed'
const focusRing =
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card'

export function AiAssistantFloatingWidget({
  className,
  hidden = false,
}: {
  className?: string
  hidden?: boolean
}) {
  const { t } = useLanguage()
  const { isVisible, setVisible } = useMascotVisibility()
  const [bubbleDismissed, setBubbleDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(HINT_SESSION_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [chatIsOpen, setChatIsOpen] = useState(false)
  const [chatWasOpened, setChatWasOpened] = useState(false)
  const [motionAllowed, setMotionAllowed] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)

  // On phones the introduction is offered only on the first visit this session.
  // Dismissing it on any device also survives route changes and reloads.
  useEffect(() => {
    if (
      isVisible &&
      !bubbleDismissed &&
      window.matchMedia('(max-width: 639px)').matches
    ) {
      try {
        sessionStorage.setItem(HINT_SESSION_KEY, 'true')
      } catch {
        /* Storage may be unavailable. */
      }
    }
  }, [isVisible, bubbleDismissed])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)')
    const updateMotion = () => setMotionAllowed(motion.matches)
    const updateVisibility = () => setPageVisible(!document.hidden)
    updateMotion()
    updateVisibility()
    motion.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      motion.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    if (!chatIsOpen && restoreFocus.current && !hidden) {
      triggerRef.current?.focus()
      restoreFocus.current = false
    }
  }, [chatIsOpen, isVisible, hidden, bubbleDismissed])

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)')
    let rafId: number | null = null
    const resetEyes = () => setEyeOffset({ x: 0, y: 0 })
    const handleMouseMove = (event: MouseEvent) => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const rect = triggerRef.current?.getBoundingClientRect()
        if (!rect) return
        const dx = event.clientX - (rect.left + rect.width * 0.43)
        const dy = event.clientY - (rect.top + rect.height * 0.38)
        const dist = Math.hypot(dx, dy)
        if (dist < 520 && dist > 3) {
          const strength =
            0.35 + 0.65 * Math.min(1, Math.max(0, 1 - dist / 520))
          const angle = Math.atan2(dy, dx)
          setEyeOffset({
            x: Math.round(Math.cos(angle) * 14 * strength * 10) / 10,
            y: Math.round(Math.sin(angle) * 14 * strength * 10) / 10,
          })
        } else resetEyes()
      })
    }
    const detach = () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = null
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', resetEyes)
      resetEyes()
    }
    const updateTracking = () => {
      detach()
      if (
        motionAllowed &&
        fine.matches &&
        pageVisible &&
        isVisible &&
        !chatIsOpen &&
        !hidden
      ) {
        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        document.addEventListener('mouseleave', resetEyes)
      }
    }
    updateTracking()
    fine.addEventListener('change', updateTracking)
    return () => {
      detach()
      fine.removeEventListener('change', updateTracking)
    }
  }, [motionAllowed, pageVisible, isVisible, chatIsOpen, hidden])

  const openChat = () => {
    setChatWasOpened(true)
    setChatIsOpen(true)
  }
  const closeChat = () => {
    restoreFocus.current = true
    setChatIsOpen(false)
  }
  const dismissBubble = () => {
    restoreFocus.current = true
    setBubbleDismissed(true)
    try {
      sessionStorage.setItem(HINT_SESSION_KEY, 'true')
    } catch {
      /* Storage may be unavailable. */
    }
  }

  return (
    <>
      {chatWasOpened ? (
        <Suspense
          fallback={
            chatIsOpen && !hidden ? (
              <div
                className="fixed bottom-4 right-4 z-40 rounded-xl border border-border bg-card p-5 shadow-popover"
                role="status"
              >
                {t('Загружаем чат Юки…')}
                <button
                  type="button"
                  className={cn('ml-4 min-h-11 min-w-11 rounded-md', focusRing)}
                  aria-label={t('Закрыть чат')}
                  onClick={closeChat}
                >
                  <CloseCircle />
                </button>
              </div>
            ) : null
          }
        >
          <AiAssistantChatWindow
            isOpen={chatIsOpen && !hidden}
            onClose={closeChat}
          />
        </Suspense>
      ) : null}
      {!chatIsOpen && !hidden ? (
        <div
          data-testid="yuki-widget"
          className={cn(
            'pointer-events-none fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-32px)] flex-col items-end sm:bottom-6 sm:right-6',
            !pageVisible && 'assistant-paused',
            className,
          )}
        >
          {isVisible && !bubbleDismissed ? (
            <div
              data-testid="yuki-hint"
              role="button"
              tabIndex={0}
              onClick={() => openChat()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openChat()
                }
              }}
              className="group/bubble pointer-events-auto relative mb-2 cursor-pointer max-w-[240px] sm:max-w-[280px] rounded-[16px] bg-white/95 p-3.5 shadow-[0_12px_32px_rgba(29,39,61,0.16)] border border-blue-100/90 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-300 hover:shadow-[0_16px_40px_rgba(37,99,235,0.22)] animate-speech-bubble outline-none after:absolute after:-bottom-2.5 after:right-8 sm:after:right-12 after:size-0 after:border-x-8 after:border-x-transparent after:border-t-10 after:border-t-white after:filter after:drop-shadow-[0_2px_1px_rgba(29,39,61,0.06)]"
              aria-label={t('Открыть чат с Юки')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-blue-50 px-1.5 py-0.2 text-[9px] font-bold text-[#2563eb]">
                    IELTS AI
                  </span>
                </div>
                <span aria-hidden="true" className="size-5" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    dismissBubble()
                  }}
                  className={cn(
                    'absolute -right-0.5 -top-0.5 flex size-11 items-center justify-center text-[#94a3b8] hover:text-[#0f172a] rounded-full hover:bg-slate-100 transition-colors cursor-pointer',
                    focusRing,
                  )}
                  title={t('Скрыть подсказку')}
                  aria-label={t('Скрыть подсказку')}
                >
                  <CloseCircle className="size-4" variant="Outline" />
                </button>
              </div>

              <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-[#334155]">
                {t('Привет! Меня зовут')} <strong>{t('Юки')}</strong>{' '}
                {t('— я твой наставник по IELTS.')}
              </p>

              <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] font-semibold text-[#2563eb]">
                <span>{t('Открыть чат')}</span>
                <span className="text-xs transition-transform duration-200 group-hover/bubble:translate-x-1">
                  →
                </span>
              </div>
            </div>
          ) : null}
          {isVisible ? (
            <div className="assistant-mascot pointer-events-auto relative">
              <button
                ref={triggerRef}
                type="button"
                onClick={openChat}
                aria-label={t('Открыть чат с Юки')}
                data-testid="yuki-fox"
                className={cn(
                  'block size-24 rounded-2xl sm:size-32 lg:size-36',
                  focusRing,
                )}
              >
                <FoxMascot
                  animated={motionAllowed}
                  eyeOffset={eyeOffset}
                  className="size-full"
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  restoreFocus.current = true
                  setVisible(false)
                }}
                className={cn(
                  'assistant-hide absolute -right-1 -top-1 flex size-11 items-center justify-center rounded-full transition-opacity',
                  focusRing,
                )}
                title={t('Скрыть питомца')}
                aria-label={t('Скрыть питомца')}
              >
                <span className="flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                  <CloseCircle className="size-4" />
                </span>
              </button>
            </div>
          ) : (
            <button
              ref={triggerRef}
              type="button"
              onClick={openChat}
              aria-label={t('Открыть чат с Юки')}
              title={t(
                'Открыть чат с Юки (включить питомца можно в Настройках)',
              )}
              data-testid="yuki-compact"
              className={cn(
                'pointer-events-auto group relative flex size-12 sm:size-13 items-center justify-center rounded-full bg-gradient-to-tr from-[#3C82F6] to-[#3C82F6] text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer',
                focusRing,
              )}
            >
              <Messages1
                className="size-6 transition-transform group-hover:scale-110"
                variant="Bold"
              />
              <span className="absolute -top-1 -right-1 flex size-5.5 items-center justify-center rounded-full bg-white shadow-xs border border-blue-100 overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}thoughtful_arctic_fox.webp`}
                  alt=""
                  aria-hidden="true"
                  className="size-full object-contain p-0.5"
                />
              </span>
            </button>
          )}
        </div>
      ) : null}
    </>
  )
}
