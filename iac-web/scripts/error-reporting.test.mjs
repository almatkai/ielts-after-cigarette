import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ApiClient, ApiError } from '../src/lib/api/client.ts'
import {
  configureErrorReporter,
  reportError,
} from '../src/lib/error-reporting.ts'

// A reporter is deliberately not configured by the application yet.
test('reporter filters expected failures, deduplicates and excludes sensitive content', async () => {
  globalThis.window = {}
  const events = []
  const stop = configureErrorReporter((event) => events.push(event))
  try {
    for (const status of [400, 401, 403, 404, 422, 429]) {
      reportError(new ApiError(status, { message: 'private answer' }), 'query')
    }
    reportError(new DOMException('cancelled', 'AbortError'), 'query')
    const failure = new ApiError(500, {
      message: 'private answer',
      details: { token: 'secret' },
      requestId: 'trace-1',
      code: 'INTERNAL_ERROR',
    })
    reportError(failure, 'query')
    reportError(failure, 'route')
    reportError(new ApiError(0, { code: 'NETWORK_ERROR' }), 'autosave')
    assert.deepEqual(events, [
      {
        source: 'query',
        name: 'ApiError',
        code: 'INTERNAL_ERROR',
        status: 500,
        requestId: 'trace-1',
      },
      {
        source: 'autosave',
        name: 'ApiError',
        code: 'NETWORK_ERROR',
        status: 0,
        requestId: undefined,
      },
    ])
    assert.doesNotMatch(JSON.stringify(events), /private answer|secret|token/)
    stop()
    const stopFailing = configureErrorReporter(() => {
      throw new Error('telemetry down')
    })
    assert.doesNotThrow(() => reportError(new Error('render error'), 'route'))
    stopFailing()
    const stopAsync = configureErrorReporter(async () => {
      throw new Error('telemetry down')
    })
    reportError(new Error('another render error'), 'route')
    await new Promise((resolve) => setImmediate(resolve))
    stopAsync()
  } finally {
    stop()
    delete globalThis.window
  }
})

test('API errors use X-Request-ID even for an HTML gateway failure', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async () =>
      new Response('gateway down', {
        status: 502,
        headers: { 'X-Request-ID': 'gateway-id' },
      })
    await assert.rejects(
      new ApiClient('https://api.example.test').request('/test'),
      (error) =>
        error instanceof ApiError &&
        error.requestId === 'gateway-id' &&
        error.status === 502,
    )
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ requestId: 'body-id' }), {
        status: 500,
        headers: { 'X-Request-ID': 'header-id' },
      })
    await assert.rejects(
      new ApiClient('https://api.example.test').request('/test'),
      (error) => error.requestId === 'body-id',
    )
  } finally {
    globalThis.fetch = original
  }
})

test('cancelled fetch is not converted into NETWORK_ERROR', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async () => {
      throw new DOMException('cancelled', 'AbortError')
    }
    await assert.rejects(
      new ApiClient('https://api.example.test').request('/test'),
      (error) => error.name === 'AbortError' && !(error instanceof ApiError),
    )
  } finally {
    globalThis.fetch = original
  }
})
