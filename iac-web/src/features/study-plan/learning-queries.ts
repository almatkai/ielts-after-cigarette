import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { authStore, useAuth } from '@/features/auth/auth-store'
import { ApiError, getErrorMessage } from '@/lib/api/client'
import { studyPlanKeys } from './api'
import {
  getLearning,
  getLearningCycle,
  getLearningSession,
} from './learning-api'

export const learningKeys = {
  all: (userId?: string) =>
    ['academic-learning', userId ?? 'signed-out'] as const,
  current: (userId?: string) =>
    [...learningKeys.all(userId), 'current'] as const,
  cycle: (userId: string | undefined, id: string) =>
    [...learningKeys.all(userId), 'cycle', id] as const,
  session: (userId: string | undefined, id: string) =>
    [...learningKeys.all(userId), 'session', id] as const,
}
export async function identityResult<T>(
  userId: string | undefined,
  operation: Promise<T>,
) {
  const data = await operation
  if (!userId || authStore.getSnapshot().user?.id !== userId)
    throw new DOMException('Identity changed', 'AbortError')
  return data
}
const retry = (count: number, error: unknown) =>
  count < 1 &&
  (!(error instanceof ApiError) || error.status >= 500) &&
  !(error instanceof DOMException)
export function useLearning() {
  const { user } = useAuth()
  return useQuery({
    queryKey: learningKeys.current(user?.id),
    enabled: !!user,
    queryFn: ({ signal }) => identityResult(user?.id, getLearning(signal)),
    retry,
    staleTime: 0,
  })
}
export function useLearningCycle(id: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: learningKeys.cycle(user?.id, id),
    enabled: !!user && !!id,
    queryFn: ({ signal }) =>
      identityResult(user?.id, getLearningCycle(id, signal)),
    retry,
    staleTime: 0,
  })
}
export function useLearningSession(id?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: learningKeys.session(user?.id, id ?? ''),
    enabled: !!user && !!id,
    queryFn: ({ signal }) =>
      identityResult(user?.id, getLearningSession(id!, signal)),
    retry,
    staleTime: 0,
  })
}
export function learningError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404)
      return 'Цикл или тренировка не найдены либо принадлежат другому аккаунту.'
    if (error.status === 409)
      return 'Данные изменились на другом устройстве. Мы обновили страницу — проверьте и повторите. Введённый ответ сохранён.'
    if (error.status === 401) return 'Сессия истекла. Войдите снова.'
  }
  return getErrorMessage(error)
}
export function useLearningWriter() {
  const { user } = useAuth()
  const client = useQueryClient()
  const lock = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const current = () => !!user && authStore.getSnapshot().user?.id === user.id
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: learningKeys.all(user?.id) }),
      client.invalidateQueries({
        queryKey: studyPlanKeys.current(user?.id),
        exact: true,
      }),
    ])
  async function run<T>(operation: () => Promise<T>): Promise<T | undefined> {
    if (lock.current || !current()) return undefined
    lock.current = true
    setPending(true)
    setError(null)
    try {
      const result = await operation()
      if (!current()) return undefined
      await refresh()
      return current() ? result : undefined
    } catch (err) {
      if (current()) {
        if (err instanceof ApiError && [409, 404].includes(err.status))
          await refresh()
        if (current()) setError(err)
      }
      return undefined
    } finally {
      lock.current = false
      if (current()) setPending(false)
    }
  }
  return { run, pending, error }
}
