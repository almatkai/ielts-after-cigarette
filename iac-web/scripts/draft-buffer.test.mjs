import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DraftBuffer } from '../src/features/attempts/draft-buffer.ts'

test('failed save remains queued alongside later answers', () => {
  const buffer = new DraftBuffer()
  buffer.set('q1', { value: 'first' })
  buffer.snapshot() // Request fails: no acknowledgement.
  buffer.set('q2', { value: 'second' })
  assert.deepEqual(
    buffer.snapshot().map((x) => x.questionId),
    ['q1', 'q2'],
  )
  buffer.acknowledge(buffer.snapshot())
  assert.equal(buffer.size, 0)
})

test('an older response cannot mark a newer edit as saved', () => {
  const buffer = new DraftBuffer()
  buffer.set('q1', { value: 'old' })
  const request = buffer.snapshot()
  buffer.set('q1', { value: 'new' })
  buffer.acknowledge(request)
  assert.equal(buffer.size, 1)
  assert.deepEqual(buffer.snapshot()[0].answer, { value: 'new' })
})
