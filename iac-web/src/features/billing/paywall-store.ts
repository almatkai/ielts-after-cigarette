import { useSyncExternalStore } from 'react'

import type { PaywallReason } from './api'

// One dialog for the whole app: any page can ask for it without owning it.
type PaywallState = { open: boolean; reason: PaywallReason | null }

let state: PaywallState = { open: false, reason: null }
const listeners = new Set<() => void>()

function emit(next: PaywallState) {
  state = next
  for (const listener of listeners) listener()
}

export function openPaywall(reason: PaywallReason | null = null) {
  emit({ open: true, reason })
}

export function closePaywall() {
  emit({ ...state, open: false })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePaywallState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
}
