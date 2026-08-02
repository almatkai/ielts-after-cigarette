import { apiClient } from '@/lib/api/client'

type VerificationPurpose = 'registration' | 'waitlist'

export type VerifiedPhone = {
  phone: string
  verificationToken: string
}

type VerificationChallenge = {
  verificationId: string
  expiresAt: string
  retryAfter: number
}

type VerificationProof = {
  verificationToken: string
  expiresAt: string
}

export function requestPhoneVerification(
  phone: string,
  purpose: VerificationPurpose,
) {
  return apiClient.request<VerificationChallenge>(
    '/api/v1/phone-verifications',
    {
      method: 'POST',
      body: { phone, purpose },
      authenticated: false,
      retryAuthentication: false,
    },
  )
}

export function confirmPhoneVerification(input: {
  verificationId: string
  phone: string
  purpose: VerificationPurpose
  code: string
}) {
  const { verificationId, ...body } = input
  return apiClient.request<VerificationProof>(
    `/api/v1/phone-verifications/${verificationId}/confirm`,
    {
      method: 'POST',
      body,
      authenticated: false,
      retryAuthentication: false,
    },
  )
}
