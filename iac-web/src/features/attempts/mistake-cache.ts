import type { QueryClient } from '@tanstack/react-query'

import type { Language } from '@/lib/i18n'
import type { AttemptMaterialType } from './api'

// Same key as LANGUAGE_STORAGE_KEY in lib/i18n (inlined: node regression
// tests resolve this module without the @ alias or React).
function storedLanguage(): Language {
  if (typeof window === 'undefined') return 'ru'
  const stored = window.localStorage.getItem('daiyndyq-language')
  return stored === 'kk' || stored === 'en' ? stored : 'ru'
}

export const mistakeKeys = {
  all: ['attempts', 'mistakes'] as const,
  lists: ['attempts', 'mistakes', 'list'] as const,
  list: (skill: AttemptMaterialType, page: number, language?: Language) =>
    [
      'attempts',
      'mistakes',
      'list',
      skill,
      page,
      language ?? storedLanguage(),
    ] as const,
  detail: (id: string, language?: Language) =>
    [
      'attempts',
      'mistakes',
      'detail',
      id,
      language ?? storedLanguage(),
    ] as const,
}

// In-memory, per signed-in session. Keep inactive pages/results for an hour
// instead of Query's default five minutes; auth changes clear the whole cache.
export const mistakeListCache = {
  staleTime: 5 * 60_000,
  gcTime: 60 * 60_000,
}

// Submitted attempts use pinned material versions and immutable evaluations.
export const mistakeDetailCache = {
  staleTime: 60 * 60_000,
  gcTime: 60 * 60_000,
}

export function invalidateMistakeResults(
  client: QueryClient,
  attemptId: string,
) {
  return Promise.all([
    client.invalidateQueries({ queryKey: mistakeKeys.lists }),
    client.invalidateQueries({ queryKey: ['attempts', 'list'] }),
    client.invalidateQueries({ queryKey: ['dashboard'] }),
    client.invalidateQueries({ queryKey: mistakeKeys.detail(attemptId) }),
  ])
}

// AI grading finishes after submit. Observing PROCESSING -> SUBMITTED in any
// attempt screen must refresh cached bank pages too, not wait for their TTL.
export function watchMistakeResults(client: QueryClient) {
  const statuses = new Map<string, string>()
  return client.getQueryCache().subscribe((event) => {
    const key = event.query.queryKey
    if (key.length !== 2 || key[0] !== 'attempts' || typeof key[1] !== 'string')
      return
    if (event.type === 'removed') {
      statuses.delete(event.query.queryHash)
      return
    }
    if (event.type !== 'updated' || event.action.type !== 'success') return
    const data: unknown = event.query.state.data
    if (
      typeof data !== 'object' ||
      data === null ||
      !('status' in data) ||
      typeof data.status !== 'string' ||
      !('id' in data) ||
      data.id !== key[1]
    )
      return
    const previous = statuses.get(event.query.queryHash)
    statuses.set(event.query.queryHash, data.status)
    if (
      (previous === 'IN_PROGRESS' || previous === 'PROCESSING') &&
      data.status === 'SUBMITTED'
    ) {
      void invalidateMistakeResults(client, key[1])
    }
  })
}
