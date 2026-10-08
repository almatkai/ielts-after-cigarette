import { useSyncExternalStore } from 'react'

import { useAuth } from '@/features/auth/auth-store'

const changeEvent = 'iac-mistake-reviewed'
const memoryFallback = new Set<string>()

function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(changeEvent, listener)
    window.removeEventListener('storage', listener)
  }
}

function readReviewed(key: string | null) {
  if (!key) return false
  try {
    return localStorage.getItem(key) === '1' || memoryFallback.has(key)
  } catch {
    return memoryFallback.has(key)
  }
}

// Review progress belongs to this browser, user and attempt. It never changes
// the submitted answer or exam score.
export function useMistakeReviewStatus(
  attemptId: string | undefined,
  questionId: string,
) {
  const { user } = useAuth()
  const key = attemptId
    ? `iac_mistake_review_${JSON.stringify([user?.id ?? 'guest', attemptId, questionId])}`
    : null
  const reviewed = useSyncExternalStore(
    subscribe,
    () => readReviewed(key),
    () => false,
  )
  const markReviewed = () => {
    if (!key) return
    try {
      localStorage.setItem(key, '1')
    } catch {
      // Keep feedback usable when private mode or storage limits prevent saving.
      memoryFallback.add(key)
    }
    window.dispatchEvent(new Event(changeEvent))
  }
  return { reviewed, markReviewed }
}
