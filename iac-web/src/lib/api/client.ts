import { ApiError } from './error.ts'
import type { ApiErrorBody } from './error.ts'

export { ApiError } from './error.ts'
export type { ApiErrorBody } from './error.ts'

// Native Node regression tests have no Vite environment. Keeping the direct
// import.meta.env reference lets Vite replace it correctly in production.
function resolveApiBaseUrl(env: ImportMetaEnv | undefined) {
  return env?.VITE_API_BASE_URL?.replace(/\/+$/, '')
}
const apiBaseUrl = resolveApiBaseUrl(import.meta.env)

type AuthBridge = {
  getAccessToken: () => string | null
  refreshAccessToken: () => Promise<string | null>
  onAuthenticationFailed: () => void
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  authenticated?: boolean
  retryAuthentication?: boolean
  responseBody?: 'json' | 'raw'
}

export class ApiClient {
  private readonly baseUrl: string | undefined

  constructor(baseUrl = apiBaseUrl) {
    this.baseUrl = baseUrl
  }
  private auth: AuthBridge | null = null
  private refreshPromise: Promise<string | null> | null = null

  configureAuth(auth: AuthBridge) {
    this.auth = auth
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    if (!this.baseUrl) {
      throw new ApiError(0, {
        code: 'API_URL_MISSING',
        message: 'Адрес API не настроен',
      })
    }

    const {
      body,
      authenticated = true,
      retryAuthentication = true,
      responseBody = 'json',
      headers: initialHeaders,
      ...requestInit
    } = options
    const headers = new Headers(initialHeaders)
    const isFormData =
      typeof FormData !== 'undefined' && body instanceof FormData
    if (body !== undefined && !isFormData) {
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
      response = await fetch(`${this.baseUrl}${path}`, {
        ...requestInit,
        headers,
        body:
          body === undefined
            ? undefined
            : isFormData
              ? body
              : JSON.stringify(body),
        credentials: 'include',
      })
    } catch (error) {
      // Cancellation is not an outage and should not trigger telemetry/retry UI.
      if (error instanceof Error && error.name === 'AbortError') throw error
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
    if (responseBody === 'raw') return response as T
    if (response.status === 204) {
      return undefined as T
    }
    return (await response.json()) as T
  }

  async stream(path: string, options: ApiRequestOptions): Promise<Response> {
    return this.request<Response>(path, { ...options, responseBody: 'raw' })
  }

  async upload<T>(path: string, form: FormData): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: form })
  }

  async blob(path: string): Promise<Blob> {
    const headers = new Headers()
    const accessToken = this.auth?.getAccessToken()
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers,
      credentials: 'include',
    })
    if (!response.ok) throw await parseApiError(response)
    return response.blob()
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
  return new ApiError(response.status, {
    ...body,
    requestId:
      body.requestId || response.headers.get('X-Request-ID') || undefined,
  })
}

export function getErrorMessage(error: unknown, language?: 'ru' | 'kk' | 'en') {
  const lang = language ?? storedLanguage()
  const message = getErrorMessageRu(error)
  if (lang === 'ru') return message
  return errorTranslations[message]?.[lang] ?? message
}

function storedLanguage(): 'ru' | 'kk' | 'en' {
  if (typeof window === 'undefined') return 'ru'
  const stored = window.localStorage.getItem('daiyndyq-language')
  return stored === 'kk' || stored === 'en' ? stored : 'ru'
}

