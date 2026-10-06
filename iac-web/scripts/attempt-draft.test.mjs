import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  attemptDraftKey,
  extractDirtyDraft,
  readAttemptDraft,
  writeAttemptDraft,
} from '../src/features/attempts/attempt-draft.ts'

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  }
}

test('attemptDraftKey keeps the legacy key format', () => {
  assert.equal(attemptDraftKey('abc'), 'iac_attempt_draft_abc')
})

test('write removes storage when the draft is empty', () => {
  const storage = memoryStorage({ iac_attempt_draft_a: '{"q1":{"value":"x"}}' })
  writeAttemptDraft('a', {}, storage)
  assert.equal(storage.getItem('iac_attempt_draft_a'), null)
})

test('write stores the draft json and read restores it', () => {
  const storage = memoryStorage()
  writeAttemptDraft('a', { q1: { value: 'hello' } }, storage)
  assert.deepEqual(readAttemptDraft('a', storage), { q1: { value: 'hello' } })
})

test('read tolerates a missing or corrupted draft', () => {
  assert.deepEqual(readAttemptDraft('a', memoryStorage()), {})
  assert.deepEqual(readAttemptDraft('a', memoryStorage({ iac_attempt_draft_a: '{broken' })), {})
  assert.deepEqual(readAttemptDraft('a', memoryStorage({ iac_attempt_draft_a: '[1,2]' })), {})
  assert.deepEqual(readAttemptDraft('a', memoryStorage({ iac_attempt_draft_a: '{"q1":"scalar"}' })), {})
})

test('entries identical to server answers are not treated as dirty', () => {
  const serverAnswers = {
    q1: { value: 'same' },
    q2: { value: 'server newer' },
  }
  const stored = {
    q1: { value: 'same' },
    q2: { value: 'stale local edit' },
    q3: { optionIds: ['a'] },
  }
  assert.deepEqual(extractDirtyDraft(serverAnswers, stored), {
    q2: { value: 'stale local edit' },
    q3: { optionIds: ['a'] },
  })
})

test('a full legacy snapshot degrades to answers the server lacks', () => {
  const serverAnswers = {
    q1: { value: 'synced' },
    q2: { value: 'changed on another device' },
  }
  const stored = {
    q1: { value: 'synced' },
    q2: { value: 'older value from this device' },
  }
  assert.deepEqual(extractDirtyDraft(serverAnswers, stored), {
    q2: { value: 'older value from this device' },
  })
})

test('extract keeps an empty result when the server already matches', () => {
  const serverAnswers = { q1: { value: 'same' } }
  assert.deepEqual(extractDirtyDraft(serverAnswers, { q1: { value: 'same' } }), {})
})
