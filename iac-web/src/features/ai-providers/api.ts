import { apiClient } from '@/lib/api/client'

export type AIScope = 'assistant' | 'writing' | 'speaking'
export type AIProvider = {
  id: string
  name: string
  endpoint: string
  model: string
  speakingModel: string
  scopes: AIScope[]
  enabled: boolean
  priority: number
  timeoutSeconds: number
  hasKey: boolean
  fromEnv?: boolean
  revision: number
  updatedAt: string
}
export type AIProviderInput = Omit<
  AIProvider,
  'id' | 'hasKey' | 'updatedAt' | 'fromEnv'
> & { apiKey: string }
export type AIProviderList = {
  items: AIProvider[]
  encryptionConfigured: boolean
  envFallbackConfigured: boolean
  errorReportingConfigured: boolean
  errorReportingRequired?: boolean
  maxProviders: number
  migrationRequired?: boolean
}
export type ProviderTestResult = {
  ok: boolean
  model: string
  latencyMs: number
  code?: string
  httpStatus?: number
}
export type AIRouting = {
  mode: 'sequential' | 'hedged'
  maxParallel: number
  hedgeDelayMs: number
  providerIds: string[]
  revision: number
}
export type AIRoutingResponse = {
  routing: AIRouting
  migrationRequired: boolean
}
export type AIModelStats = {
  providerId: string
  providerName: string
  model: string
  purpose: string
  calls: number
  successes: number
  failures: number
  timeouts: number
  cancelled: number
  wins: number
  p50Ms: number | null
  p95Ms: number | null
  firstTokenMs: number | null
  firstResponseMs: number | null
}
export type AICallMetric = {
  id: string
  runId: string
  providerId: string
  providerName: string
  model: string
  purpose: string
  startedAt: string
  durationMs: number
  firstTokenMs: number | null
  outcome: string
  won: boolean
  trigger: string
  mode: string
  code: string
  httpStatus: number
  requestId: string
}
export type AIStats = {
  migrationRequired: boolean
  models: AIModelStats[]
  recent: AICallMetric[]
}
const path = '/api/v1/admin/ai-providers'
export const reorderAIProviders = (items: AIProvider[]) =>
  apiClient.request<AIProviderList>(`${path}/order`, {
    method: 'POST',
    body: { items: items.map(({ id, revision }) => ({ id, revision })) },
  })
export const getAIRouting = () =>
  apiClient.request<AIRoutingResponse>(`${path}/routing`)
export const saveAIRouting = (routing: AIRouting) =>
  apiClient.request<AIRoutingResponse>(`${path}/routing`, {
    method: 'PUT',
    body: routing,
  })
export const getAIStats = (days: number) =>
  apiClient.request<AIStats>(`${path}/stats?days=${days}`)
export const listAIProviders = () => apiClient.request<AIProviderList>(path)
export const saveAIProvider = (id: string | null, input: AIProviderInput) =>
  apiClient.request<AIProvider>(id ? `${path}/${id}` : path, {
    method: id ? 'PUT' : 'POST',
    body: input,
  })
export const deleteAIProvider = (provider: AIProvider) =>
  apiClient.request<void>(
    `${path}/${provider.id}?revision=${provider.revision}`,
    { method: 'DELETE' },
  )
export const testAIProvider = (id: string | null, input?: AIProviderInput) =>
  apiClient.request<ProviderTestResult>(
    id ? `${path}/${id}/test` : `${path}/test`,
    { method: 'POST', body: input },
  )
