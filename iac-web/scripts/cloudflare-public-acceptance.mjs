// Explicit, non-secret DEV checks. No Google flow, account, guest trial, paid
// provider call or successful authentication is created by this script.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifact = resolve(
  root,
  '.cloudflare-artifacts/b05d0622b7bfcc44dcddad3544c6e6d565041019/7ff21a87a6ea',
)
const manifest = JSON.parse(readFileSync(resolve(artifact, 'manifest.json')))
assert.equal(manifest.frontendOrigin, 'https://ielts.woolet.cc')
assert.equal(manifest.sourceTreeUnchanged, true)
const canonical = manifest.frontendOrigin
const aliases = [
  'https://ielts-web-dev.kairatovalmat2003.workers.dev',
  'https://ielts-dev.kairatovalmat2003.workers.dev',
]
const receipt = {
  format: 'ielts-public-dev-acceptance/v1',
  checkedAt: new Date().toISOString(),
  canonical,
  sourceRevision: manifest.sourceRevision,
  artifact:
    '.cloudflare-artifacts/' + manifest.sourceRevision + '/7ff21a87a6ea',
  manifestSha256: createHash('sha256')
    .update(readFileSync(resolve(artifact, 'manifest.json')))
    .digest('hex'),
  frontendVersion: '65493ca0-2be8-4051-8e37-b4029f29ffef',
  frontdoorVersion: 'f2603b5f-17ff-4c8b-834f-95ebb469d2a4',
  versionProvenance:
    'Frontend Wrangler deployment receipt and root frontdoor cutover receipt; pinned release, not control-plane discovery',
  moduleStartupMsFromDeployment: 11,
  runtimeOverrides: {
    IAC_CANONICAL_FRONTEND_ORIGIN: canonical,
    IAC_DEV_BACKEND_ORIGIN:
      'https://ielts-api-dev.kairatovalmat2003.workers.dev',
  },
  requests: [],
  limitations: [
    'HTTP and byte checks; no real browser hydration or user interaction',
    'No Google OAuth, Turnstile challenge, account creation or successful authentication',
    'No paid provider, audio conversion, guest trial or data mutation',
    'Success is not exhaustive CPU/memory/quota or concurrency coverage',
    'Mozilla user-agent preserves existing hostname protection; protection is unchanged',
  ],
}
const sha = (value) => createHash('sha256').update(value).digest('hex')
async function request(path, options = {}, origin = canonical) {
  const response = await fetch(origin + path, {
    ...options,
    headers: { 'user-agent': 'Mozilla/5.0', ...options.headers },
    redirect: 'manual',
    signal: AbortSignal.timeout(30000),
  })
  const bytes = Buffer.from(await response.arrayBuffer())
  const record = {
    origin,
    path,
    method: options.method ?? 'GET',
    status: response.status,
    contentType: response.headers.get('content-type'),
    bytes: bytes.length,
    sha256: sha(bytes),
  }
  receipt.requests.push(record)
  return { response, bytes, record }
}

