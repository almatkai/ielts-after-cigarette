const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')

export type ApiErrorBody = {
  code?: string
  message?: string
  details?: Record<string, string>
  requestId?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Record<string, string>
  readonly requestId?: string

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || 'Не удалось выполнить запрос')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code || 'UNKNOWN_ERROR'
    this.details = body.details
    this.requestId = body.requestId
  }
}

type AuthBridge = {
  getAccessToken: () => string | null
  refreshAccessToken: () => Promise<string | null>
  onAuthenticationFailed: () => void
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  authenticated?: boolean
  retryAuthentication?: boolean
}

class ApiClient {
  private auth: AuthBridge | null = null
  private refreshPromise: Promise<string | null> | null = null

  configureAuth(auth: AuthBridge) {
    this.auth = auth
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    if (!apiBaseUrl) {
      throw new ApiError(0, {
        code: 'API_URL_MISSING',
        message: 'Адрес API не настроен',
      })
    }

    const {
      body,
      authenticated = true,
      retryAuthentication = true,
      headers: initialHeaders,
      ...requestInit
    } = options
    const headers = new Headers(initialHeaders)
    if (body !== undefined) {
      headers.set('Content-Type', 'application/json')
    }
    if (authenticated) {
      const accessToken = this.auth?.getAccessToken()
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`)
      }
    }

    let response: Response
    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        ...requestInit,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'include',
      })
    } catch {
      throw new ApiError(0, {
        code: 'NETWORK_ERROR',
        message: 'Не удалось связаться с сервером',
      })
    }

    if (
      response.status === 401 &&
      authenticated &&
      retryAuthentication &&
      this.auth
    ) {
      const refreshedToken = await this.refreshOnce()
      if (refreshedToken) {
        return this.request<T>(path, {
          ...options,
          retryAuthentication: false,
        })
      }
      this.auth.onAuthenticationFailed()
    }

    if (!response.ok) {
      throw await parseApiError(response)
    }
    if (response.status === 204) {
      return undefined as T
    }
    return (await response.json()) as T
  }

  private refreshOnce() {
    if (!this.auth) return Promise.resolve(null)
    if (!this.refreshPromise) {
      this.refreshPromise = this.auth.refreshAccessToken().finally(() => {
        this.refreshPromise = null
      })
    }
    return this.refreshPromise
  }
}

async function parseApiError(response: Response) {
  let body: ApiErrorBody = {}
  try {
    body = (await response.json()) as ApiErrorBody
  } catch {
    body = {}
  }
  return new ApiError(response.status, body)
}

export function getErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return 'Произошла непредвиденная ошибка. Попробуйте ещё раз.'
  }
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Неверная электронная почта или пароль.'
    case 'EMAIL_ALREADY_EXISTS':
      return 'Аккаунт с такой электронной почтой уже существует.'
    case 'RATE_LIMITED':
      return 'Слишком много попыток. Подождите минуту и попробуйте снова.'
    case 'NETWORK_ERROR':
      return 'Сервер недоступен. Проверьте, что backend запущен.'
    case 'API_URL_MISSING':
      return 'Не настроен VITE_API_BASE_URL.'
    case 'DEPENDENCY_UNAVAILABLE':
      return 'Сервис временно недоступен. Попробуйте немного позже.'
    default:
      return error.status >= 500
        ? 'Сервер не смог обработать запрос. Попробуйте позже.'
        : error.message
  }
}

export const apiClient = new ApiClient()
