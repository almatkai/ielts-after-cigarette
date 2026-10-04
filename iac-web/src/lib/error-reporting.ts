import { ApiError } from './api/error.ts'

export type ClientErrorEvent = {
  source:
    | 'query'
    | 'mutation'
    | 'route'
    | 'window'
    | 'unhandled-rejection'
    | 'autosave'
  name: string
  code?: string
  status?: number
  requestId?: string
}

type ErrorReporter = (event: ClientErrorEvent) => void | Promise<void>
let reporter: ErrorReporter | undefined
const seen = new WeakSet<object>()
let globalsInstalled = false

// Optional test/alternate sink. Integration seam: no SDK, HTTP endpoint,
// request bodies, answers, tokens, query keys or URL query strings are sent.
export function configureErrorReporter(next: ErrorReporter) {
  reporter = next
  return () => {
    if (reporter === next) reporter = undefined
  }
}

// Sentry loads lazily so the ~40 KB SDK stays out of the initial bundle and
// loads only when the first accepted report arrives. DSN presence is what
// enables it; no hard-coded endpoint and no sampling of performance traces.
const SENTRY_DSN: string | undefined = (
  'env' in import.meta ? import.meta.env.VITE_SENTRY_DSN : undefined
)
let sentryLoading: Promise<unknown> | null = null
function ensureSentry() {
  if (!SENTRY_DSN) return Promise.resolve()
  if (!sentryLoading) {
    sentryLoading = import('@sentry/react')
      .then((Sentry) => {
        Sentry.init({
          dsn: SENTRY_DSN,
          environment: import.meta.env.MODE,
          // Performance tracing stays off; errors only.
          sampleRate: 1,
          beforeSend(event) {
            // Breadcrumbs can include URLs with search params; drop them so
            // tokens and drafts never reach the tracker.
            event.breadcrumbs = undefined
            return event
          },
        })
      })
      .catch(() => {
        // A failed tracker must not break saving, routing or queries.
        sentryLoading = null
      })
  }
  return sentryLoading
}

export function reportError(
  error: unknown,
  source: ClientErrorEvent['source'],
) {
  if (typeof window === 'undefined') return
  if (error instanceof Error && error.name === 'AbortError') return
  if (error instanceof ApiError && error.status > 0 && error.status < 500)
    return
  if (typeof error === 'object' && error !== null) {
    if (seen.has(error)) return
    seen.add(error)
  }
  const event: ClientErrorEvent = {
    source,
    name: error instanceof Error ? error.name : 'UnknownError',
    ...(error instanceof ApiError
      ? { code: error.code, status: error.status, requestId: error.requestId }
      : {}),
  }
  // Send to the configured sink only if one is installed. Sentry loads lazily
  // and works even without a sink: DSN presence alone enables it.
  try {
    void ensureSentry().then(() =>
      import('@sentry/react')
        .then((Sentry) => {
          if (error instanceof Error) {
            Sentry.captureException(error, {
              tags: {
                source: event.source,
                ...(event.requestId ? { request_id: event.requestId } : {}),
              },
              extra: { code: event.code, status: event.status },
            })
          }
        })
        .catch(() => {}),
    )
    if (reporter) void Promise.resolve(reporter(event)).catch(() => {})
  } catch {
    // Do not report reporter failures recursively.
  }
}

export function installGlobalErrorReporting() {
  if (typeof window === 'undefined' || globalsInstalled) return
  globalsInstalled = true
  window.addEventListener('error', (event) => {
    // Ignore resource errors with no Error object (images/scripts/extensions).
    if (event.error) reportError(event.error, 'window')
  })
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, 'unhandled-rejection')
  })
}
