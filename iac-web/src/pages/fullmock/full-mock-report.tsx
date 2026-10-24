import { useQuery } from '@tanstack/react-query'
import { attemptKeys, getAttempt } from '@/features/attempts/api'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  GuestLockedBand,
  GuestResultsAccess,
} from '@/components/auth/guest-results-access'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth/auth-store'
import type { FullMockSession } from '@/features/fullmock/api'
import { AttemptReviewPage } from '@/pages/attempts/attempt-review-page'
import { FullMockRetake } from './full-mock-retake'

export function FullMockReport({ session }: { session: FullMockSession }) {
  const { user } = useAuth()
  const { section: requestedSection } = useSearch({
    from: '/exam/full-mock-sessions/$sessionId',
  })
  const navigate = useNavigate()
  const position = requestedSection || 1
  const selected = session.sections.find(
    (section) => section.position === position,
  )
  const locked = session.resultsLocked || !user
  return (
    <GuestResultsAccess>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-2">
          <h2 className="text-lg font-semibold">
            Результаты пробного экзамена
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[#69696d]">
            Общий ориентировочный балл пока не рассчитан: шкала и автоматические
            оценки не подтверждены. Используйте результаты заданий и разбор для
            следующей практики.
          </p>
        </div>
        <FullMockRetake sessionId={session.id} />
      </div>
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        role="group"
        aria-label="Секции Full Mock"
      >
        {session.sections.map((section) => {
          const skill =
            section.skill.charAt(0).toUpperCase() + section.skill.slice(1)
          const active = position === section.position
          const ungraded = section.attempt.status === 'ABANDONED'
          return (
            <div
              key={section.position}
              className={`relative min-w-0 rounded-2xl border bg-white ${active ? 'border-[#3b82f6] ring-1 ring-[#3b82f6]' : 'border-[#e7e7e4]'}`}
            >
              <button
                type="button"
                aria-label={`Выбрать ${skill}`}
                aria-pressed={active}
                aria-controls="full-mock-review"
                onClick={() =>
                  void navigate({
                    to: '/exam/full-mock-sessions/$sessionId',
                    params: { sessionId: session.id },
                    search: { section: section.position },
                    replace: true,
                    resetScroll: false,
                  })
                }
                className="grid w-full gap-3 rounded-2xl p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <span className="text-base font-semibold">
                  <span className="mr-2 text-[#69696d]">
                    0{section.position}
                  </span>
                  {skill}
                </span>
                <span className="text-sm text-[#69696d]">
                  {section.durationMinutes ??
                    (section.skill === 'listening'
                      ? 30
                      : section.skill === 'speaking'
                        ? 15
                        : 60)}{' '}
                  минут
                </span>
                <Badge variant="secondary" className="w-fit">
                  {ungraded
                    ? 'Без оценки'
                    : section.attempt.status === 'PROCESSING'
                      ? 'Проверяется'
                      : 'Сдано'}
                </Badge>
                <span className="min-h-9 text-sm font-semibold text-[#2563eb]">
                  {locked && !ungraded ? null : section.attempt.status !==
                    'SUBMITTED' ? (
                    '—'
                  ) : section.skill === 'reading' ||
                    section.skill === 'listening' ? (
                    `${section.attempt.score ?? '—'}/${section.attempt.maxScore ?? '—'}`
                  ) : (
                    <SubjectiveReviewStatus attemptId={section.attempt.id} />
                  )}
                </span>
              </button>
              {locked && !ungraded ? (
                <div className="absolute bottom-3 left-2">
                  <GuestLockedBand skill={skill} />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      {selected ? (
        <section
          id="full-mock-review"
          aria-label={`Работа над ошибками ${selected.skill}`}
          className="min-w-0"
        >
          {selected.attempt.status === 'ABANDONED' ? (
            <p className="text-sm text-[#69696d]">
              Секция завершена без оценки.
            </p>
          ) : (
            <AttemptReviewPage
              key={selected.attempt.id}
              attemptId={selected.attempt.id}
              embedded
            />
          )}
        </section>
      ) : null}
    </GuestResultsAccess>
  )
}

function SubjectiveReviewStatus({ attemptId }: { attemptId: string }) {
  const query = useQuery({
    queryKey: attemptKeys.detail(attemptId),
    queryFn: ({ signal }) => getAttempt(attemptId, signal),
  })
  if (query.isPending) return <>Загружаем разбор…</>
  if (
    query.isError ||
    !(query.data.writingEvaluation || query.data.speakingEvaluation)
  )
    return <>Разбор пока недоступен</>
  return <>Разбор готов</>
}
