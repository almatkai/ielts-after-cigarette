import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
const tooling = createRequire(new URL('./package.json', import.meta.url))
const wrangler = createRequire(tooling.resolve('wrangler/package.json'))
const { Miniflare, convertV4MiniflareOptions } = await import(
  wrangler.resolve('miniflare')
)
const entry = readFileSync(new URL('./worker.mjs', import.meta.url), 'utf8')
const marker =
  "import frontend from '../.output-cloudflare.local/server/index.mjs'"
assert.equal(entry.split(marker).length, 2)
const script = entry.replace(
  marker,
  'const frontend = {fetch: () => new Response("fixture")}',
)

function harness(canonical = 'https://ielts.woolet.cc') {
  return new Miniflare(
    convertV4MiniflareOptions({
      workers: [
        {
          name: 'frontend',
          modules: [
            {
              type: 'ESModule',
              path: resolve('cloudflare/.fixture-entry.mjs'),
              contents: script,
            },
          ],
          compatibilityDate: '2026-07-31',
          compatibilityFlags: ['nodejs_compat'],
          bindings: {
            IAC_CANONICAL_FRONTEND_ORIGIN: canonical,
            IAC_DEV_BACKEND_ORIGIN:
              'https://ielts-api-dev.kairatovalmat2003.workers.dev',
          },
          serviceBindings: { IAC_DEV_BACKEND: 'backend' },
          durableObjects: {
            IAC_RENDER: { className: 'IELTSRender', useSQLite: true },
          },
          outboundService: () => {
            throw new Error('Fixture must use the private service binding')
          },
        },
        {
          name: 'backend',
          modules: [
            {
              type: 'ESModule',
              path: resolve('cloudflare/.fixture-backend.mjs'),
              contents: `
        export default {async fetch(request) {
          return new Response(JSON.stringify({
            method:request.method, url:request.url, body:await request.text(),
            host:request.headers.get('x-forwarded-host'),
            protocol:request.headers.get('x-forwarded-proto'),
            cookie:request.headers.get('cookie'),
            forwarded:request.headers.get('forwarded')
          }), {status:201,headers:{'content-type':'application/json',
            'location':'https://ielts-api-dev.kairatovalmat2003.workers.dev/app/login',
            'set-cookie':'session=fixture; Domain=workers.dev; Path=/; Secure; HttpOnly; SameSite=Lax'}})
        }}
      `,
            },
          ],
          compatibilityDate: '2026-07-31',
        },
      ],
    }),
  )
}

test('canonical DEV redirects and the native backend service binding preserve authority', async () => {
  const mf = harness()
  try {
    for (const [method, path] of [
      ['GET', '/api/v1/auth/google?next=%2Fapp%2F'],
      ['HEAD', '/app/login?a=1'],
    ]) {
      const response = await mf.dispatchFetch(
        'https://ielts-web-dev.kairatovalmat2003.workers.dev' + path,
        { method, redirect: 'manual' },
      )
      assert.equal(response.status, 307)
      assert.equal(
        response.headers.get('location'),
        'https://ielts.woolet.cc' + path,
      )
    }
    const response = await mf.dispatchFetch(
      'https://ielts.woolet.cc/api/v1/auth/google?fixture=1',
      {
        method: 'POST',
        redirect: 'manual',
        body: 'fixture-body',
        headers: {
          cookie: 'incoming=fixture',
          forwarded: 'host=untrusted.invalid',
        },
      },
    )
    assert.equal(response.status, 201)
    assert.equal(
      response.headers.get('location'),
      'https://ielts.woolet.cc/app/login',
    )
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(
      response.headers.get('set-cookie'),
      'session=fixture; Path=/; Secure; HttpOnly; SameSite=Lax',
    )
    assert.deepEqual(await response.json(), {
      method: 'POST',
      url: 'https://ielts-api-dev.kairatovalmat2003.workers.dev/api/v1/auth/google?fixture=1',
      body: 'fixture-body',
      host: 'ielts.woolet.cc',
      protocol: 'https',
      cookie: 'incoming=fixture',
      forwarded: null,
    })
  } finally {
    await mf.dispose()
  }
})

test('an unapproved runtime canonical origin fails closed', async () => {
  const mf = harness('https://production.invalid')
  try {
    const response = await mf.dispatchFetch('https://ielts.woolet.cc/app/login')
    assert.equal(response.status, 503)
  } finally {
    await mf.dispose()
  }
})