try {
  for (const alias of aliases) {
    for (const [method, path] of [
      ['GET', '/app/login?native-check=1&next=%2Fapp%2Fpractice'],
      ['HEAD', '/api/v1/guest/config?native-check=1'],
    ]) {
      const { response, record } = await request(path, { method }, alias)
      assert.equal(response.status, 307, alias + path)
      assert.equal(response.headers.get('location'), canonical + path)
      record.location = response.headers.get('location')
    }
  }
  const rootRedirect = await request('/?native-check=1')
  assert.equal(rootRedirect.response.status, 307)
  assert.equal(
    rootRedirect.response.headers.get('location'),
    canonical + '/app/?native-check=1',
  )
  const documents = []
  for (const path of [
    '/app/',
    '/app/login',
    '/app/practice',
    '/app/full-mocks',
  ]) {
    const result = await request(path)
    assert.equal(result.response.status, 200, path)
    const html = result.bytes.toString()
    assert.match(html, /<!doctype html>/i)
    assert.match(html, /<title>[^<]+<\/title>/)
    documents.push(html)
  }
  const blog = await request('/app/blog')
  assert.equal(blog.response.status, 404)
  assert.match(blog.bytes.toString(), /<!doctype html>/i)
  const references = new Set()
  for (const html of documents)
    for (const match of html.matchAll(
      /(?:src|href)="(\/app\/assets\/[^"?]+\.(?:js|css))"/g,
    ))
      references.add(match[1])
  assert.ok([...references].some((path) => path.endsWith('.js')))
  assert.ok([...references].some((path) => path.endsWith('.css')))
  references.add('/app/favicon.png')
  references.add('/app/brand/yrys-horizontal@1x.png')
  let fontChecked = false
  for (const path of references) {
    let result = await request(path)
    if ([301, 302, 307, 308].includes(result.response.status)) {
      const target = new URL(result.response.headers.get('location'), canonical)
      assert.equal(target.origin, canonical)
      assert.equal(
        decodeURIComponent(target.pathname),
        decodeURIComponent(path),
      )
      result.record.location = target.pathname + target.search
      result.record.assetPathNormalization = true
      result = await request(target.pathname + target.search)
    }
    assert.equal(result.response.status, 200, path)
    const expected = readFileSync(
      resolve(artifact, 'source/.output-cloudflare.local/public', '.' + path),
    )
    assert.equal(sha(result.bytes), sha(expected), path)
    result.record.exactArtifactBytes = true
    if (path.endsWith('.css')) {
      const font = result.bytes.toString().match(/url\(["']?([^"'()]+\.woff2)/)
      assert.ok(font, 'The shipped stylesheet must reference its local font')
      const url = new URL(font[1], canonical + path)
      assert.equal(url.origin, canonical)
      references.add(url.pathname)
    }
    if (path.endsWith('.woff2')) fontChecked = true
  }
  assert.equal(fontChecked, true)
  const config = await request('/api/v1/guest/config')
  assert.equal(config.response.status, 200)
  const settings = JSON.parse(config.bytes)
  assert.equal(settings.enabled, true)
  assert.equal(typeof settings.siteKey, 'string')
  assert.ok(settings.siteKey.length)
  config.record.guestEnabled = settings.enabled
  config.record.turnstileSiteKeyConfigured = Boolean(settings.siteKey)
  for (const path of [
    '/api/v1/listening/tests',
    '/api/v1/reading/materials',
    '/api/v1/writing/materials',
    '/api/v1/speaking/materials',
  ]) {
    const result = await request(path)
    assert.equal(result.response.status, 200, path)
    const body = JSON.parse(result.bytes)
    const items = Array.isArray(body) ? body : body.items
    assert.ok(Array.isArray(items), path)
    result.record.items = items.length
  }
  for (const options of [
    {},
    { headers: { authorization: 'Bearer deliberately-invalid-dev-check' } },
  ]) {
    const result = await request('/api/v1/profile', options)
    assert.equal(result.response.status, 401)
  }
  const refresh = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { origin: canonical, 'content-type': 'application/json' },
    body: '{}',
  })
  assert.equal(refresh.response.status, 401)
  const logout = await request('/api/v1/auth/logout', {
    method: 'POST',
    headers: { origin: canonical, 'content-type': 'application/json' },
    body: '{}',
  })
  assert.ok([200, 204].includes(logout.response.status))
  const cookies = logout.response.headers.getSetCookie()
  assert.ok(cookies.length)
  logout.record.cookies = cookies.map((cookie) => {
    assert.doesNotMatch(cookie, /;\s*Domain=/i)
    assert.match(cookie, /;\s*HttpOnly/i)
    assert.match(cookie, /;\s*Secure/i)
    assert.match(cookie, /;\s*(?:Max-Age=0|Expires=Thu, 01 Jan 1970)/i)
    return {
      name: cookie.split('=', 1)[0],
      attributes: cookie
        .split(';')
        .slice(1)
        .map((v) => v.trim()),
    }
  })
  receipt.pass = true
} catch (error) {
  receipt.pass = false
  receipt.failure = error.message
  throw error
} finally {
  writeFileSync(
    resolve(root, 'cloudflare/public-acceptance.json'),
    JSON.stringify(receipt, null, 2) + '\n',
  )
  console.log(
    JSON.stringify({
      pass: receipt.pass,
      requests: receipt.requests.length,
      receipt: 'cloudflare/public-acceptance.json',
    }),
  )
}
