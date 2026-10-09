import { redirect } from '@tanstack/react-router'
import type { AdminPermission, AuthStore } from './auth-store'

export function requireAdminPermission(
  auth: AuthStore,
  permission: AdminPermission,
) {
  if (!auth.hasAnyPermission([permission])) {
    throw redirect({ to: '/forbidden' })
  }
}
