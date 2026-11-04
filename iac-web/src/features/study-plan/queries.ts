import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { addDays, daysBetween } from './calendar'
import { authStore, useAuth } from '@/features/auth/auth-store'
import { ApiError, getErrorMessage } from '@/lib/api/client'
import { getStudyPlan, studyPlanKeys } from './api'
import { invalidateStudyPlan } from './cache'
import type { StudyResponse, StudyView } from './api'

export { invalidateStudyPlan } from './cache'

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

function canonicalDate(
  data: StudyResponse | undefined,
  view: StudyView,
  date?: string,
) {
  if (!date) return undefined
  const plan = data?.plan
  if (!plan || view === 'day') return date
  if (view === 'week') {
    const selected =
      data.today > plan.endDate && date > plan.endDate ? plan.endDate : date
    return selected >= plan.startDate && selected <= plan.endDate
      ? addDays(
          plan.startDate,
          Math.floor(daysBetween(plan.startDate, selected) / 7) * 7,
        )
      : date
  }
  const selected =
    data.today > plan.endDate && date > plan.endDate ? plan.startDate : date
  return addDays(
    plan.startDate,
    Math.floor(daysBetween(plan.startDate, selected) / 30) * 30,
  )
}
export function scopedStudyOptions(
  client: QueryClient,
  userId: string | undefined,
  view: StudyView,
  date?: string,
  details = false,
) {
  const known = client
    .getQueriesData<StudyResponse>({ queryKey: studyPlanKeys.user(userId) })
    .map(([, value]) => value)
    .filter((value) => value?.plan)
    .sort((a, b) => (b?.plan?.revision ?? 0) - (a?.plan?.revision ?? 0))[0]
  const canonical = canonicalDate(known, view, date)
  const key = studyPlanKeys.scope(userId, view, canonical, details)
  return {
    queryKey: key,
    staleTime: 30_000,
    retry: false as const,
    retryOnMount: false,
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const result = await getStudyPlan(signal, {
        view,
        date: canonical,
        details,
      })
      if (signal.aborted || authStore.getSnapshot().user?.id !== userId)
        throw new DOMException('Identity changed', 'AbortError')
      const resolved =
        view === 'day'
          ? (result.scope?.date ?? result.today)
          : (result.scope?.startDate ?? canonical)
      const resolvedKey = studyPlanKeys.scope(userId, view, resolved, details)
      if (JSON.stringify(key) !== JSON.stringify(resolvedKey))
        client.setQueryData(resolvedKey, result)
      return result
    },
  }
}
export function useScopedStudyPlan(
  view: StudyView,
  date?: string,
  details = false,
  enabled = true,
) {
  const { user } = useAuth()
  const client = useQueryClient()
  const query = useQuery({
    ...scopedStudyOptions(client, user?.id, view, date, details),
    enabled: !!user && enabled,
    refetchInterval: (q) =>
      !details &&
      q.state.data?.plan?.days.some((day) =>
        day.assignments.some((a) => a.status === 'AWAITING_RESULT'),
      )
        ? 15_000
        : false,
  })
  // Effects run after the selected day has committed. Background errors and
  // fetching status belong to the week cache and never disable day actions.
  useEffect(() => {
    if (
      view !== 'day' ||
      details ||
      !enabled ||
      !user ||
      !query.data?.plan ||
      query.isError
    )
      return
    const selected = date ?? query.data.today
    const options = scopedStudyOptions(client, user.id, 'week', selected)
    if (client.getQueryState(options.queryKey)?.status !== 'error')
      void client.prefetchQuery(options)
  }, [
    client,
    user?.id,
    view,
    date,
    details,
    enabled,
    query.data,
    query.isError,
  ])
  return query
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
      await client.cancelQueries({ queryKey: studyPlanKeys.user(user?.id) })
      const result = await operation()
      if (!current()) return undefined
      await client.cancelQueries({ queryKey: studyPlanKeys.user(user?.id) })
      if ('today' in result && !result.scope)
        client.setQueryData(studyPlanKeys.current(user?.id), result)
      await invalidateStudyPlan(client, user?.id)
      return current() ? result : undefined
    } catch (error) {
      if (
        current() &&
        error instanceof ApiError &&
        (error.status === 409 || error.status === 404)
      ) {
        await invalidateStudyPlan(client, user?.id)
      }
      throw error
    } finally {
      lock.current = false
    }
  }
}
