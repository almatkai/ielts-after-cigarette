import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { authStore, useAuth } from '@/features/auth/auth-store'
import { ApiError, getErrorMessage } from '@/lib/api/client'
import { getStudyPlan, studyPlanKeys } from './api'
import type { StudyResponse } from './api'

export function useStudyPlan() {
  const { user } = useAuth()
  return useQuery({
    queryKey: studyPlanKeys.current(user?.id),
    enabled: Boolean(user),
    staleTime: 0,
    queryFn: ({ signal }) => getStudyPlan(signal),
    retry: (count, error) =>
      count < 1 && (!(error instanceof ApiError) || error.status >= 500),
    refetchInterval: (query) =>
      query.state.data?.plan?.days.some((day) =>
        day.assignments.some((a) => a.status === 'AWAITING_RESULT'),
      )
        ? 15_000
        : false,
  })
}

export function studyError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Сессия истекла. Войдите снова.'
    if (error.status === 404)
      return 'План или задание больше недоступны. Обновите план.'
    if (error.status === 409)
      return 'План изменился. Данные обновлены; проверьте их и повторите действие.'
  }
  return getErrorMessage(error)
}

// A synchronous lock also protects clicks before React commits the disabled state.
// Identity checks prevent an old mutation from repopulating a newly signed-in user's cache.
export function useStudyWriter() {
  const { user } = useAuth()
  const client = useQueryClient()
  const lock = useRef(false)
  const current = () =>
    Boolean(user && authStore.getSnapshot().user?.id === user.id)
  return async function write<T extends StudyResponse | { target: string }>(
    operation: () => Promise<T>,
  ) {
    if (lock.current || !current()) return undefined
    lock.current = true
    try {
      const result = await operation()
      if (!current()) return undefined
      if ('today' in result)
        client.setQueryData(studyPlanKeys.current(user?.id), result)
      else
        await client.invalidateQueries({
          queryKey: studyPlanKeys.current(user?.id),
          exact: true,
        })
      return current() ? result : undefined
    } catch (error) {
      if (
        current() &&
        error instanceof ApiError &&
        (error.status === 409 || error.status === 404)
      ) {
        await client.invalidateQueries({
          queryKey: studyPlanKeys.current(user?.id),
          exact: true,
        })
      }
      throw error
    } finally {
      lock.current = false
    }
  }
}
