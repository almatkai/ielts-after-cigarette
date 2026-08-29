import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  attemptKeys,
  getAttempt,
  saveAttemptAnswers,
  submitAttempt,
} from '@/features/attempts/api'
import type {
  Attempt,
  AttemptAnswer,
  StudentAnswer,
} from '@/features/attempts/api'
import { getErrorMessage } from '@/lib/api/client'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY_MS = 2000

// Общая логика студенческой попытки (listening и reading): подстановка
// сохранённых черновиков, автосохранение изменённых ответов с debounce и
// submit с финальными ответами.
export function useAttemptSession(attemptId: string) {
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<
    string,
    StudentAnswer
  > | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [submitted, setSubmitted] = useState<Attempt | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const answersRef = useRef<Record<string, StudentAnswer> | null>(null)
  const dirtyRef = useRef(new Set<string>())

  const draftsQuery = useQuery({
    queryKey: attemptKeys.detail(attemptId),
    queryFn: ({ signal }) => getAttempt(attemptId, signal),
  })

  // Подставляем сохранённые черновики возобновлённой попытки.
  useEffect(() => {
    if (answers !== null) return
    if (draftsQuery.data) {
      const initial: Record<string, StudentAnswer> = {}
      for (const item of draftsQuery.data.answers ?? []) {
        initial[item.questionId] = item.answer
      }
      setAnswers(initial)
    } else if (draftsQuery.isError) {
      setAnswers({})
    }
  }, [answers, draftsQuery.data, draftsQuery.isError])

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  const saveMutation = useMutation({
    mutationFn: (payload: AttemptAnswer[]) =>
      saveAttemptAnswers(attemptId, payload),
    onSuccess: () => setSaveState('saved'),
    onError: () => setSaveState('error'),
  })
  const saveRef = useRef(saveMutation.mutate)
  useEffect(() => {
    saveRef.current = saveMutation.mutate
  }, [saveMutation.mutate])

  const submitMutation = useMutation({
    mutationFn: (payload: AttemptAnswer[]) => submitAttempt(attemptId, payload),
    onSuccess: (result) => {
      setSubmitError(null)
      setSubmitted(result)
      void queryClient.invalidateQueries({
        queryKey: attemptKeys.detail(attemptId),
      })
    },
    onError: (error) => setSubmitError(getErrorMessage(error)),
  })
  const submitRef = useRef<() => void>(() => {})
  useEffect(() => {
    submitRef.current = () => {
      if (submitMutation.isPending) return
      const current = answersRef.current ?? {}
      submitMutation.mutate(
        Object.entries(current).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      )
    }
  })

  // Автосохранение изменённых ответов с debounce.
  useEffect(() => {
    if (!answers || submitted || dirtyRef.current.size === 0) return
    const timeout = window.setTimeout(() => {
      const ids = Array.from(dirtyRef.current)
      dirtyRef.current.clear()
      const current = answersRef.current ?? {}
      const payload = ids.map((id) => ({ questionId: id, answer: current[id] }))
      if (payload.length > 0) saveRef.current(payload)
    }, AUTOSAVE_DELAY_MS)
    return () => window.clearTimeout(timeout)
  }, [answers, submitted])

  const updateAnswer = (questionId: string, answer: StudentAnswer) => {
    setAnswers((current) =>
      current ? { ...current, [questionId]: answer } : current,
    )
    dirtyRef.current.add(questionId)
    setSaveState('saving')
  }

  const submit = useCallback(() => submitRef.current(), [])

  return {
    answers,
    saveState,
    submitted,
    submitError,
    isSubmitting: submitMutation.isPending,
    updateAnswer,
    submit,
  }
}
