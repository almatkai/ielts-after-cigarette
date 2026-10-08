import { useEffect, useState } from 'react'
import type { Attempt } from '@/features/attempts/api'

// Real attempts retain their deadline across reloads. Preview timers live only
// in memory and can never overwrite a student's persisted deadline.
export function useExamTimer({
  attempt,
  storagePrefix,
  durationSeconds,
  ready,
  enabled = true,
  finished = false,
}: {
  attempt?: Pick<Attempt, 'id' | 'startedAt'>
  storagePrefix: string
  durationSeconds: number
  ready: boolean
  enabled?: boolean
  finished?: boolean
}) {
  const storageKey = attempt ? `${storagePrefix}${attempt.id}` : null
  const remainingKey = attempt
    ? `${storagePrefix}${attempt.id}_remaining`
    : null

  const [deadline, setDeadline] = useState<number | null>(() => {
    if (!enabled || !attempt || !storageKey || typeof window === 'undefined')
      return null
    const savedRemaining = remainingKey
      ? Number(localStorage.getItem(remainingKey))
      : null
    if (
      typeof savedRemaining === 'number' &&
      Number.isFinite(savedRemaining) &&
      savedRemaining > 0
    ) {
      return Date.now() + savedRemaining * 1000
    }
    const saved = Number(localStorage.getItem(storageKey))
    if (Number.isFinite(saved) && saved > 0) return saved
    const startedAt = new Date(attempt.startedAt).getTime()
    return Date.now() - startedAt > 2 * 60_000
      ? startedAt + durationSeconds * 1000
      : null
  })
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)

  useEffect(() => {
    if (!enabled) {
      setDeadline(null)
      return
    }
    if (ready && deadline === null && !finished) {
      const next = Date.now() + durationSeconds * 1000
      setDeadline(next)
      if (storageKey) localStorage.setItem(storageKey, String(next))
    }
  }, [enabled, ready, deadline, finished, durationSeconds, storageKey])

  useEffect(() => {
    if (finished) {
      if (storageKey) localStorage.removeItem(storageKey)
      if (remainingKey) localStorage.removeItem(remainingKey)
    }
  }, [finished, storageKey, remainingKey])

  useEffect(() => {
    if (!enabled || !remainingKey || finished || secondsLeft <= 0) return
    localStorage.setItem(remainingKey, String(secondsLeft))
  }, [enabled, remainingKey, finished, secondsLeft])

  useEffect(() => {
    if (!enabled || !remainingKey || finished) return
    const saveRemaining = () => {
      if (secondsLeft > 0) {
        localStorage.setItem(remainingKey, String(secondsLeft))
      }
    }
    window.addEventListener('pagehide', saveRemaining)
    return () => {
      saveRemaining()
      window.removeEventListener('pagehide', saveRemaining)
    }
  }, [enabled, remainingKey, finished, secondsLeft])

  useEffect(() => {
    if (!enabled || deadline === null) {
      setSecondsLeft(durationSeconds)
      return
    }
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [enabled, deadline, durationSeconds])

  return { deadline, secondsLeft }
}
