import { QueryClient } from '@tanstack/react-query'

import { authStore } from '@/features/auth/auth-store'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 15_000,
      },
    },
  })

  return {
    queryClient,
    auth: authStore,
  }
}
export default function TanstackQueryProvider() {}
