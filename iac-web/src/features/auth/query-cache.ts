import type { QueryClient } from '@tanstack/react-query'

type IdentityStore = {
  getSnapshot: () => {
    user: { id: string } | null
    guest?: { id: string } | null
  }
  subscribe: (listener: () => void) => () => void
}

export function clearCacheOnUserChange(
  queryClient: QueryClient,
  auth: IdentityStore,
) {
  const identity = () => {
    const snapshot = auth.getSnapshot()
    return snapshot.user?.id ?? snapshot.guest?.id
  }
  let userId = identity()
  return auth.subscribe(() => {
    const nextUserId = identity()
    if (nextUserId !== userId) {
      userId = nextUserId
      // clear() also cancels queries still running for the previous identity.
      queryClient.clear()
    }
  })
}
