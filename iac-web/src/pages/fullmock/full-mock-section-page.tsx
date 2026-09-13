import { useQuery } from '@tanstack/react-query'

import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { fullMockKeys, getFullMockSection } from '@/features/fullmock/api'
import { ListeningAttemptRunner } from '@/pages/listening/listening-student-page'
import { ReadingAttemptRunner } from '@/pages/reading/reading-student-page'
import { SpeakingAttemptRunner } from '@/pages/speaking/speaking-student-page'
import { WritingAttemptRunner } from '@/pages/writing/writing-student-page'
import { getErrorMessage } from '@/lib/api/client'

export function FullMockSectionPage({
  sessionId,
  sectionPosition,
}: {
  sessionId: string
  sectionPosition: string
}) {
  const query = useQuery({
    queryKey: fullMockKeys.section(sessionId, sectionPosition),
    queryFn: ({ signal }) =>
      getFullMockSection(sessionId, sectionPosition, signal),
  })

  if (query.isPending) {
    return <LoadingState label="Открываем секцию экзамена…" />
  }
  if (query.isError) {
    return (
      <ErrorState
        title="Не удалось открыть секцию Full Mock"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const section = query.data
  switch (section.skill) {
    case 'listening':
      return (
        <ListeningAttemptRunner
          key={section.attempt.id}
          attempt={section.attempt}
          test={section.material}
          fullMockSessionId={sessionId}
        />
      )
    case 'reading':
      return (
        <ReadingAttemptRunner
          key={section.attempt.id}
          attempt={section.attempt}
          material={section.material}
          fullMockSessionId={sessionId}
        />
      )
    case 'writing':
      return (
        <WritingAttemptRunner
          key={section.attempt.id}
          attempt={section.attempt}
          material={section.material}
          fullMockSessionId={sessionId}
        />
      )
    case 'speaking':
      return (
        <SpeakingAttemptRunner
          key={section.attempt.id}
          attempt={section.attempt}
          material={section.material}
          fullMockSessionId={sessionId}
        />
      )
  }
}
