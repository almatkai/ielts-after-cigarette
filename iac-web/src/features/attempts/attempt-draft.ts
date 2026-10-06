import type { StudentAnswer } from '@/features/attempts/api'

// The draft keeps only changes that have not been confirmed by the server yet.
// A full answer snapshot would shadow newer server state after a reload and
// could overwrite answers saved from another device.
export type AttemptDraft = Record<string, StudentAnswer>

export const attemptDraftKey = (attemptId: string) =>
  `iac_attempt_draft_${attemptId}`

type DraftStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export function readAttemptDraft(
  attemptId: string,
  storage: DraftStorage = globalThis.localStorage,
): AttemptDraft {
  try {
    const raw = storage.getItem(attemptDraftKey(attemptId))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    const draft: AttemptDraft = {}
    for (const [questionId, answer] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (answer !== null && typeof answer === 'object') {
        draft[questionId] = answer as StudentAnswer
      }
    }
    return draft
  } catch {
    // A corrupted draft must never block loading the server state.
    return {}
  }
}

export function writeAttemptDraft(
  attemptId: string,
  draft: AttemptDraft,
  storage: DraftStorage = globalThis.localStorage,
): void {
  try {
    if (Object.keys(draft).length === 0) {
      storage.removeItem(attemptDraftKey(attemptId))
      return
    }
    storage.setItem(attemptDraftKey(attemptId), JSON.stringify(draft))
  } catch {
    // Storage may be unavailable (private mode, quota); autosave still works.
  }
}

// Only unsynchronized changes may shadow server answers: entries the server
// already returns are treated as synced, so a draft saved from another device
// is never overwritten by a stale local snapshot.
export function extractDirtyDraft(
  serverAnswers: Record<string, StudentAnswer>,
  stored: AttemptDraft,
): AttemptDraft {
  const dirty: AttemptDraft = {}
  for (const [questionId, answer] of Object.entries(stored)) {
    if (questionId in serverAnswers) {
      // Identical values are already on the server and must not shadow
      // newer server state on the next visit.
      const server = serverAnswers[questionId]
      if (JSON.stringify(server) === JSON.stringify(answer)) continue
    }
    dirty[questionId] = answer
  }
  return dirty
}
