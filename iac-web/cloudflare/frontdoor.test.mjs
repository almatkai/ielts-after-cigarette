import test from 'node:test'
import assert from 'node:assert/strict'
import frontdoor from './frontdoor.mjs'

test('frontdoor preserves request and successful response unchanged', async () => {
  const request = new Request('https://ielts.woolet.cc/app/?next=1')
  const response = new Response('normal', {
    status: 201,
    headers: { 'set-cookie': 'fixture=1' },
  })
  const result = await frontdoor.fetch(request, {
    DEV_WEB: {
      fetch: (value) => {
        assert.equal(value, request)
        return Promise.resolve(response)
      },
    },
  })
  assert.equal(result, response)
})

test('only exact free SQLite row quota failures become uncached 503 until UTC reset', async () => {
  const originalNow = Date.now
  Date.now = () => Date.parse('2026-10-28T23:59:59.100Z')
  try {
    for (const operation of ['read', 'written']) {
      const response = await frontdoor.fetch(
        new Request('https://ielts.woolet.cc/app/'),
        {
          DEV_WEB: {
            fetch: async () => {
              throw new Error(
                `Exceeded allowed rows ${operation} in Durable Objects free tier`,
              )
            },
          },
        },
      )
      assert.equal(response.status, 503)
      assert.equal(response.headers.get('retry-after'), '1')
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.equal(
        response.headers.get('content-type'),
        'text/plain; charset=utf-8',
      )
      assert.match(
        await response.text(),
        /2026-10-29.*00:00 UTC.*05:00 по Алматы/,
      )
    }
    Date.now = () => Date.parse('2026-10-29T00:00:00.000Z')
    const response = await frontdoor.fetch(
      new Request('https://ielts.woolet.cc/app/', { method: 'HEAD' }),
      {
        DEV_WEB: {
          fetch: async () => {
            throw new Error(
              'Exceeded allowed rows read in Durable Objects free tier',
            )
          },
        },
      },
    )
    assert.equal(response.headers.get('retry-after'), '86400')
    assert.equal(await response.text(), '')
  } finally {
    Date.now = originalNow
  }
})

test('unknown application and other quota failures retain the original exception', async () => {
  for (const message of [
    'Database unavailable',
    'Exceeded allowed rows read in another tier',
    'Exceeded allowed requests in Durable Objects free tier',
  ]) {
    const failure = new Error(message)
    await assert.rejects(
      frontdoor.fetch(new Request('https://ielts.woolet.cc/app/'), {
        DEV_WEB: {
          fetch: async () => {
            throw failure
          },
        },
      }),
      (error) => error === failure,
    )
  }
})
