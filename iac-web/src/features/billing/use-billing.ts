import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/auth-store'

import { billingKeys, getBillingAccess, getBillingPlans } from './api'
import type { BillingAccess } from './api'

export function useBillingPlans() {
  return useQuery({
    queryKey: billingKeys.plans,
    queryFn: ({ signal }) => getBillingPlans(signal),
    staleTime: 5 * 60_000,
  })
}

export function useBillingAccess() {
  const { user } = useAuth()
  return useQuery({
    queryKey: billingKeys.me,
    queryFn: ({ signal }) => getBillingAccess(signal),
    enabled: Boolean(user),
    staleTime: 30_000,
  })
}

/** True when the student is limited to the free allowance right now. */
export function isOnFreeAllowance(access: BillingAccess | undefined) {
  return Boolean(
    access?.paywallEnabled && !access.guest && !access.staff && !access.active,
  )
}
