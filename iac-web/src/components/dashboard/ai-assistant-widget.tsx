import { CloseCircle, Messages1 } from 'iconsax-react'
import { lazy, Suspense, useState } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'
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
  const { t } = useLanguage()
  // Preserve the visibility preference and its existing storage key.
  const { isVisible, setVisible } = useMascotVisibility()
  const [bubbleDismissed, setBubbleDismissed] = useState(false)
  const [chatIsOpen, setChatIsOpen] = useState(false)
  const [chatWasOpened, setChatWasOpened] = useState(false)
  const openChat = () => {
    setChatWasOpened(true)
    setChatIsOpen(true)
  }
  return (
    <>
      {chatWasOpened ? (
        <Suspense
          fallback={
            chatIsOpen ? (
              <div
                className="fixed bottom-4 right-4 z-50 rounded-xl border border-border bg-card p-5 shadow-popover"
                role="status"
              >
                {t('Загружаем чат Юки…')}
                <button
                  type="button"
                  className="ml-4 min-h-11 min-w-11"
                  aria-label={t('Закрыть чат')}
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
      {!chatIsOpen ? (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-32px)] flex-col items-end gap-3 sm:bottom-6 sm:right-6',
            className,
          )}
        >
          {isVisible && !bubbleDismissed ? (
            <div className="w-60 rounded-xl border border-border bg-card p-4 text-foreground shadow-popover">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed">
                  {t('Привет! Меня зовут')} <strong>{t('Юки')}</strong>{' '}
                  {t('— я твой наставник по IELTS.')}
                </p>
                <button
                  type="button"
                  className="-mr-2 -mt-2 flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                  aria-label={t('Скрыть подсказку')}
                  onClick={() => {
                    setBubbleDismissed(true)
                    setVisible(false)
                  }}
                >
                  <CloseCircle className="size-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={openChat}
                className="mt-2 min-h-11 rounded-md text-sm font-semibold text-primary underline underline-offset-4"
              >
                {t('Открыть чат')}
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={openChat}
            aria-label={t('Открыть чат с Юки')}
            className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-popover transition-colors hover:bg-primary-hover"
          >
            <Messages1 className="size-6" variant="Bold" />
          </button>
        </div>
      ) : null}
    </>
  )
}
