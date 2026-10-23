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
                Загружаем чат Юки…
                <button
                  type="button"
                  className={cn('ml-4 min-h-11 min-w-11 rounded-md', focusRing)}
                  aria-label="Закрыть чат"
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
            'pointer-events-none fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-32px)] flex-col items-end gap-3 sm:bottom-6 sm:right-6',
            !pageVisible && 'assistant-paused',
            className,
          )}
        >
          {isVisible && !bubbleDismissed ? (
            <div
              data-testid="yuki-hint"
              className="pointer-events-auto relative w-60 rounded-xl border border-border bg-card p-4 text-foreground shadow-popover"
            >
              <p className="pr-7 text-sm leading-relaxed">
                Привет! Меня зовут <strong>Юки</strong> — я твой наставник по
                IELTS.
              </p>
              <button
                type="button"
                onClick={openChat}
                className={cn(
                  'mt-2 min-h-11 rounded-md text-sm font-semibold text-primary underline underline-offset-4',
                  focusRing,
                )}
              >
                Открыть чат
              </button>
              <button
                type="button"
                className={cn(
                  'absolute right-1 top-1 flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted',
                  focusRing,
                )}
                aria-label="Скрыть подсказку"
                onClick={dismissBubble}
              >
                <CloseCircle className="size-5" />
              </button>
            </div>
          ) : null}
          {isVisible ? (
            <div className="assistant-mascot pointer-events-auto relative">
              <button
                ref={triggerRef}
                type="button"
                onClick={openChat}
                aria-label="Открыть чат с Юки"
                data-testid="yuki-fox"
                className={cn(
                  'block size-20 rounded-xl sm:size-28 lg:size-[136px]',
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
                title="Скрыть питомца"
                aria-label="Скрыть питомца"
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
              aria-label="Открыть чат с Юки"
              title="Открыть чат с Юки (включить питомца можно в Настройках)"
              data-testid="yuki-compact"
              className={cn(
                'pointer-events-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-popover transition-colors hover:bg-primary-hover',
                focusRing,
              )}
            >
              <Messages1 className="size-6" variant="Bold" />
            </button>
          )}
        </div>
      ) : null}
    </>
  )
}
