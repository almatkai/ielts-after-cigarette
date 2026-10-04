import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { installGlobalErrorReporting, reportError } from '@/lib/error-reporting'

import { authStore } from '@/features/auth/auth-store'
import { clearCacheOnUserChange } from '@/features/auth/query-cache'
import { watchMistakeResults } from '@/features/attempts/mistake-cache'

export function getContext() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => reportError(error, 'query'),
    }),
    mutationCache: new MutationCache({
      onError: (error) => reportError(error, 'mutation'),
    }),
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 15_000,
      },
    },
  })

  if (typeof window !== 'undefined') {
    installGlobalErrorReporting()
    clearCacheOnUserChange(queryClient, authStore)
    watchMistakeResults(queryClient)
  }

  return {
    queryClient,
    auth: authStore,
  }
}
export default function TanstackQueryProvider() {}
