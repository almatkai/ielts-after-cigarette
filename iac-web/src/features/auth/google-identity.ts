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
            ux_mode?: 'popup' | 'redirect'
            login_uri?: string
          }) => void
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>,
          ) => void
          prompt?: (momentListener?: (notification: unknown) => void) => void
        }
      }
    }
  }
}

let googleScriptPromise: Promise<void> | null = null

const returnPathKey = 'google-sign-in-return-path'

export function rememberGoogleReturnPath(path: '/admin' | '/' = '/') {
  try {
    sessionStorage.setItem(returnPathKey, path)
  } catch {
    // Sign-in still works when browser storage is disabled.
  }
}

export function getGoogleReturnPath(): '/admin' | '/' {
  try {
    const path = sessionStorage.getItem(returnPathKey)
    return path === '/admin' ? '/admin' : '/'
  } catch {
    return '/'
  }
}

export function consumeGoogleReturnPath(): '/admin' | '/' {
  const path = getGoogleReturnPath()
  try {
    sessionStorage.removeItem(returnPathKey)
  } catch {
    // Browser storage is optional.
  }
  return path
}

export function googleSignInOptions(
  callback: (response: { credential?: string }) => void,
) {
  return {
    client_id: GOOGLE_CLIENT_ID,
    callback,
    // Keep the sign-in and its return in one tab. Popup callbacks are lost in
    // iOS in-app browsers when the popup replaces the original webview.
    ux_mode: 'redirect' as const,
    login_uri: new URL('/api/v1/auth/google', window.location.origin).href,
  }
}

// loadGoogleIdentityScript injects the GSI client once per page. It rejects
// when the script is blocked (e.g. by an ad blocker) — callers should show
// an explicit error instead of silently leaving the user without sign-in.
export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google) return Promise.resolve()
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      const timeout = window.setTimeout(() => {
        script.remove()
        googleScriptPromise = null
        reject(new Error('Google Identity script timed out'))
      }, 15_000)
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => {
        window.clearTimeout(timeout)
        if (window.google?.accounts.id) {
          resolve()
        } else {
          googleScriptPromise = null
          script.remove()
          reject(new Error('Google Identity script did not initialize'))
        }
      }
      script.onerror = () => {
        window.clearTimeout(timeout)
        script.remove()
        googleScriptPromise = null
        reject(new Error('Google Identity script failed to load'))
      }
      document.head.appendChild(script)
    })
  }
  return googleScriptPromise
}
