import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  attemptKeys,
  getAttempt,
  saveAttemptAnswers,
  submitAttempt,
} from '@/features/attempts/api'
import type { Attempt, StudentAnswer } from '@/features/attempts/api'
import { DraftBuffer } from '@/features/attempts/draft-buffer'
import { getErrorMessage } from '@/lib/api/client'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function useAttemptSession(attemptId: string) {
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<string, StudentAnswer> | null>(
    null,
  )
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [submitted, setSubmitted] = useState<Attempt | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const answersRef = useRef<Record<string, StudentAnswer> | null>(null)
  const pending = useRef(new DraftBuffer<StudentAnswer>())
  const saving = useRef<Promise<void> | null>(null)
  const submitting = useRef(false)
  const closed = useRef(false)

  const draftsQuery = useQuery({
    queryKey: attemptKeys.detail(attemptId),
    queryFn: ({ signal }) => getAttempt(attemptId, signal),
    staleTime: 0,
    refetchOnMount: 'always',
  })

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
    const initial = Object.fromEntries(
      (detail.answers ?? []).map((item) => [item.questionId, item.answer]),
    )
    answersRef.current = initial
    setAnswers(initial)
    if (detail.status !== 'IN_PROGRESS') {
      closed.current = true
      setSubmitted(detail)
    }
  }, [draftsQuery.data, draftsQuery.isFetchedAfterMount, draftsQuery.isError])

  const flush = useCallback(() => {
    if (saving.current) return saving.current
    if (closed.current || submitting.current || pending.current.size === 0)
      return Promise.resolve()
    const batch = pending.current.snapshot()
    setSaveState('saving')
    const request = saveAttemptAnswers(
      attemptId,
      batch.map(({ questionId, answer }) => ({ questionId, answer })),
    )
      .then(() => {
        pending.current.acknowledge(batch)
        setSaveState(pending.current.size === 0 ? 'saved' : 'saving')
      })
      .catch(() => {
        // Keep failed changes dirty for the next tick or reconnect.
        setSaveState('error')
      })
      .finally(() => {
        saving.current = null
      })
    saving.current = request
    return request
  }, [attemptId])

  useEffect(() => {
    const timer = window.setInterval(() => void flush(), 2000)
    const retry = () => {
      void flush()
    }
    window.addEventListener('online', retry)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('online', retry)
      void flush()
    }
  }, [flush])

  const updateAnswer = (questionId: string, answer: StudentAnswer) => {
    if (!answersRef.current || submitting.current || closed.current) return
    const next = { ...answersRef.current, [questionId]: answer }
    answersRef.current = next
    pending.current.set(questionId, answer)
    setAnswers(next)
    setSaveState('saving')
  }

  const submit = useCallback(() => {
    if (submitting.current || closed.current || answersRef.current === null)
      return
    submitting.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    void (async () => {
      try {
        // Wait for autosave so it cannot race final submission.
        await saving.current
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
    isSubmitting,
    loadError:
      answers === null && draftsQuery.isError
        ? getErrorMessage(draftsQuery.error)
        : null,
    retryLoad: () => void draftsQuery.refetch(),
    updateAnswer,
    submit,
  }
}
