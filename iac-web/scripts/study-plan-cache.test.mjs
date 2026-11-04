import assert from 'node:assert/strict'
import { test } from 'node:test'
import { QueryClient, isCancelledError } from '@tanstack/react-query'
import {
  studyPlanKeys,
  invalidateStudyPlan,
} from '../src/features/study-plan/cache.ts'
import { invalidateMistakeResults } from '../src/features/attempts/mistake-cache.ts'

test('study writes invalidate all scopes and details for only their user', async (t) => {
  const client = new QueryClient()
  t.after(() => client.clear())
  const keys = [
    studyPlanKeys.current('A'),
    studyPlanKeys.scope('A', 'day', '2026-10-24'),
    studyPlanKeys.scope('A', 'week', '2026-10-22'),
    studyPlanKeys.scope('A', 'month', '2026-10-22'),
    studyPlanKeys.scope('A', 'day', '2026-10-24', true),
  ]
  for (const key of keys) client.setQueryData(key, { revision: 1 })
  const other = studyPlanKeys.scope('B', 'day', '2026-10-24')
  client.setQueryData(other, { revision: 9 })
  await invalidateStudyPlan(client, 'A')
  for (const key of keys)
    assert.equal(client.getQueryState(key).isInvalidated, true)
  assert.equal(client.getQueryState(other).isInvalidated, false)
  assert.deepEqual(client.getQueryData(other), { revision: 9 })
})

test('a late prefetch cannot overwrite a newer revision after a write', async (t) => {
  const client = new QueryClient()
  t.after(() => client.clear())
  const key = studyPlanKeys.scope('A', 'week', '2026-10-22')
  let release
  const blocked = new Promise((resolve) => {
    release = resolve
  })
  let signal
  const old = client
    .fetchQuery({
      queryKey: key,
      queryFn: (context) => {
        signal = context.signal
        return blocked
      },
    })
    .catch((error) => error)
  await invalidateStudyPlan(client, 'A')
  assert.equal(signal.aborted, true)
  client.setQueryData(key, { revision: 2 })
  release({ revision: 1 })
  assert.equal(isCancelledError(await old), true)
  assert.deepEqual(client.getQueryData(key), { revision: 2 })
})

test('attempt submit and completed grading invalidate calendar projections too', async (t) => {
  const client = new QueryClient()
  t.after(() => client.clear())
  const keys = ['day', 'week', 'month'].map((view) =>
    studyPlanKeys.scope('A', view, '2026-10-22'),
  )
  for (const key of keys) client.setQueryData(key, { revision: 1 })
  await invalidateMistakeResults(client, 'attempt')
  for (const key of keys)
    assert.equal(client.getQueryState(key).isInvalidated, true)
})