const errorTranslations: Record<string, { kk: string; en: string }> = {
  'Адрес API не настроен': {
    kk: 'API мекенжайы көрсетілмеген',
    en: 'API address is not configured',
  },
  'Не удалось связаться с сервером': {
    kk: 'Серверге қосылу мүмкін болмады',
    en: 'Could not reach the server',
  },
  'Произошла непредвиденная ошибка. Попробуйте ещё раз.': {
    kk: 'Күтпеген қате пайда болды. Қайталап көріңіз.',
    en: 'An unexpected error occurred. Please try again.',
  },
  'Неверная электронная почта или пароль.': {
    kk: 'Электрондық пошта немесе құпиясөз қате.',
    en: 'Incorrect email or password.',
  },
  'Не удалось подтвердить Google-аккаунт. Попробуйте снова.': {
    kk: 'Google аккаунтын растау мүмкін болмады. Қайталап көріңіз.',
    en: 'Could not verify your Google account. Please try again.',
  },
  'Аккаунт не найден. Проверьте данные и попробуйте снова.': {
    kk: 'Аккаунт табылмады. Деректерді тексеріп, қайталап көріңіз.',
    en: 'Account not found. Check your details and try again.',
  },
  'Аккаунт с такой электронной почтой уже существует.': {
    kk: 'Бұл электрондық поштаға тіркелген аккаунт бар.',
    en: 'An account with this email already exists.',
  },
  'Аккаунт с таким номером телефона уже существует.': {
    kk: 'Бұл телефон нөміріне тіркелген аккаунт бар.',
    en: 'An account with this phone number already exists.',
  },
  'Проверьте правильность заполнения полей.': {
    kk: 'Өрістердің дұрыс толтырылғанын тексеріңіз.',
    en: 'Check that all fields are filled in correctly.',
  },
  'Подтверждение номера истекло. Запросите новый код.': {
    kk: 'Нөмірді растау мерзімі аяқталды. Жаңа код сұратыңыз.',
    en: 'Phone verification expired. Request a new code.',
  },
  'Неверный или просроченный код WhatsApp.': {
    kk: 'WhatsApp коды қате немесе мерзімі өткен.',
    en: 'The WhatsApp code is invalid or expired.',
  },
  'Код уже отправлен. Подождите минуту перед повторной отправкой.': {
    kk: 'Код жіберілді. Қайта сұрамас бұрын бір минут күтіңіз.',
    en: 'A code was sent already. Wait a minute before requesting another.',
  },
  'Подтверждение через WhatsApp скоро будет доступно.': {
    kk: 'WhatsApp арқылы растау жақында қолжетімді болады.',
    en: 'WhatsApp verification will be available soon.',
  },
  'Слишком много попыток. Подождите минуту и попробуйте снова.': {
    kk: 'Әрекет саны тым көп. Бір минут күтіп, қайталап көріңіз.',
    en: 'Too many attempts. Wait a minute and try again.',
  },
  'Достигнут дневной лимит использования. Лимит обновится в полночь.': {
    kk: 'Күндік шектеуге жеттіңіз. Шектеу түн ортасында жаңартылады.',
    en: 'Daily limit reached. The limit resets at midnight.',
  },
  'Сервер недоступен. Проверьте, что backend запущен.': {
    kk: 'Сервер қолжетімсіз. Backend іске қосылғанын тексеріңіз.',
    en: 'Server unavailable. Check that the backend is running.',
  },
  'Не настроен VITE_API_BASE_URL.': {
    kk: 'VITE_API_BASE_URL көрсетілмеген.',
    en: 'VITE_API_BASE_URL is not configured.',
  },
  'Сервис временно недоступен. Попробуйте немного позже.': {
    kk: 'Қызмет уақытша қолжетімсіз. Сәлден соң қайталап көріңіз.',
    en: 'Service temporarily unavailable. Please try again later.',
  },
  'Хранилище файлов временно недоступно. Повторите загрузку немного позже.': {
    kk: 'Файл қоймасы уақытша қолжетімсіз. Жүктеуді сәлден соң қайталаңыз.',
    en: 'File storage is temporarily unavailable. Try uploading again later.',
  },
  'Черновик уже изменился. Обновите страницу и повторите действие.': {
    kk: 'Нобай өзгертілді. Бетті жаңартып, әрекетті қайталаңыз.',
    en: 'The draft has changed. Refresh the page and try again.',
  },
  'Заполните ответы для Task 1 и Task 2 перед отправкой.': {
    kk: 'Жібермес бұрын Task 1 және Task 2 тапсырмаларын толтырыңыз.',
    en: 'Complete both Task 1 and Task 2 before submitting.',
  },
  'Запишите или введите расшифровку для каждой из трёх частей Speaking.': {
    kk: 'Speaking бөлімінің үш бөлігі үшін аудио жазыңыз немесе мәтін енгізіңіз.',
    en: 'Record or enter a transcript for all three Speaking parts.',
  },
  'Запись слишком большая. Сократите её и попробуйте снова.': {
    kk: 'Жазба тым үлкен. Қысқартып, қайталап көріңіз.',
    en: 'The recording is too large. Shorten it and try again.',
  },
  'Автоматическая проверка пока не настроена. Обратитесь к администратору.': {
    kk: 'Автоматты тексеру әзірше реттелмеген. Әкімшіге хабарласыңыз.',
    en: 'Automatic assessment is not configured yet. Contact an administrator.',
  },
  'Сервис проверки временно недоступен. Черновики сохранены — попробуйте отправить работу ещё раз.':
    {
      kk: 'Тексеру қызметі уақытша қолжетімсіз. Нобайлар сақталды — жұмысты қайта жіберіп көріңіз.',
      en: 'The assessment service is temporarily unavailable. Drafts are saved — try submitting again.',
    },
  'Сервер не смог обработать запрос. Попробуйте позже.': {
    kk: 'Сервер сұрауды өңдей алмады. Кейінірек қайталап көріңіз.',
    en: 'The server could not process the request. Please try again later.',
  },
  'Не удалось выполнить запрос': {
    kk: 'Сұрауды орындау мүмкін болмады',
    en: 'The request could not be completed',
  },
}

