import { apiClient } from '@/lib/api/client'
import type { FullMockSession } from '@/features/fullmock/api'

export type GuestSession = {
  id: string
  expiresAt: string
  sessionId: string | null
}

export const getGuestSession = () =>
  apiClient.request<GuestSession>('/api/v1/guest/session', {
    authenticated: false,
    retryAuthentication: false,
  })

export const getGuestConfig = (signal?: AbortSignal) =>
  apiClient.request<{
    enabled: boolean
    siteKey: string
    examTypes?: Array<'academic' | 'general'>
  }>('/api/v1/guest/config', { authenticated: false, signal })

export const startGuestMock = (
  examType: 'academic' | 'general',
  turnstileToken: string,
) =>
  apiClient.request<FullMockSession>('/api/v1/guest/start', {
    method: 'POST',
    authenticated: false,
    body: { examType, turnstileToken, acceptedTerms: true },
  })

export const claimGuestResults = (accessToken: string) =>
  apiClient.request<{ sessionId: string | null }>('/api/v1/guest/claim', {
    method: 'POST',
    authenticated: false,
    retryAuthentication: false,
    headers: { Authorization: `Bearer ${accessToken}` },
  })

// This is navigation policy. The backend independently restricts all guest APIs.
export function canGuestVisit(pathname: string) {
  return (
    /^\/exam\/full-mock-sessions\/[^/]+(?:\/sections\/[1-4])?$/.test(
      pathname,
    ) || /^\/(?:attempts|full-mock-sessions)\/[^/]+$/.test(pathname)
  )
}

export function canBrowseWithoutAccount(pathname: string) {
  return [
    '/',
    '/practice',
    '/full-mocks',
    '/listening',
    '/reading',
    '/writing',
    '/speaking',
  ].includes(pathname)
}
