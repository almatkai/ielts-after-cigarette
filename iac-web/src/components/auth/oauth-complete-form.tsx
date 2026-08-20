import { useNavigate } from '@tanstack/react-router'

import { useAuth } from '@/features/auth/auth-store'
import { oauthProviderLabels } from '@/features/auth/oauth-auth'
import type { PendingOAuthRegistration } from '@/features/auth/oauth-auth'

import { CompleteRegistrationForm } from './google-complete-form'

type OAuthCompleteFormProps = {
  pending: PendingOAuthRegistration
  redirect?: '/admin' | '/dashboard'
}

export function OAuthCompleteForm({
  pending,
  redirect,
}: OAuthCompleteFormProps) {
  const navigate = useNavigate()
  const { completeOAuthRegistration } = useAuth()
  return (
    <CompleteRegistrationForm
      pending={pending}
      providerLabel={oauthProviderLabels[pending.provider]}
      // The complete-endpoint reuses the Google registration pipeline.
      invalidTokenErrorCodes={['GOOGLE_TOKEN_INVALID']}
      submit={completeOAuthRegistration}
      onBack={() => {
        void navigate({ to: '/login', search: {}, replace: true })
      }}
      redirect={redirect}
    />
  )
}
