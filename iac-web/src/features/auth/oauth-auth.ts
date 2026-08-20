import { apiClient } from '@/lib/api/client'

import type { AuthResponse } from './auth-store'

export type OAuthProvider = 'google' | 'github' | 'yandex'

export const oauthProviderLabels: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  yandex: 'Яндекс',
}

export type PendingOAuthRegistration = {
  registrationToken: string
  provider: OAuthProvider
  profile: {
    email: string
    name: string
    phone?: string
  }
}

export type CompleteOAuthRegistrationInput = {
  registrationToken: string
  name: string
  phone: string
  password: string
  acceptedTerms: boolean
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')

export function buildOAuthStartUrl(provider: OAuthProvider, next?: string) {
  const base = `${apiBaseUrl}/api/v1/auth/${provider}/start`
  return next ? `${base}?next=${encodeURIComponent(next)}` : base
}

export function requestCompleteOAuthRegistration(
  input: CompleteOAuthRegistrationInput,
) {
  return apiClient.request<AuthResponse>('/api/v1/auth/oauth/complete', {
    method: 'POST',
    body: input,
    authenticated: false,
    retryAuthentication: false,
  })
}

// The registration token is a backend-issued JWT delivered via the callback
// redirect. We decode it here only to prefill the complete-form UI; the
// backend re-verifies the signature when the form is submitted.
export function parseOAuthRegistrationToken(
  token: string,
): PendingOAuthRegistration | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  const provider = payload.provider
  if (provider !== 'google' && provider !== 'github' && provider !== 'yandex')
    return null
  const email = typeof payload.email === 'string' ? payload.email : ''
  if (!email) return null
  const name = typeof payload.name === 'string' ? payload.name : ''
  const phone = typeof payload.phone === 'string' ? payload.phone : undefined
  return {
    registrationToken: token,
    provider,
    profile: { email, name, phone },
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<
      string,
      unknown
    >
  } catch {
    return null
  }
}
