import { ApiError, apiClient } from '@/lib/api/client'

export type PlanCode = 'self' | 'group' | 'personal'
export type BillingSkill = 'listening' | 'reading' | 'writing' | 'speaking'
export type PaywallFeature = BillingSkill | 'full_mock' | 'assistant'

export const billingSkills: BillingSkill[] = [
  'listening',
  'reading',
  'writing',
  'speaking',
]

export type BillingPlan = {
  code: PlanCode
  title: string
  /** Official price, quoted in the public offer. */
  listPrice: number
  /** Discounted price; null when the plan has no discount. */
  salePrice: number | null
  /** Amount actually charged. */
  price: number
  accessDays: number
  meetingsCount: number
  meetingsKind: 'GROUP' | 'PERSONAL' | null
}

export type BillingPlans = { currency: 'KZT'; plans: BillingPlan[] }

export type FreeAllowance = { limit: number; used: number; remaining: number }

export type BillingAccess = {
  paywallEnabled: boolean
  guest: boolean
  staff?: boolean
  active?: boolean
  plan?: { code: PlanCode; title: string } | null
  endsAt?: string | null
  queuedUntil?: string | null
  meetingsTotal?: number
  meetingsUsed?: number
  free?: Record<BillingSkill, FreeAllowance>
  assistant?: { limit: number; remaining: number }
}

export type BillingOrderStatus =
  'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export type BillingOrder = {
  id: string
  status: BillingOrderStatus
  planCode: PlanCode
  amount: number
  listPrice: number
  createdAt: string
  paidAt: string | null
}

export const billingKeys = {
  all: ['billing'] as const,
  plans: ['billing', 'plans'] as const,
  me: ['billing', 'me'] as const,
  order: (id: string) => ['billing', 'orders', id] as const,
}

export const getBillingPlans = (signal?: AbortSignal) =>
  apiClient.request<BillingPlans>('/api/v1/billing/plans', {
    authenticated: false,
    signal,
  })

export const getBillingAccess = (signal?: AbortSignal) =>
  apiClient.request<BillingAccess>('/api/v1/billing/me', { signal })

export const createCheckout = (planCode: PlanCode) =>
  apiClient.request<{ orderId: string; redirectUrl: string }>(
    '/api/v1/billing/checkout',
    { method: 'POST', body: { planCode, acceptedTerms: true } },
  )

export const getBillingOrder = (id: string, signal?: AbortSignal) =>
  apiClient.request<BillingOrder>(`/api/v1/billing/orders/${id}`, { signal })

export type PaywallReason = {
  feature: PaywallFeature | null
  skill: BillingSkill | null
  remaining: Partial<Record<BillingSkill, number>> | null
}

/** Reads the 402 payload; details carry nested JSON despite the string type. */
export function paymentRequiredReason(error: unknown): PaywallReason | null {
  if (!(error instanceof ApiError) || error.code !== 'PAYMENT_REQUIRED')
    return null
  const details = (error.details ?? {}) as Record<string, unknown>
  const feature = details.feature
  const skill = details.skill
  const remaining = details.remaining
  return {
    feature: isFeature(feature) ? feature : null,
    skill: isSkill(skill) ? skill : null,
    remaining: remaining && typeof remaining === 'object' ? remaining : null,
  }
}

function isSkill(value: unknown): value is BillingSkill {
  return billingSkills.some((skill) => skill === value)
}

function isFeature(value: unknown): value is PaywallFeature {
  return isSkill(value) || value === 'full_mock' || value === 'assistant'
}

export function planDiscountPercent(plan: BillingPlan) {
  if (plan.salePrice === null || plan.salePrice >= plan.listPrice) return 0
  return Math.round((1 - plan.salePrice / plan.listPrice) * 100)
}

/** 4990 → "4 990 ₸". */
export function formatTenge(amount: number) {
  return `${new Intl.NumberFormat('ru-RU').format(amount)} ₸`
}
