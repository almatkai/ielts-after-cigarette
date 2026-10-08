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
