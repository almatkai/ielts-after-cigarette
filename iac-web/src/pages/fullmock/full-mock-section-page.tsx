import { useQuery } from '@tanstack/react-query'

import { ErrorState, ExamLoadingScreen } from '@/features/attempts/attempt-ui'
import {
  fullMockKeys,
  getFullMockSection,
  getFullMockSession,
} from '@/features/fullmock/api'
import { FullMockSessionPage } from '@/pages/fullmock/full-mock-session-page'
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
  // Keep the server deadline active while the student is inside a section.
  const sessionQuery = useQuery({
    queryKey: fullMockKeys.session(sessionId),
    queryFn: ({ signal }) => getFullMockSession(sessionId, signal),
    refetchInterval: (query) =>
      query.state.data?.status === 'SUBMITTED' ? false : 5000,
  })
  const query = useQuery({
    queryKey: fullMockKeys.section(sessionId, sectionPosition),
    queryFn: ({ signal }) =>
      getFullMockSection(sessionId, sectionPosition, signal),
  })

  if (sessionQuery.data?.status === 'SUBMITTED') {
    return <FullMockSessionPage sessionId={sessionId} />
  }

  if (query.isPending) {
    return (
      <ExamLoadingScreen
        badge="IELTS Full Mock"
        label="Открываем секцию экзамена…"
        description="Инициализируем материалы следующей части полного пробного тестирования..."
      />
    )
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