function getErrorMessageRu(error: unknown) {
  if (!(error instanceof ApiError)) {
    return 'Произошла непредвиденная ошибка. Попробуйте ещё раз.'
  }
  const details = error.details
    ? Object.entries(error.details)
        .map(([field, message]) => `${field}: ${message}`)
        .join(' · ')
    : ''
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Неверная электронная почта или пароль.'
    case 'GOOGLE_TOKEN_INVALID':
      return 'Не удалось подтвердить Google-аккаунт. Попробуйте снова.'
    case 'ACCOUNT_NOT_FOUND':
      return 'Аккаунт не найден. Проверьте данные и попробуйте снова.'
    case 'EMAIL_ALREADY_EXISTS':
      return 'Аккаунт с такой электронной почтой уже существует.'
    case 'PHONE_ALREADY_EXISTS':
      return 'Аккаунт с таким номером телефона уже существует.'
    case 'VALIDATION_ERROR':
      return details
        ? `Проверьте поля: ${details}`
        : 'Проверьте правильность заполнения полей.'
    case 'PHONE_NOT_VERIFIED':
      return 'Подтверждение номера истекло. Запросите новый код.'
    case 'INVALID_VERIFICATION_CODE':
      return 'Неверный или просроченный код WhatsApp.'
    case 'VERIFICATION_RESEND_TOO_SOON':
      return 'Код уже отправлен. Подождите минуту перед повторной отправкой.'
    case 'WHATSAPP_NOT_CONFIGURED':
      return 'Подтверждение через WhatsApp скоро будет доступно.'
    case 'RATE_LIMITED':
      return 'Слишком много попыток. Подождите минуту и попробуйте снова.'
    case 'DAILY_LIMIT_EXCEEDED':
      return (
        error.message ||
        'Достигнут дневной лимит использования. Лимит обновится в полночь.'
      )
    case 'NETWORK_ERROR':
      return 'Сервер недоступен. Проверьте, что backend запущен.'
    case 'API_URL_MISSING':
      return 'Не настроен VITE_API_BASE_URL.'
    case 'DEPENDENCY_UNAVAILABLE':
      return 'Сервис временно недоступен. Попробуйте немного позже.'
    case 'OBJECT_STORAGE_UNAVAILABLE':
      return 'Хранилище файлов временно недоступно. Повторите загрузку немного позже.'
    case 'REVISION_CONFLICT':
      return 'Черновик уже изменился. Обновите страницу и повторите действие.'
    case 'WRITING_INCOMPLETE':
      return 'Заполните ответы для Task 1 и Task 2 перед отправкой.'
    case 'SPEAKING_INCOMPLETE':
      return 'Запишите или введите расшифровку для каждой из трёх частей Speaking.'
    case 'SPEAKING_RECORDING_TOO_LARGE':
    case 'MEDIA_TOO_LARGE':
      return 'Запись слишком большая. Сократите её и попробуйте снова.'
    case 'AI_NOT_CONFIGURED':
      return 'Автоматическая проверка пока не настроена. Обратитесь к администратору.'
    case 'AI_EVALUATION_FAILED':
      return 'Сервис проверки временно недоступен. Черновики сохранены — попробуйте отправить работу ещё раз.'
    default:
      return error.status >= 500
        ? 'Сервер не смог обработать запрос. Попробуйте позже.'
        : details || error.message
  }
}

export const apiClient = new ApiClient()
