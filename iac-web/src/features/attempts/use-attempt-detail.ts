import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { attemptKeys, getAttempt, getAttemptStatus } from './api'
import {
  assessmentNeedsDetailRefresh,
  assessmentPollInterval,
} from './assessment-polling'

// Fetch the heavy detail on entry and after assessment leaves PROCESSING.
// All waiting-room screens share the same lightweight status query/cache.
export function useAttemptDetail(attemptId: string) {
  const queryClient = useQueryClient()
  const detailQuery = useQuery({
    queryKey: attemptKeys.detail(attemptId),
    queryFn: ({ signal }) => getAttempt(attemptId, signal),
    refetchOnWindowFocus: (query) => query.state.data?.status !== 'PROCESSING',
    refetchOnReconnect: (query) => query.state.data?.status !== 'PROCESSING',
  })
  const processing = detailQuery.data?.status === 'PROCESSING'
  const statusQuery = useQuery({
    queryKey: attemptKeys.status(attemptId),
    queryFn: ({ signal }) => getAttemptStatus(attemptId, signal),
    enabled: processing,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: (query) =>
      assessmentPollInterval(
        query.state.data?.status,
        query.state.dataUpdateCount,
      ),
  })
  // Do not act on a terminal status left in the cache before this mount.
  const latestStatus = statusQuery.isFetchedAfterMount
    ? statusQuery.data
    : undefined

  useEffect(() => {
    if (
      assessmentNeedsDetailRefresh(
        detailQuery.data?.status,
        latestStatus?.status,
      )
    ) {
      void queryClient.invalidateQueries({
        queryKey: attemptKeys.detail(attemptId),
        exact: true,
      })
    }
  }, [attemptId, detailQuery.data?.status, latestStatus?.status, queryClient])

  return {
    ...detailQuery,
    data:
      processing && latestStatus?.status === 'PROCESSING' && detailQuery.data
        ? {
            ...detailQuery.data,
            speakingAssessment: latestStatus.speakingAssessment,
            writingAssessment: latestStatus.writingAssessment,
          }
        : detailQuery.data,
    isError: detailQuery.isError || (processing && statusQuery.isError),
    error: detailQuery.error ?? (processing ? statusQuery.error : null),
    refetch: async () => {
      if (processing) await statusQuery.refetch()
      return detailQuery.refetch()
    },
  }
}
