import { QueryClient } from '@tanstack/react-query'

import { authStore } from '@/features/auth/auth-store'
import { clearCacheOnUserChange } from '@/features/auth/query-cache'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 15_000,
      },
    },
  })

  if (typeof window !== 'undefined') {
    clearCacheOnUserChange(queryClient, authStore)
  }

  return {
    queryClient,
    auth: authStore,
  }
}
export default function TanstackQueryProvider() {}
