import { useEffect, useState } from 'react'
import { authStore } from '@/features/auth/auth-store'
import { DraftBuffer } from '@/features/attempts/draft-buffer'

export type AnswerDraft = {
  text: string
  explanation: string
  assisted: boolean | null
  audioAttemptId: string
  key: string
}
const blank = (): AnswerDraft => ({
  text: '',
  explanation: '',
  assisted: null,
  audioAttemptId: '',
  key: crypto.randomUUID(),
})
// Components using this hook must be keyed by user + cycle/session identity.
// Storage is local to this account and entity; no shared anonymous draft exists.
export function useLearningDraft(userId: string, entity: string) {
  const storageKey = `iac-learning:v1:${encodeURIComponent(userId)}:${encodeURIComponent(entity)}`
  const [buffer] = useState(() => new DraftBuffer<AnswerDraft>())
  const [draft, setDraft] = useState<AnswerDraft>(() => {
    try {
      const parsed: unknown = JSON.parse(
        localStorage.getItem(storageKey) ?? 'null',
      )
      if (
        parsed &&
        typeof parsed === 'object' &&
        'text' in parsed &&
        typeof parsed.text === 'string' &&
        'explanation' in parsed &&
        typeof parsed.explanation === 'string' &&
        'assisted' in parsed &&
        (parsed.assisted === null || typeof parsed.assisted === 'boolean') &&
        'key' in parsed &&
        typeof parsed.key === 'string' &&
        parsed.key.length <= 100
      ) {
        return {
          text: parsed.text,
          explanation: parsed.explanation,
          assisted: parsed.assisted,
          key: parsed.key,
          audioAttemptId:
            'audioAttemptId' in parsed &&
            typeof parsed.audioAttemptId === 'string'
              ? parsed.audioAttemptId
              : '',
        }
      }
    } catch {
      /* Storage may be unavailable; keep an in-memory draft. */
    }
    return blank()
  })
  useEffect(() => {
    if (authStore.getSnapshot().user?.id !== userId) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft))
    } catch {
      /* Memory draft remains available. */
    }
  }, [draft, storageKey, userId])
  function edit(patch: Partial<Omit<AnswerDraft, 'key'>>) {
    if (authStore.getSnapshot().user?.id !== userId) return
    const next = { ...draft, ...patch, key: crypto.randomUUID() }
    buffer.set(entity, next)
    setDraft(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      /* Keep memory draft. */
    }
  }
  function clear() {
    if (authStore.getSnapshot().user?.id !== userId) return
    buffer.acknowledge(buffer.snapshot())
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* No persistent draft. */
    }
    setDraft(blank())
  }
  return { draft, edit, clear }
}
