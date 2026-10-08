import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'iconsax-react'

import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { fullMockKeys, getFullMockSession } from '@/features/fullmock/api'
import { getErrorMessage } from '@/lib/api/client'
import { AttemptReviewPage } from '@/pages/attempts/attempt-review-page'

const skills = ['listening', 'reading', 'writing', 'speaking'] as const
const labels = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

export function FullMockAttemptReview({
  attemptId,
  sessionId,
}: {
  attemptId: string
  sessionId: string
}) {
  const query = useQuery({
    queryKey: fullMockKeys.session(sessionId),
    queryFn: ({ signal }) => getFullMockSession(sessionId, signal),
  })
  if (query.isPending) return <LoadingState label="Загрузка…" />
  if (query.isError)
    return (
      <ErrorState
        title="Не удалось загрузить Full Mock"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  const session = query.data
  if (!session.sections.some((section) => section.attempt.id === attemptId)) {
    return (
      <p className="text-sm text-[#69696d]">
        Попытка не относится к этому Full Mock.
      </p>
    )
  }
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <Link
        to="/exam/full-mock-sessions/$sessionId"
        params={{ sessionId }}
        className="inline-flex w-fit items-center gap-2 text-sm text-[#69696d] hover:text-[#111111]"
      >
        <ArrowLeft className="size-4" aria-hidden />К результату
      </Link>
      <h1 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
        Работа над ошибками
      </h1>
      <nav
        aria-label="Секции Full Mock"
        className="grid grid-cols-2 gap-1 rounded-[12px] bg-[#f0f0ed] p-1 sm:grid-cols-4"
      >
        {skills.map((skill) => {
          const section = session.sections.find((item) => item.skill === skill)
          if (!section) return null
          const selected = section.attempt.id === attemptId
          return (
            <Link
              key={skill}
              to="/attempts/$attemptId"
              params={{ attemptId: section.attempt.id }}
              search={{ session: sessionId }}
              aria-current={selected ? 'page' : undefined}
              className={`rounded-[9px] px-3 py-2 text-center text-sm focus-visible:outline-2 focus-visible:outline-[#3b82f6] ${selected ? 'bg-white text-[#111111]' : 'text-[#69696d] hover:text-[#111111]'}`}
            >
              {labels[skill]}
            </Link>
          )
        })}
      </nav>
      <AttemptReviewPage key={attemptId} attemptId={attemptId} embedded />
    </div>
  )
}
