import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { ErrorState, ExamLoadingScreen } from '@/features/attempts/attempt-ui'
import type { Attempt } from '@/features/attempts/api'
import { getErrorMessage } from '@/lib/api/client'

export function ExamAttemptShell<TMaterial>({
  skillBadge,
  loadingLabel,
  loadingDescription,
  queryKey,
  startAttemptFn,
  renderRunner,
  renderResult,
}: {
  skillBadge?: string
  loadingLabel: string
  loadingDescription?: string
  queryKey: readonly unknown[]
  startAttemptFn: (signal?: AbortSignal) => Promise<unknown>
  renderRunner: (props: {
    attempt: Attempt
    material: TMaterial
    onSubmitted: (submitted: Attempt) => void
  }) => ReactNode
  renderResult: (props: {
    attempt: Attempt
    material: TMaterial
    onRetake: () => Promise<void>
    isRetaking: boolean
  }) => ReactNode
}) {
  const queryClient = useQueryClient()
  const [submittedAttempt, setSubmittedAttempt] = useState<Attempt | null>(null)
  const [isRetaking, setIsRetaking] = useState(false)

  const startQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) => startAttemptFn(signal),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    enabled: !submittedAttempt,
  })

  const rawData = startQuery.data as Record<string, unknown> | undefined
  const attempt = rawData?.attempt as Attempt | undefined
  const material = (rawData?.material ?? rawData?.test) as TMaterial | undefined

  const handleRetake = async () => {
    if (isRetaking) return
    setIsRetaking(true)
    try {
      const res = await startAttemptFn()
      queryClient.setQueryData(queryKey, res)
      setSubmittedAttempt(null)
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setIsRetaking(false)
    }
  }

  if (submittedAttempt && material) {
    return renderResult({
      attempt: submittedAttempt,
      material,
      onRetake: handleRetake,
      isRetaking,
    })
  }

  if (startQuery.isPending) {
    return (
      <ExamLoadingScreen
        badge={skillBadge}
        label={loadingLabel}
        description={loadingDescription}
      />
    )
  }

  if (!startQuery.data || !attempt || !material) {
    return (
      <ErrorState
        title="Не удалось начать тест"
        message={getErrorMessage(startQuery.error)}
        onRetry={() => void startQuery.refetch()}
      />
    )
  }

  if (attempt.status === 'SUBMITTED' || attempt.status === 'PROCESSING') {
    return renderResult({
      attempt,
      material,
      onRetake: handleRetake,
      isRetaking,
    })
  }

  return renderRunner({
    attempt,
    material,
    onSubmitted: (submitted) => setSubmittedAttempt(submitted),
  })
}
