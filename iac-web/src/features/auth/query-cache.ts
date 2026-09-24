import type { QueryClient } from '@tanstack/react-query'

type IdentityStore = {
  getSnapshot: () => { user: { id: string } | null }
  subscribe: (listener: () => void) => () => void
}

export function clearCacheOnUserChange(
  queryClient: QueryClient,
  auth: IdentityStore,
) {
  let userId = auth.getSnapshot().user?.id
  return auth.subscribe(() => {
    const nextUserId = auth.getSnapshot().user?.id
    if (nextUserId !== userId) {
      userId = nextUserId
      // clear() also cancels queries still running for the previous identity.
      queryClient.clear()
    }
  })
}
