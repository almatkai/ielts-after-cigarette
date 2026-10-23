import {
  ArrowLeft2,
  Maximize4,
  ArrowRight2,
  CloseCircle,
  Refresh,
  Send2,
} from 'iconsax-react'
import { useEffect, useRef, useState } from 'react'

import { MarkdownContent } from './markdown-content'

import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'
import { getErrorMessage } from '@/lib/api/client'
import { streamAssistantChat } from '@/features/assistant/stream'
import type { ChatMessageDto } from '@/features/assistant/api'
import { extractPageAsReadme } from '@/features/assistant/page-reader'

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
  isError?: boolean
  isPending?: boolean
}

const STORAGE_KEY = 'iac_yuki_chat_messages_v1'

function getInitialMessages(t: (source: string) => string): Message[] {
  return [
    {
      id: 'welcome',
      sender: 'fox',
      text: t(
        'Привет! Меня зовут Юки 🦊 — я твой наставник по IELTS. Могу подсказать структуру эссе, разобрать критерии Band Descriptors, объяснить логику вопросов в Reading и дать советы по таймингу. Что тебя интересует?',
      ),
      time: t('сейчас'),
    },
  ]
}

type AiAssistantChatWindowProps = {
  isOpen: boolean
  onClose: () => void
}

export function AiAssistantChatWindow({
  isOpen,
  onClose,
}: AiAssistantChatWindowProps) {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
      } catch {
        // Fallback to initial
      }
    }
    return getInitialMessages(t)
  })

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  useEffect(() => () => requestRef.current?.abort(), [])
  const inputRef = useRef<HTMLInputElement>(null)

  // Resizable state from top-left corner
  const [size, setSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('iac_yuki_chat_size')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (
            typeof parsed.width === 'number' &&
            typeof parsed.height === 'number'
          ) {
            return {
              width: Math.min(
                Math.max(parsed.width, 350),
                window.innerWidth - 32,
              ),
              height: Math.min(
                Math.max(parsed.height, 460),
                window.innerHeight - 40,
              ),
            }
          }
        }
      } catch {
        // ignore
      }
    }
    return { width: 440, height: 600 }
  })

  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef<{
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    direction: 'top-left' | 'top' | 'left'
  }>({
    startX: 0,
    startY: 0,
    startWidth: 440,
    startHeight: 600,
    direction: 'top-left',
  })

  const handleResizeStart = (
    e: React.PointerEvent,
    direction: 'top-left' | 'top' | 'left',
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
      direction,
    }
  }

  useEffect(() => {
    if (!isResizing) return

    const handlePointerMove = (e: PointerEvent) => {
      const { startX, startY, startWidth, startHeight, direction } =
        resizeStartRef.current

      const minWidth = Math.min(340, window.innerWidth - 32)
      const maxWidth = Math.min(960, window.innerWidth - 32)
      const minHeight = 440
      const maxHeight = window.innerHeight - 36

      let newWidth = startWidth
      let newHeight = startHeight

      if (direction === 'top-left' || direction === 'left') {
        const deltaX = startX - e.clientX
        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX))
      }

      if (direction === 'top-left' || direction === 'top') {
        const deltaY = startY - e.clientY
        newHeight = Math.max(
          minHeight,
          Math.min(maxHeight, startHeight + deltaY),
        )
      }

      setSize({ width: newWidth, height: newHeight })
    }

    const handlePointerUp = () => {
      setIsResizing(false)
      try {
        localStorage.setItem('iac_yuki_chat_size', JSON.stringify(size))
      } catch {
        // ignore
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [isResizing, size])

  const toggleExpand = () => {
    setSize((prev) => {
      const isExpanded = prev.width > 550
      const newSize = isExpanded
        ? { width: 440, height: 600 }
        : {
            width: Math.min(760, window.innerWidth - 32),
            height: Math.min(720, window.innerHeight - 40),
          }
      try {
        localStorage.setItem('iac_yuki_chat_size', JSON.stringify(newSize))
      } catch {
        // ignore
      }
      return newSize
    })
  }

  // Save messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.filter((message) => !message.isPending)),
      )
    } catch {
      // Ignore sessionStorage errors
    }
  }, [messages])

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
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
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

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim()
    if (!text || isTyping || requestRef.current) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    const nextMessages = [...messages, userMsg]
    const controller = new AbortController()
    requestRef.current = controller
    const botMsg: Message = {
      id: `${userMsg.id}-reply`,
      isPending: true,
      sender: 'fox',
      text: '',
      time: userMsg.time,
    }
    setMessages([...nextMessages, botMsg])
    setInput('')
    setIsTyping(true)

    try {
      // Extract current page in clean README format for model's read_page_content tool
      const pageReadme = extractPageAsReadme()

      const historyForApi: ChatMessageDto[] = nextMessages
        .filter(
          (m) =>
            !m.isError && !m.isPending && m.id !== 'welcome' && m.text.trim(),
        )
        .slice(-20)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }))

      const response = await streamAssistantChat(
        {
          messages: historyForApi,
          pageContext: {
            url: pageReadme.url,
            title: pageReadme.title,
            content: pageReadme.markdown,
          },
        },
        (event) => {
          if (controller.signal.aborted) return
          setMessages((prev) =>
            prev.map((message) =>
              message.id === botMsg.id
                ? {
                    ...message,
                    text:
                      event.type === 'reset' ? '' : message.text + event.text,
                  }
                : message,
            ),
          )
        },
        controller.signal,
      )
      if (!controller.signal.aborted) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === botMsg.id
              ? { ...message, text: response.message.content, isPending: false }
              : message,
          ),
        )
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === botMsg.id
              ? {
                  ...message,
                  text:
                    getErrorMessage(err) ||
                    t(
                      'Соединение с чатом прервалось. Проверь подключение и попробуй ещё раз.',
                    ),
                  isError: true,
                  isPending: false,
                }
              : message,
          ),
        )
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setIsTyping(false)
      }
    }
  }

  const handleReset = () => {
    requestRef.current?.abort()
    requestRef.current = null
    setIsTyping(false)
    setMessages(getInitialMessages(t))
    setInput('')
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }

  return (
    <div
      id="ai-assistant-widget"
      style={{
        width:
          typeof window !== 'undefined' && window.innerWidth < 640
            ? 'calc(100vw - 32px)'
            : `${size.width}px`,
        height: `${size.height}px`,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 36px)',
      }}
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden origin-bottom-right',
        'bottom-4 right-4 sm:bottom-6 sm:right-6',
        'rounded-xl bg-card  border border-border/90',
        'shadow-popover',
        isResizing
          ? 'transition-none select-none'
          : 'transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-90 translate-y-6 pointer-events-none',
      )}
    >
      {/* Top-Left Corner Resize Handle */}
      <div
        onPointerDown={(e) => handleResizeStart(e, 'top-left')}
        onDoubleClick={toggleExpand}
        className="absolute top-0 left-0 size-8 z-30 flex items-center justify-center cursor-nwse-resize group/corner select-none touch-none"
        title={t(
          'Потяните для изменения размера (дважды кликните для переключения)',
        )}
        aria-label={t('Изменить размер окна')}
      >
        <Maximize4 aria-hidden="true" className="size-3 text-icon" />
      </div>

      {/* Top Edge Resize Strip */}
      <div
        onPointerDown={(e) => handleResizeStart(e, 'top')}
        className="absolute top-0 left-8 right-4 h-2 z-20 cursor-ns-resize select-none touch-none hover:bg-primary/20 transition-colors"
        title={t('Потяните для изменения высоты')}
      />

      {/* Left Edge Resize Strip */}
      <div
        onPointerDown={(e) => handleResizeStart(e, 'left')}
        className="absolute top-8 left-0 bottom-4 w-2 z-20 cursor-ew-resize select-none touch-none hover:bg-primary/20 transition-colors"
        title={t('Потяните для изменения ширины')}
      />

      {/* Modern Messenger Header */}
      <div
        onDoubleClick={toggleExpand}
        title={t('Дважды кликните, чтобы увеличить или уменьшить окно')}
        className="flex items-center justify-between border-b border-border bg-card px-4 py-3 select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative size-10 shrink-0 rounded-full border-2 border-card bg-primary-soft shadow-none ring-1 ring-primary flex items-center justify-center">
            <span aria-hidden="true" className="font-semibold text-primary">
              Ю
            </span>
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-success ring-1 ring-success/40" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground tracking-tight">
                {t('Юки')}
              </span>
            </div>
            <p className="text-[11px] font-medium text-success flex items-center gap-1">
              {t('Онлайн наставник')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          {messages.length > 1 ? (
            <button
              type="button"
              onClick={handleReset}
              title={t('Очистить диалог')}
              className="p-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label={t('Очистить диалог')}
            >
              <Refresh className="size-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            title={t('Закрыть чат')}
            className="p-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label={t('Закрыть чат')}
          >
            <CloseCircle className="size-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-card text-foreground">
        {messages
          .filter((msg) => msg.text.trim())
          .map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex items-end gap-2',
                msg.sender === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {msg.sender === 'fox' ? (
                <div className="size-6 shrink-0 overflow-hidden rounded-full border border-border-strong bg-primary-soft/60 p-0.5 flex items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="font-semibold text-primary"
                  >
                    Ю
                  </span>
                </div>
              ) : null}

              <div
                className={cn(
                  'max-w-[85%] rounded-xl p-3 text-xs sm:text-[13px] leading-relaxed shadow-none',
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-xs'
                    : msg.isError
                      ? 'bg-destructive-soft border border-destructive-soft text-destructive rounded-bl-xs'
                      : 'bg-muted text-foreground rounded-bl-xs',
                )}
              >
                {/* Message body with Markdown support */}
                {msg.sender === 'fox' ? (
                  <MarkdownContent content={msg.text} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}

                <div
                  className={cn(
                    'mt-1 text-[9px] font-medium text-right select-none',
                    msg.sender === 'user'
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

        {isTyping ? (
          <div className="flex items-end gap-2">
            <div className="size-6 shrink-0 overflow-hidden rounded-full border border-border-strong bg-primary-soft/60 p-0.5 flex items-center justify-center">
              <span aria-hidden="true" className="font-semibold text-primary">
                Ю
              </span>
            </div>
            <div className="rounded-xl rounded-bl-xs bg-card border border-border/80 px-3.5 py-2.5 shadow-none flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 rounded-full bg-primary animate-bounce" />
              <span className="text-[11px] text-muted-foreground ml-1.5 font-medium">
                {t('Юки думает...')}
              </span>
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel Bar */}
      <div className="relative border-t border-border/90 bg-card px-2 py-2 select-none group/carousel">
        {/* Left Scroll Arrow */}
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollPrompts('left')}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full bg-card shadow-none border border-border/90 flex items-center justify-center text-muted-foreground hover:text-primary  active:scale-95 transition-all cursor-pointer"
            aria-label={t('Прокрутить темы влево')}
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
                handleSend(t(prompt))
              }}
              className="rounded-sm border border-border/90 bg-card hover:border-border-strong hover:bg-primary-soft/80 hover:text-primary text-[11px] font-medium text-muted-foreground px-2.5 py-1 transition-all whitespace-nowrap cursor-pointer shadow-none shrink-0 select-none active:scale-95"
            >
              {t(prompt)}
            </button>
          ))}
        </div>

        {/* Right Scroll Arrow */}
        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scrollPrompts('right')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full bg-card shadow-none border border-border/90 flex items-center justify-center text-muted-foreground hover:text-primary  active:scale-95 transition-all cursor-pointer"
            aria-label={t('Прокрутить темы вправо')}
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
        className="p-3 border-t border-border bg-card  flex items-center gap-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('Спроси Юки о подготовке к IELTS...')}
          className="flex-1 bg-card border border-border/90 rounded-xl px-3.5 py-2 text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className={cn(
            'size-9 rounded-xl flex items-center justify-center transition-all shrink-0',
            input.trim() && !isTyping
              ? 'bg-primary text-primary-foreground shadow-none shadow-primary/25 hover:bg-primary-hover  active:scale-95 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
          aria-label={t('Отправить')}
        >
          <Send2 className="size-4" />
        </button>
      </form>
    </div>
  )
}
