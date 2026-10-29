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
  note: string | null
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
  apiClient.request<AdminEntitlement>(
    `/api/v1/admin/entitlements/${id}/revoke`,
    { method: 'POST', body: { note } },
  )

export const setMeetingsUsed = (id: string, meetingsUsed: number) =>
  apiClient.request<AdminEntitlement>(
    `/api/v1/admin/entitlements/${id}/meetings`,
    { method: 'PATCH', body: { meetingsUsed } },
  )
