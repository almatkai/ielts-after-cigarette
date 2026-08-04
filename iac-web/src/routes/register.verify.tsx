import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthShell } from '#/components/auth/auth-shell'
import { RegistrationVerificationForm } from '#/components/auth/registration-verification-form'
import { getPendingRegistration } from '#/features/auth/registration-flow'

export const Route = createFileRoute('/register/verify')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    await context.auth.initialize()
    if (context.auth.isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    }
    if (!getPendingRegistration()) {
      throw redirect({ to: '/register' })
    }
  },
  head: () => ({
    meta: [
      { title: 'Подтвердите номер — Daiyndyq IELTS' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: RegisterVerificationPage,
})

function RegisterVerificationPage() {
  return (
    <AuthShell>
      <RegistrationVerificationForm />
    </AuthShell>
  )
}
