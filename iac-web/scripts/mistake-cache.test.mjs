import assert from 'node:assert/strict'
import { test } from 'node:test'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import {
  mistakeKeys,
  mistakeListCache,
  mistakeDetailCache,
  invalidateMistakeResults,
  watchMistakeResults,
} from '../src/features/attempts/mistake-cache.ts'
import { clearCacheOnUserChange } from '../src/features/auth/query-cache.ts'

function clientFor(t) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  t.after(() => client.clear())
  return client
}

function listOptions(skill, page, load) {
  return {
    queryKey: mistakeKeys.list(skill, page),
    queryFn: load,
    ...mistakeListCache,
  }
}

function detailOptions(id, load) {
  return {
    queryKey: mistakeKeys.detail(id),
    queryFn: load,
    ...mistakeDetailCache,
  }
}

test('returning to visited pages, skills and results reuses cached responses', async (t) => {
  const client = clientFor(t)
  const calls = []
  const makePage = (skill, page) =>
    listOptions(skill, page, async () => {
      calls.push(`${skill}-${page}`)
      return { items: [`${skill}-${page}`], page, hasNext: true }
    })
  const reading1 = makePage('reading', 1)
  const reading2 = makePage('reading', 2)
  const listening1 = makePage('listening', 1)
  const detail = detailOptions('attempt-a', async () => {
    calls.push('detail-a')
    return { review: ['mistake'], contexts: ['passage'] }
  })
  for (const options of [
    reading1,
    reading2,
    listening1,
    reading1,
    detail,
    reading2,
    detail,
  ]) {
    await client.fetchQuery(options)
  }
  assert.deepEqual(calls, ['reading-1', 'reading-2', 'listening-1', 'detail-a'])
  assert.equal(
    client.getQueryCache().find({ queryKey: reading1.queryKey }).gcTime,
    60 * 60_000,
  )
  assert.equal(
    client.getQueryCache().find({ queryKey: detail.queryKey }).gcTime,
    60 * 60_000,
  )
  // A new screen mounts without refetching a fresh cached page.
  const observer = new QueryObserver(client, reading1)
  const unsubscribe = observer.subscribe(() => {})
  assert.equal(observer.getCurrentResult().isFetching, false)
  assert.deepEqual(observer.getCurrentResult().data.items, ['reading-1'])
  unsubscribe()
})

test('expired pages refresh while completed results remain fresh longer', async (t) => {
  const client = clientFor(t)
  let pages = 0
  let results = 0
  const page = listOptions('reading', 1, async () => ++pages)
  const detail = detailOptions('attempt-a', async () => ++results)
  await client.fetchQuery(page)
  await client.fetchQuery(detail)
  const old = Date.now() - mistakeListCache.staleTime - 1000
  client.setQueryData(page.queryKey, 1, { updatedAt: old })
  client.setQueryData(detail.queryKey, 1, { updatedAt: old })
  assert.equal(await client.fetchQuery(page), 2)
  assert.equal(await client.fetchQuery(detail), 1)
  client.setQueryData(detail.queryKey, 1, {
    updatedAt: Date.now() - mistakeDetailCache.staleTime - 1000,
  })
  assert.equal(await client.fetchQuery(detail), 2)
})

test('new results invalidate every skill/page but not unrelated completed results', async (t) => {
  const client = clientFor(t)
  const pages = [
    mistakeKeys.list('reading', 1),
    mistakeKeys.list('reading', 2),
    mistakeKeys.list('speaking', 1),
  ]
  for (const key of pages) client.setQueryData(key, { items: [] })
  client.setQueryData(mistakeKeys.detail('new'), { review: [] })
  client.setQueryData(mistakeKeys.detail('old'), { review: ['old'] })
  await invalidateMistakeResults(client, 'new')
  for (const key of [...pages, mistakeKeys.detail('new')]) {
    assert.equal(client.getQueryState(key).isInvalidated, true)
  }
  assert.equal(
    client.getQueryState(mistakeKeys.detail('old')).isInvalidated,
    false,
  )
  assert.deepEqual(client.getQueryData(mistakeKeys.detail('old')).review, [
    'old',
  ])
})

test('async AI completion invalidates bank pages once, historical reads do not', (t) => {
  const client = clientFor(t)
  const stop = watchMistakeResults(client)
  t.after(stop)
  const key = mistakeKeys.list('writing', 1)
  client.setQueryData(key, { items: [] })
  client.setQueryData(['attempts', 'historical'], {
    id: 'historical',
    status: 'SUBMITTED',
  })
  assert.equal(client.getQueryState(key).isInvalidated, false)
  client.setQueryData(['attempts', 'new'], { id: 'new', status: 'PROCESSING' })
  assert.equal(client.getQueryState(key).isInvalidated, false)
  client.setQueryData(['attempts', 'new'], { id: 'new', status: 'SUBMITTED' })
  assert.equal(client.getQueryState(key).isInvalidated, true)
  client.setQueryData(key, { items: ['new'] })
  client.setQueryData(['attempts', 'new'], { id: 'new', status: 'SUBMITTED' })
  assert.equal(client.getQueryState(key).isInvalidated, false)
})

test('logout clears all cached bank pages/results and completion tracking', (t) => {
  const client = clientFor(t)
  const stop = watchMistakeResults(client)
  t.after(stop)
  let user = { id: 'student-a' }
  let notify
  const unsubscribe = clearCacheOnUserChange(client, {
    getSnapshot: () => ({ user }),
    subscribe: (listener) => {
      notify = listener
      return () => {}
    },
  })
  t.after(unsubscribe)
  client.setQueryData(mistakeKeys.list('reading', 1), { items: ['private'] })
  client.setQueryData(mistakeKeys.detail('private'), {
    contexts: ['private passage'],
  })
  client.setQueryData(['attempts', 'private'], {
    id: 'private',
    status: 'PROCESSING',
  })
  user = null
  notify()
  assert.equal(client.getQueryCache().getAll().length, 0)
  user = { id: 'student-b' }
  notify()
  const key = mistakeKeys.list('reading', 1)
  client.setQueryData(key, { items: ['own attempt'] })
  client.setQueryData(['attempts', 'private'], {
    id: 'private',
    status: 'SUBMITTED',
  })
  assert.equal(client.getQueryState(key).isInvalidated, false)
})

test('manual refresh invalidates cached responses without discarding visible data', async (t) => {
  const client = clientFor(t)
  const key = mistakeKeys.list('reading', 1)
  const data = { items: ['saved attempt'] }
  client.setQueryData(key, data)
  client.setQueryData(mistakeKeys.detail('attempt-a'), {
    review: ['saved mistake'],
  })
  await client.invalidateQueries({ queryKey: mistakeKeys.all })
  assert.equal(client.getQueryState(key).isInvalidated, true)
  assert.deepEqual(client.getQueryData(key), data)
  assert.equal(
    client.getQueryState(mistakeKeys.detail('attempt-a')).isInvalidated,
    true,
  )
})
