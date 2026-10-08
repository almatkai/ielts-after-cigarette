import { useEffect, useRef, useState } from 'react'

type TurnstileAPI = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string
      action: string
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI
  }
}

const scriptId = 'guest-turnstile-script'

export function Turnstile({
  siteKey,
  onToken,
}: {
  siteKey: string
  onToken: (token: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let disposed = false
    let widgetId: string | undefined
    const render = () => {
      if (disposed || widgetId || !container.current || !window.turnstile)
        return
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        action: 'guest_mock',
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => {
          onToken('')
          setFailed(true)
        },
      })
    }
    let script = document.getElementById(scriptId)
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.setAttribute(
        'src',
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
      )
      script.setAttribute('async', '')
      document.head.appendChild(script)
    }
    const error = () => setFailed(true)
    script.addEventListener('load', render)
    script.addEventListener('error', error)
    if (window.turnstile) render()
    return () => {
      disposed = true
      script.removeEventListener('load', render)
      script.removeEventListener('error', error)
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [siteKey, onToken])

  return (
    <div>
      <div ref={container} />
      {failed ? (
        <p role="alert" className="text-sm text-red-600">
          Не удалось загрузить проверку безопасности. Обновите страницу.
        </p>
      ) : null}
    </div>
  )
}
