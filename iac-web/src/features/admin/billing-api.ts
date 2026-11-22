import { apiClient } from '@/lib/api/client'
import type {
  BillingAccess,
  BillingOrderStatus,
  PlanCode,
} from '@/features/billing/api'

export type AdminEntitlement = {
  id: string
  planCode: PlanCode
  orderId: string | null
  source: 'PAYMENT' | 'ADMIN' | 'BONUS'
  startsAt: string
  endsAt: string
  revokedAt: string | null
  meetingsTotal: number
  meetingsUsed: number
  note: string
  createdAt: string
}

export type AdminOrder = {
  id: string
  userId: string
  email?: string
  planCode: PlanCode
  amount: number
  listPrice: number
  status: BillingOrderStatus
  provider: string
  providerOrderId: string | null
  createdAt: string
  paidAt: string | null
}

export type AdminUserBilling = {
  access: BillingAccess
  entitlements: AdminEntitlement[]
  orders: AdminOrder[]
}

export const adminBillingKey = (userId: string) =>
  ['admin', 'users', userId, 'billing'] as const

export const getAdminUserBilling = (userId: string, signal?: AbortSignal) =>
  apiClient.request<AdminUserBilling>(`/api/v1/admin/users/${userId}/billing`, {
    signal,
  })

export const grantEntitlement = (
  userId: string,
  input: {
    planCode: PlanCode
    days?: number
    source: 'ADMIN' | 'BONUS'
    note: string
  },
) =>
  apiClient.request<AdminEntitlement>(
    `/api/v1/admin/users/${userId}/entitlements`,
    { method: 'POST', body: input },
  )

export const revokeEntitlement = (id: string, note: string) =>
  apiClient.request<{ ok: boolean }>(
    `/api/v1/admin/entitlements/${id}/revoke`,
    { method: 'POST', body: { note } },
  )

export const setMeetingsUsed = (id: string, meetingsUsed: number) =>
  apiClient.request<{ ok: boolean }>(
    `/api/v1/admin/entitlements/${id}/meetings`,
    { method: 'PATCH', body: { meetingsUsed } },
  )

export type AdminPromocode = {
  id: string
  code: string
  discountType: 'FREE' | 'PERCENT' | 'FIXED'
  discountValue: number
  planCode: PlanCode | null
  minPriceKzt: number | null
  allowOnSale: boolean
  maxUses: number | null
  usedCount: number
  maxUsesPerUser: number
  startsAt: string
  expiresAt: string | null
  isActive: boolean
  partnerUserId: string | null
  partnerName?: string | null
  createdBy: string | null
  note: string
  createdAt: string
  updatedAt: string
}

export type CreatePromocodeInput = {
  code: string
  discountType: 'FREE' | 'PERCENT' | 'FIXED'
  discountValue: number
  planCode?: PlanCode | null
  minPriceKzt?: number | null
  allowOnSale?: boolean
  maxUses?: number | null
  maxUsesPerUser?: number
  startsAt?: string | null
  expiresAt?: string | null
  partnerUserId?: string | null
  note?: string
}

export type AdminPromocodeRedemption = {
  id: string
  promocodeId: string
  userId: string
  userEmail?: string
  userName?: string
  orderId: string | null
  discountAmount: number
  finalPrice: number
  createdAt: string
}

export const adminPromocodesKey = (partnerUserId?: string) =>
  ['admin', 'billing', 'promocodes', partnerUserId ?? 'all'] as const

export const listAdminPromocodes = async (
  partnerUserId?: string,
  activeOnly?: boolean,
  signal?: AbortSignal,
): Promise<AdminPromocode[]> => {
  const params = new URLSearchParams()
  if (partnerUserId) params.set('partnerUserId', partnerUserId)
  if (activeOnly !== undefined) {
    params.set('active', String(activeOnly))
    params.set('activeOnly', String(activeOnly))
  }
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await apiClient.request<
    { promocodes?: AdminPromocode[] } | AdminPromocode[]
  >(`/api/v1/admin/billing/promocodes${qs}`, { signal })
  if (Array.isArray(res)) return res
  return res.promocodes ?? []
}

export const createAdminPromocode = (input: CreatePromocodeInput) =>
  apiClient.request<AdminPromocode>('/api/v1/admin/billing/promocodes', {
    method: 'POST',
    body: input,
  })

export const toggleAdminPromocodeStatus = (id: string, isActive: boolean) =>
  apiClient.request<AdminPromocode>(
    `/api/v1/admin/billing/promocodes/${id}/status`,
    {
      method: 'PATCH',
      body: { isActive },
    },
  )

export const deleteAdminPromocode = (id: string) =>
  apiClient.request<void>(`/api/v1/admin/billing/promocodes/${id}`, {
    method: 'DELETE',
  })

export const getAdminPromocodeRedemptions = async (
  id: string,
  signal?: AbortSignal,
): Promise<AdminPromocodeRedemption[]> => {
  const res = await apiClient.request<
    { redemptions?: AdminPromocodeRedemption[] } | AdminPromocodeRedemption[]
  >(`/api/v1/admin/billing/promocodes/${id}/redemptions`, { signal })
  if (Array.isArray(res)) return res
  return res.redemptions ?? []
}
