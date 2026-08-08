import { apiClient } from '@/lib/api/client'

import type { AuthResponse } from './auth-store'

export type GoogleRegistrationRequired = {
  registrationRequired: true
  registrationToken: string
  profile: {
    email: string
    name: string
    phone?: string
  }
}

export type GoogleLoginResponse = AuthResponse | GoogleRegistrationRequired

export type CompleteGoogleRegistrationInput = {
  registrationToken: string
  name: string
  phone: string
  password: string
  acceptedTerms: boolean
}

export function isGoogleRegistrationRequired(
  response: GoogleLoginResponse,
): response is GoogleRegistrationRequired {
  return 'registrationRequired' in response
}

export function requestGoogleLogin(googleToken: string) {
  return apiClient.request<GoogleLoginResponse>('/api/v1/auth/google', {
    method: 'POST',
    body: { googleToken },
    authenticated: false,
    retryAuthentication: false,
  })
}

export function requestCompleteGoogleRegistration(
  input: CompleteGoogleRegistrationInput,
) {
  return apiClient.request<AuthResponse>('/api/v1/auth/google/complete', {
    method: 'POST',
    body: input,
    authenticated: false,
    retryAuthentication: false,
  })
}
