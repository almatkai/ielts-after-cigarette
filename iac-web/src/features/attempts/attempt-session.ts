import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  attemptKeys,
  getAttempt,
  saveAttemptAnswers,
  submitAttempt,
} from '@/features/attempts/api'
import type { Attempt, StudentAnswer } from '@/features/attempts/api'
import { DraftBuffer } from '@/features/attempts/draft-buffer'
import {
  extractDirtyDraft,
  readAttemptDraft,
  writeAttemptDraft,
} from '@/features/attempts/attempt-draft'
import { invalidateMistakeResults } from '@/features/attempts/mistake-cache'
import { getErrorMessage } from '@/lib/api/client'
import { reportError } from '@/lib/error-reporting'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type FlushOptions = {
  keepalive?: boolean
}

export function useAttemptSession(attemptId: string) {
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<string, StudentAnswer> | null>(
    null,
  )
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [submitted, setSubmitted] = useState<Attempt | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [exitError, setExitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false)
  const answersRef = useRef<Record<string, StudentAnswer> | null>(null)
  const pending = useRef(new DraftBuffer<StudentAnswer>())
  const savesInFlight = useRef<Promise<void>[]>([])
  const keepaliveRequest = useRef<Promise<void> | null>(null)
  const submitting = useRef(false)
  const closed = useRef(false)
  const saveFailures = useRef(0)
  const debounceTimer = useRef<number | null>(null)

  const draftsQuery = useQuery({
    queryKey: attemptKeys.detail(attemptId),
    queryFn: ({ signal }) => getAttempt(attemptId, signal),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const persistPendingDraft = useCallback(() => {
    const dirty: Record<string, StudentAnswer> = {}
    for (const { questionId, answer } of pending.current.snapshot()) {
      dirty[questionId] = answer
    }
    writeAttemptDraft(attemptId, dirty)
  }, [attemptId])

  useEffect(() => {
    // Never hydrate an editable form from an old cache entry or a failed read.
    if (
      answersRef.current !== null ||
      !draftsQuery.isFetchedAfterMount ||
      draftsQuery.isError
    )
      return
    const detail = draftsQuery.data
    if (!detail) return
    const serverAnswers = Object.fromEntries(
      (detail.answers ?? []).map((item) => [item.questionId, item.answer]),
    )

    // Only unsynchronized changes may shadow server answers: entries the
    // server already returns are treated as synced, so a draft saved from
    // another device is never overwritten by a stale local snapshot.
    const dirty = extractDirtyDraft(
      serverAnswers,
      readAttemptDraft(attemptId),
    )
    for (const [questionId, answer] of Object.entries(dirty)) {
      pending.current.set(questionId, answer)
    }
    writeAttemptDraft(attemptId, dirty)

    const initial =
      Object.keys(dirty).length > 0 ? { ...serverAnswers, ...dirty } : serverAnswers

    answersRef.current = initial
    setAnswers(initial)
    if (detail.status !== 'IN_PROGRESS') {
      closed.current = true
      setSubmitted(detail)
      writeAttemptDraft(attemptId, {})
    } else if (Object.keys(initial).length > 0) {
      setSaveState('saved')
    }
  }, [
    draftsQuery.data,
    draftsQuery.isFetchedAfterMount,
    draftsQuery.isError,
    attemptId,
  ])

  const flush = useCallback(
    (options?: FlushOptions): Promise<void> => {
      if (closed.current || submitting.current) return Promise.resolve()
      if (options?.keepalive) {
        // The page can be torn down at any moment, so an exit save must start
        // right away instead of queueing behind an in-flight autosave. While
        // one exit save is running, a repeated exit event adds no new data.
        if (keepaliveRequest.current) return keepaliveRequest.current
      } else if (savesInFlight.current.length > 0) {
        // Keep saves sequential so the server can never apply an older batch
        // after a newer one.
        return Promise.all(savesInFlight.current)
          .catch(() => {})
          .then(() => {
            if (pending.current.size > 0) return flush(options)
          })
      }
      if (pending.current.size === 0) return Promise.resolve()

      const keepalive = options?.keepalive === true
      const batch = pending.current.snapshot()
      setSaveState('saving')
      const request = saveAttemptAnswers(
        attemptId,
        batch.map(({ questionId, answer }) => ({ questionId, answer })),
        { keepalive },
      )
        .then(() => {
          saveFailures.current = 0
          pending.current.acknowledge(batch)
          // Drop confirmed changes from local storage: only unsynchronized
          // edits may shadow server answers on the next visit.
          persistPendingDraft()
          setSaveState(pending.current.size === 0 ? 'saved' : 'saving')
        })
        .catch((error: unknown) => {
          // One signal after three consecutive failures, not one event per tick.
          saveFailures.current += 1
          if (saveFailures.current === 3) reportError(error, 'autosave')
          // Keep failed changes dirty for the next tick or reconnect.
          setSaveState('error')
          throw error
        })
        .finally(() => {
          savesInFlight.current = savesInFlight.current.filter(
            (item) => item !== request,
          )
          if (keepaliveRequest.current === request) {
            keepaliveRequest.current = null
          }
        })
      savesInFlight.current.push(request)
      if (keepalive) keepaliveRequest.current = request
      return request
    },
    [attemptId, persistPendingDraft],
  )

  // Exit and background callers only reflect the failure in the save state;
  // the hook keeps failed changes queued for the next tick or reconnect.
  const flushQuietly = useCallback(
    (options?: FlushOptions) => {
      flush(options).catch(() => {})
    },
    [flush],
  )

  // Auto-save on page exit / visibility change (closing tab, browser or navigating away)
  // instead of saving on every keystroke/click.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushQuietly({ keepalive: true })
      }
    }
    const handlePageHide = () => {
      flushQuietly({ keepalive: true })
    }
    const handleBeforeUnload = () => {
      flushQuietly({ keepalive: true })
    }
    const handleOnline = () => {
      flushQuietly()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('online', handleOnline)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('online', handleOnline)
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
      flushQuietly({ keepalive: true })
    }
  }, [flushQuietly])

  const updateAnswer = (questionId: string, answer: StudentAnswer) => {
    if (!answersRef.current || submitting.current || closed.current) return
    const next = { ...answersRef.current, [questionId]: answer }
    answersRef.current = next
    pending.current.set(questionId, answer)
    setAnswers(next)

    // Immediate local persistence of the unsynchronized change only, so
    // synced answers can never shadow newer server state after a reload.
    persistPendingDraft()

    // Debounced background sync after 15s of inactivity
    if (debounceTimer.current !== null) {
      window.clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = window.setTimeout(() => {
      debounceTimer.current = null
      flushQuietly()
    }, 15000)
  }

  const saveAndExit = useCallback(
    async (onExit?: () => void) => {
      if (closed.current || submitting.current) {
        onExit?.()
        return
      }
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
      setExitError(null)
      setIsSavingAndExiting(true)
      try {
        // Requests always reject on failure; a failed exit save must keep the
        // student on the page instead of presenting the exit as successful.
        await flush({ keepalive: true })
        await queryClient.invalidateQueries({ queryKey: attemptKeys.listAll })
        await queryClient.invalidateQueries({
          queryKey: attemptKeys.detail(attemptId),
        })
        setSaveState('saved')
        onExit?.()
      } catch (error) {
        // The draft never reached the server: keep the student on the page and
        // surface the failure instead of presenting the exit as successful.
        reportError(error, 'autosave')
        setExitError(getErrorMessage(error))
      } finally {
        setIsSavingAndExiting(false)
      }
    },
    [flush, queryClient, attemptId],
  )

  const submit = useCallback(() => {
    if (submitting.current || closed.current || answersRef.current === null)
      return
    submitting.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    void (async () => {
      try {
        // Wait for autosave so it cannot race final submission.
        await Promise.all([...savesInFlight.current]).catch(() => {})
        const current = answersRef.current ?? {}
        const batch = pending.current.snapshot()
        const result = await submitAttempt(
          attemptId,
          Object.entries(current).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        )
        pending.current.acknowledge(batch)
        closed.current = true
        setSubmitted(result)
        writeAttemptDraft(attemptId, {})
        await invalidateMistakeResults(queryClient, attemptId)
        await queryClient.invalidateQueries({
          queryKey: attemptKeys.detail(attemptId),
        })
      } catch (error) {
        // A response can be lost after the server has committed the result.
        try {
          const detail = await getAttempt(attemptId)
          if (detail.status !== 'IN_PROGRESS') {
            closed.current = true
            setSubmitted(detail)
            writeAttemptDraft(attemptId, {})
            await invalidateMistakeResults(queryClient, attemptId)
            return
          }
        } catch {
          /* Keep local answers and allow retry. */
        }
        setSubmitError(getErrorMessage(error))
      } finally {
        submitting.current = false
        setIsSubmitting(false)
      }
    })()
  }, [attemptId, queryClient])

  return {
    answers,
    saveState,
    submitted,
    submitError,
    exitError,
    isSubmitting,
    isSavingAndExiting,
    saveAndExit,
    flush,
    loadError:
      answers === null && draftsQuery.isError
        ? getErrorMessage(draftsQuery.error)
        : null,
    retryLoad: () => void draftsQuery.refetch(),
    updateAnswer,
    submit,
  }
}

// Shared "Продолжить позже" flow: an optional pre-exit step (for example
// finishing an audio upload), then saving the draft and leaving the attempt.
export function useContinueLater(
  session: { saveAndExit: (onExit?: () => void) => Promise<void> },
  options: {
    fullMockSessionId?: string
    beforeExit?: () => Promise<boolean>
  } = {},
) {
  const navigate = useNavigate()
  const { saveAndExit } = session
  const { fullMockSessionId, beforeExit } = options
  return useCallback(() => {
    void (async () => {
      if (beforeExit) {
        const ok = await beforeExit()
        if (!ok) return
      }
      await saveAndExit(() => {
        // Full Mock sections must return to their session, not to the skill
        // hub: the practice routes would start a different attempt.
        if (fullMockSessionId) {
          void navigate({
            to: '/exam/full-mock-sessions/$sessionId',
            params: { sessionId: fullMockSessionId },
          })
          return
        }
        void navigate({ to: '/' })
      })
    })()
  }, [saveAndExit, beforeExit, fullMockSessionId, navigate])
}
