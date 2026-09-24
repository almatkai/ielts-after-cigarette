import assert from 'node:assert/strict'
import { test } from 'node:test'
import { QueryClient } from '@tanstack/react-query'
import { clearCacheOnUserChange } from '../src/features/auth/query-cache.ts'

test('logout removes another student’s infinite query cache', () => {
  const client = new QueryClient()
  let user = { id: 'student-a' }
  let notify
  const unsubscribe = clearCacheOnUserChange(client, {
    getSnapshot: () => ({ user }),
    subscribe: (listener) => {
      notify = listener
      return () => {}
    },
  })
  const key = ['reading', 'material', 'attempt']
  client.setQueryDefaults(key, { staleTime: Infinity, gcTime: Infinity })
  client.setQueryData(key, { answers: ['private answer'] })
  notify() // A token refresh for the same student should preserve the cache.
  assert.ok(client.getQueryData(key))
  user = null
  notify()
  assert.equal(client.getQueryData(key), undefined)
  user = { id: 'student-b' }
  notify()
  assert.equal(client.getQueryData(key), undefined)
  unsubscribe()
  client.clear()
})

test('identity change cancels a pending request from the previous student', async () => {
  const client = new QueryClient()
  let user = { id: 'student-a' }
  let notify
  clearCacheOnUserChange(client, {
    getSnapshot: () => ({ user }),
    subscribe: (listener) => {
      notify = listener
      return () => {}
    },
  })
  let resolve
  let signal
  const result = client
    .fetchQuery({
      queryKey: ['private'],
      queryFn: (context) => {
        signal = context.signal
        return new Promise((done) => {
          resolve = done
        })
      },
    })
    .catch(() => null)
  user = { id: 'student-b' }
  notify()
  assert.equal(signal.aborted, true)
  resolve('student-a data')
  await result
  assert.equal(client.getQueryData(['private']), undefined)
  client.clear()
})
