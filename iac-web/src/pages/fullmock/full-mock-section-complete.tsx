import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { fullMockKeys } from '@/features/fullmock/api'

export function FullMockSectionComplete({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    // Submit updates the attempt, but the session can still be fresh in cache.
    // Invalidate only the session: section reads can start/resume their timers.
    void queryClient
      .invalidateQueries({
        queryKey: fullMockKeys.session(sessionId),
        exact: true,
      })
      .then(() => {
        if (!cancelled) {
          void navigate({
            to: '/exam/full-mock-sessions/$sessionId',
            params: { sessionId },
            replace: true,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [queryClient, navigate, sessionId])

  return null
}
