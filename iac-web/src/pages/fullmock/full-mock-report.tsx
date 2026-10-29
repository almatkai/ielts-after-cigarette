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
import { useLanguage } from '@/lib/i18n'
import { FullMockRetake } from './full-mock-retake'
import { ReportUpsell } from '@/features/billing/report-upsell'

export function FullMockReport({ session }: { session: FullMockSession }) {
  const { language } = useLanguage()
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
            {language === 'en'
              ? 'Mock exam results'
              : language === 'kk'
                ? 'Сынақ емтиханының нәтижелері'
                : 'Результаты пробного экзамена'}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {language === 'en'
              ? 'An overall estimated band is not available: the scale and automated assessments have not been validated. Use task results and feedback to guide your next practice.'
              : language === 'kk'
                ? 'Жалпы болжамды балл әзірге есептелмейді: шкала мен автоматты бағалар расталмаған. Келесі жаттығу үшін тапсырма нәтижелері мен талдауды пайдаланыңыз.'
                : 'Общий ориентировочный балл пока не рассчитан: шкала и автоматические оценки не подтверждены. Используйте результаты заданий и разбор для следующей практики.'}
          </p>
        </div>
        <FullMockRetake sessionId={session.id} />
      </div>
      {user ? <ReportUpsell /> : null}
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        role="group"
        aria-label={
          language === 'en'
            ? 'Full Mock sections'
            : language === 'kk'
              ? 'Full Mock бөлімдері'
              : 'Секции Full Mock'
        }
      >
        {session.sections.map((section) => {
          const skill =
            section.skill.charAt(0).toUpperCase() + section.skill.slice(1)
          const active = position === section.position
          const ungraded = section.attempt.status === 'ABANDONED'
          return (
            <div
              key={section.position}
              className={`relative min-w-0 rounded-xl border bg-card ${active ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
            >
              <button
                type="button"
                aria-label={
                  language === 'en'
                    ? `Show ${skill} review`
                    : language === 'kk'
                      ? `${skill} таңдау`
                      : `Выбрать ${skill}`
                }
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
                className="grid w-full gap-3 rounded-xl p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="text-base font-semibold">
                  <span className="mr-2 text-muted-foreground">
                    0{section.position}
                  </span>
                  {skill}
                </span>
                <span className="text-sm text-muted-foreground">
                  {section.durationMinutes ??
                    (section.skill === 'listening'
                      ? 30
                      : section.skill === 'speaking'
                        ? 15
                        : 60)}{' '}
                  {language === 'en'
                    ? 'minutes'
                    : language === 'kk'
                      ? 'минут'
                      : 'минут'}
                </span>
                <Badge variant="secondary" className="w-fit">
                  {ungraded
                    ? language === 'en'
                      ? 'Not graded'
                      : language === 'kk'
                        ? 'Бағаланбаған'
                        : 'Без оценки'
                    : section.attempt.status === 'PROCESSING'
                      ? language === 'en'
                        ? 'Assessing'
                        : language === 'kk'
                          ? 'Тексерілуде'
                          : 'Проверяется'
                      : language === 'en'
                        ? 'Submitted'
                        : language === 'kk'
                          ? 'Тапсырылды'
                          : 'Сдано'}
                </Badge>
                <span className="min-h-9 text-sm font-semibold text-primary-hover">
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
          aria-label={
            language === 'en'
              ? `${selected.skill} review`
              : language === 'kk'
                ? `${selected.skill} талдауы`
                : `Работа над ошибками ${selected.skill}`
          }
          className="min-w-0"
        >
          {selected.attempt.status === 'ABANDONED' ? (
            <p className="text-sm text-muted-foreground">
              {language === 'en'
                ? 'This section finished without a score.'
                : language === 'kk'
                  ? 'Бөлім бағасыз аяқталды.'
                  : 'Секция завершена без оценки.'}
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
  const { language, t } = useLanguage()
  const query = useQuery({
    queryKey: attemptKeys.detail(attemptId),
    queryFn: ({ signal }) => getAttempt(attemptId, signal),
  })
  if (query.isPending) return <>{t('Загружаем разбор этой попытки…')}</>
  if (
    query.isError ||
    !(query.data.writingEvaluation || query.data.speakingEvaluation)
  )
    return (
      <>
        {language === 'en'
          ? 'Review not yet available'
          : language === 'kk'
            ? 'Талдау әзірге қолжетімсіз'
            : 'Разбор пока недоступен'}
      </>
    )
  return (
    <>
      {language === 'en'
        ? 'Review ready'
        : language === 'kk'
          ? 'Талдау дайын'
          : 'Разбор готов'}
    </>
  )
}
