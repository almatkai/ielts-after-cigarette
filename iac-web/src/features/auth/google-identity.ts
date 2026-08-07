// Public OAuth client ID — identifies the app to Google, safe to ship in
// client-side code. The client secret must never be shipped.
export const GOOGLE_CLIENT_ID =
  '525971866611-vk1derapc3opreb82i2ba2edeldsev8l.apps.googleusercontent.com'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>,
          ) => void
        }
      }
    }
  }
}

let googleScriptPromise: Promise<void> | null = null

// loadGoogleIdentityScript injects the GSI client once per page. It rejects
// when the script is blocked (e.g. by an ad blocker) — callers should treat
// that as "Google sign-in unavailable" and keep the password fallback.
export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google) return Promise.resolve()
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        googleScriptPromise = null
        reject(new Error('Google Identity script failed to load'))
      }
      document.head.appendChild(script)
    })
  }
  return googleScriptPromise
}
