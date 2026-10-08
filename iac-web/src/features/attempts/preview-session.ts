import { useState } from 'react'
import type { StudentAnswer } from '@/features/attempts/api'
import type { useAttemptSession } from '@/features/attempts/attempt-session'

export type AttemptSession = ReturnType<typeof useAttemptSession>

// Deliberately independent of attempt APIs, query caches and localStorage.
// The real runner consumes this adapter exactly as it consumes a live session.
export function usePreviewSession(): AttemptSession {
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({})
  return {
    answers,
    saveState: 'idle',
    submitted: null,
    submitError: null,
    exitError: null,
    isSubmitting: false,
    loadError: null,
    isSavingAndExiting: false,
    saveAndExit: async (onExit) => {
      await onExit?.()
    },
    flush: () => Promise.resolve(),
    retryLoad: () => {},
    updateAnswer: (questionId, answer) =>
      setAnswers((current) => ({ ...current, [questionId]: answer })),
    submit: () => {},
  }
}
