import { useInfiniteQuery } from '@tanstack/react-query'
import { attemptKeys, listAttemptHistory } from './api'

export function useAttemptHistory() {
  return useInfiniteQuery({
    queryKey: attemptKeys.history,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => listAttemptHistory(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor,
  })
}
