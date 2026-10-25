import { ArrowLeft, Clock, Lock, PlayCircle, TickCircle } from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { retryAttemptAssessment } from '@/features/attempts/api'
import { useAuth } from '@/features/auth/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, ExamLoadingScreen } from '@/features/attempts/attempt-ui'
import {
  advanceFullMockSession,
  fullMockKeys,
  getFullMockSession,
  pauseFullMockSession,
} from '@/features/fullmock/api'
import type { FullMockSession, FullMockSkill } from '@/features/fullmock/api'
import { getErrorMessage } from '@/lib/api/client'
import { FullMockReport } from './full-mock-report'
import { tr } from '@/lib/i18n'

const labels: Record<FullMockSkill, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

export function FullMockSessionPage({ sessionId }: { sessionId: string }) {
  // Rebind the mounted query observer when sign-in clears the guest's cache.
  const { initialized } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: fullMockKeys.session(sessionId),
    enabled: initialized,
    queryFn: ({ signal }) => getFullMockSession(sessionId, signal),
    refetchInterval: (cachedQuery) => {
      const session = cachedQuery.state.data
      return session?.status === 'IN_PROGRESS' ||
        session?.sections.some(
          (section) =>
            section.attempt.status === 'PROCESSING' ||
            ['QUEUED', 'PROCESSING'].includes(section.assessmentStatus ?? ''),
        )
        ? 10_000
        : false
    },
  })
  const currentSection = query.data?.currentSection
  const deadline = query.data?.sections.find(
    (section) => section.position === currentSection,
  )?.deadlineAt
  const sessionStatus = query.data?.status
  const refetchSession = query.refetch
  useEffect(() => {
    if (sessionStatus !== 'IN_PROGRESS' || !deadline) return
    const timer = window.setTimeout(
      () => void refetchSession(),
      Math.max(0, new Date(deadline).getTime() - Date.now()) + 50,
    )
    return () => window.clearTimeout(timer)
  }, [deadline, sessionStatus, refetchSession])
  const advance = useMutation({
    mutationFn: () => advanceFullMockSession(sessionId),
    onSuccess: (session) =>
      queryClient.setQueryData(fullMockKeys.session(sessionId), session),
  })
  const returnToSite = useMutation({
    mutationFn: async () => {
      const session = query.data
      const current = session?.sections.find(
        (section) => section.position === session.currentSection,
      )
      if (
        session?.status === 'IN_PROGRESS' &&
        current?.attempt.status === 'IN_PROGRESS' &&
        current.deadlineAt
      ) {
        const paused = await pauseFullMockSession(sessionId)
        queryClient.setQueryData(fullMockKeys.session(sessionId), paused)
        queryClient.removeQueries({
          queryKey: [...fullMockKeys.session(sessionId), 'sections'],
        })
      }
    },
    onSuccess: () => navigate({ to: '/' }),
  })
  if (query.isPending) {
    return (
      <ExamLoadingScreen
        badge="IELTS Full Mock"
        label="Loading your exam session…"
        description="Loading section status, timers, and the Full Mock schedule..."
      />
    )
  }
  if (query.isError)
    return (
      <ErrorState
        title="Could not load the Full Mock"
        message={tr(getErrorMessage(query.error))}
        onRetry={() => void query.refetch()}
      />
    )
  const session = query.data
  const current = session.sections.find(
    (section) => section.position === session.currentSection,
  )
  const analyzing = session.sections.some(
    (section) =>
      section.attempt.status === 'PROCESSING' ||
      ['QUEUED', 'PROCESSING'].includes(section.assessmentStatus ?? ''),
  )
  const failed = session.sections.some(
    (section) => section.assessmentStatus === 'FAILED',
  )
  const readyCount = session.sections.filter((section) =>
    ['SUBMITTED', 'ABANDONED'].includes(section.attempt.status),
  ).length
  const waitingForReport = session.currentSection === 4 && (analyzing || failed)
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] content-start gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="secondary">
            Full Mock ·{' '}
            {session.mockTest.examType === 'academic'
              ? 'Academic'
              : 'General Training'}
          </Badge>
          <h1 className="text-[28px] sm:text-[36px] mt-2 font-semibold tracking-normal">
            {session.mockTest.title}
          </h1>
        </div>
        <Button
          variant="outline"
          disabled={returnToSite.isPending || advance.isPending}
          onClick={() => returnToSite.mutate()}
        >
          <ArrowLeft aria-hidden />
          {returnToSite.isPending ? 'Saving…' : 'Return to site'}
        </Button>
      </div>
      {returnToSite.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Could not pause the test: {tr(getErrorMessage(returnToSite.error))}
        </p>
      ) : null}
      {session.status === 'SUBMITTED' && !analyzing && !failed ? (
        <FullMockReport key={session.id} session={session} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {session.sections.map((section) => (
              <SectionCard
                key={section.position}
                section={section}
                currentSection={session.currentSection}
                sessionId={session.id}
              />
            ))}
          </div>
          {analyzing ? (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span
                aria-hidden
                className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              Analyzing saved answers… {readyCount} of {session.sections.length}{' '}
              sections ready.
            </p>
          ) : null}
          {failed ? (
            <p role="alert" className="text-sm text-destructive">
              Analysis failed. Your saved answers are safe. Retry analysis in
              that section to prepare your report.
            </p>
          ) : null}
          {current &&
          ['SUBMITTED', 'PROCESSING', 'ABANDONED'].includes(
            current.attempt.status,
          ) ? (
            <Card className="border-primary-soft bg-primary-soft shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <p className="text-sm font-medium">
                  {waitingForReport
                    ? 'Your answers are saved. The report will be available when analysis finishes.'
                    : `${labels[current.skill]} is complete. You can continue.`}
                </p>
                <Button
                  disabled={
                    advance.isPending ||
                    returnToSite.isPending ||
                    waitingForReport
                  }
                  onClick={() => advance.mutate()}
                >
                  {advance.isPending
                    ? 'Continuing…'
                    : session.currentSection === 4
                      ? 'Finish and show the report'
                      : 'Continue to the next section'}
                </Button>
              </CardContent>
            </Card>
          ) : null}
          {advance.isError ? (
            <p className="text-sm text-destructive">
              {tr(getErrorMessage(advance.error))}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

function SectionCard({
  section,
  currentSection,
  sessionId,
}: {
  section: FullMockSession['sections'][number]
  currentSection: number
  sessionId: string
}) {
  const client = useQueryClient()
  const pause = useMutation({
    mutationFn: () => pauseFullMockSession(sessionId),
    onSuccess: (session) =>
      client.setQueryData(fullMockKeys.session(sessionId), session),
  })
  const retry = useMutation({
    mutationFn: () => retryAttemptAssessment(section.attempt.id),
    onSuccess: async () => {
      client.removeQueries({
        queryKey: [...fullMockKeys.session(sessionId), 'sections'],
      })
      await client.invalidateQueries({
        queryKey: fullMockKeys.session(sessionId),
        exact: true,
      })
    },
  })
  const failed = section.assessmentStatus === 'FAILED'
  const isCurrent = section.position === currentSection
  const completed =
    ['SUBMITTED', 'PROCESSING', 'ABANDONED'].includes(section.attempt.status) ||
    ['QUEUED', 'PROCESSING'].includes(section.assessmentStatus ?? '')
  const locked = section.position > currentSection
  return (
    <Card
      className={isCurrent ? 'border-primary-soft shadow-none' : 'shadow-none'}
    >
      <CardHeader>
        <div className="flex flex-col items-start gap-2">
          <CardTitle className="text-base">
            0{section.position} · {labels[section.skill]}
          </CardTitle>
          {failed ? (
            <Badge variant="destructive">Analysis failed</Badge>
          ) : completed ? (
            <Badge className="bg-success">
              <TickCircle aria-hidden />
              {section.attempt.status === 'ABANDONED'
                ? 'Time is up'
                : section.attempt.status === 'PROCESSING' ||
                    ['QUEUED', 'PROCESSING'].includes(
                      section.assessmentStatus ?? '',
                    )
                  ? section.assessmentStatus === 'QUEUED'
                    ? 'Queued for analysis'
                    : 'Analyzing'
                  : 'Submitted'}
            </Badge>
          ) : locked ? (
            <Badge variant="outline">
              <Lock aria-hidden />
              Locked
            </Badge>
          ) : (
            <Badge variant="secondary">Current</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          {section.durationMinutes ??
            (section.skill === 'listening'
              ? 30
              : section.skill === 'speaking'
                ? 15
                : 60)}{' '}
          minutes
        </p>
        {failed ? (
          <Button
            variant="outline"
            disabled={retry.isPending}
            onClick={() => retry.mutate()}
          >
            {retry.isPending ? 'Retrying…' : 'Retry analysis'}
          </Button>
        ) : isCurrent && !completed ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionLink section={section} sessionId={sessionId} />
            {section.remainingMilliseconds != null ? (
              <Badge variant="outline">
                Paused at · {formatRemainingTime(section.remainingMilliseconds)}
              </Badge>
            ) : section.deadlineAt ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={pause.isPending}
                  onClick={() => pause.mutate()}
                >
                  Pause
                </Button>
                <ExamTimer deadlineAt={section.deadlineAt} />
              </div>
            ) : null}
          </div>
        ) : null}
        {retry.isError ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {tr(getErrorMessage(retry.error))}
          </p>
        ) : null}
        {pause.isError ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {tr(getErrorMessage(pause.error))}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SectionLink({
  section,
  sessionId,
}: {
  section: FullMockSession['sections'][number]
  sessionId: string
}) {
  const content = (
    <>
      <PlayCircle aria-hidden />
      Resume section
    </>
  )
  return (
    <Button asChild>
      <Link
        to="/exam/full-mock-sessions/$sessionId/sections/$sectionPosition"
        params={{ sessionId, sectionPosition: String(section.position) }}
        preload={false}
      >
        {content}
      </Link>
    </Button>
  )
}

function formatRemainingTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function ExamTimer({ deadlineAt }: { deadlineAt: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const seconds = Math.max(
    0,
    Math.ceil((new Date(deadlineAt).getTime() - now) / 1000),
  )
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return (
    <Badge variant="outline" className="gap-2 px-3 py-2 text-sm">
      <Clock className="size-4" aria-hidden />
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
      {String(remainder).padStart(2, '0')}
    </Badge>
  )
}
