// Integration checks against the built frontend in real local workerd and an
// ephemeral HTTP backend. No Cloudflare account or deployed API is contacted.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
if (args[0] === '--') args.shift()
if (args.length > 1)
  throw new Error('Expected at most one artifact source directory')
const source = args[0] ? resolve(args[0]) : root
if (!existsSync(resolve(source, 'wrangler.cloudflare.json'))) {
  throw new Error('Source directory has no Cloudflare configuration')
}
const origin = 'http://127.0.0.1:8787'
const requests = []
const media = Buffer.from([137, 80, 78, 71, 0, 255, 42])
const backend = createServer(async (request, response) => {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  const body = Buffer.concat(chunks).toString()
  requests.push({
    url: request.url,
    method: request.method,
    headers: request.headers,
    body,
  })
  if (request.url.startsWith('/api/v1/blog/media/')) {
    response.writeHead(200, { 'content-type': 'image/png' }).end(media)
  } else if (request.url === '/api/v1/auth/google/callback') {
    response.writeHead(302, { location: `${backendOrigin}/app/login` }).end()
  } else if (request.url.startsWith('/api/v1/blog/posts')) {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ items: [], total: 0 }))
  } else {
    response
      .writeHead(201, {
        'content-type': 'application/json',
        'set-cookie': [
          'session=local; Domain=127.0.0.1; Path=/api/v1; HttpOnly; SameSite=Lax',
          'state=local; Path=/; HttpOnly; SameSite=Lax',
        ],
      })
      .end(JSON.stringify({ body }))
  }
})
backend.listen(0, '127.0.0.1')
await once(backend, 'listening')
const backendOrigin = `http://127.0.0.1:${backend.address().port}`
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) =>
    ['PATH', 'HOME', 'TMPDIR', 'TMP', 'TEMP', 'SystemRoot'].includes(key),
  ),
)
env.WRANGLER_SEND_METRICS = 'false'
env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'false'
// Prevent accidentally sending requests to an already-running local service.
try {
  await fetch(origin, { signal: AbortSignal.timeout(500) })
  throw new Error(
    'Port 8787 is occupied; stop that local service before testing',
  )
} catch (error) {
  if (error.message.startsWith('Port 8787')) {
    backend.close()
    throw error
  }
}
const worker = spawn(
  process.execPath,
  [
    resolve(root, 'cloudflare/node_modules/wrangler/bin/wrangler.js'),
    'dev',
    '--config',
    'wrangler.cloudflare.json',
    '--local',
    '--ip',
    '127.0.0.1',
    '--port',
    '8787',
    '--inspector-port',
    '0',
    '--var',
    `IAC_DEV_BACKEND_ORIGIN:${backendOrigin}`,
  ],
  { cwd: source, env, stdio: ['ignore', 'pipe', 'pipe'] },
)
let output = ''
worker.stdout.on('data', (data) => {
  output += data
})
worker.stderr.on('data', (data) => {
  output += data
})
async function get(path, options) {
  return fetch(`${origin}${path}`, {
    ...options,
    signal: AbortSignal.timeout(15000),
  })
}
try {
  await new Promise((accept, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Local workerd startup timed out')),
      60000,
    )
    const ready = () => {
      if (output.includes(`Ready on ${origin}`)) {
        clearTimeout(timer)
        accept()
      }
    }
    worker.stdout.on('data', ready)
    worker.stderr.on('data', ready)
    worker.once('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`Local workerd exited (${code})`))
    })
    worker.once('error', () => {
      clearTimeout(timer)
      reject(new Error('Cannot start local workerd'))
    })
  })
  const redirect = await get('/?from=smoke', { redirect: 'manual' })
  assert.equal(redirect.status, 307)
  assert.equal(redirect.headers.get('location'), `${origin}/app/?from=smoke`)
  assert.equal((await get('/outside-app')).status, 404)
  const login = await get('/app/login')
  assert.equal(login.status, 200)
  const html = await login.text()
  assert.match(html, /<!DOCTYPE html>/i)
  // Login deliberately uses ssr:false; its document/head still come from SSR.
  assert.match(html, /<title>Войти — Yrys Academy<\/title>/)
  const stylesheet = html.match(/href="(\/app\/assets\/[^\"]+\.css)"/)[1]
  const css = await get(stylesheet)
  assert.equal(css.status, 200)
  assert.match(css.headers.get('content-type'), /text\/css/)
  const entry = html.match(/src="(\/app\/assets\/[^\"]+\.js)"/)[1]
  const javascript = await get(entry)
  assert.equal(javascript.status, 200)
  assert.match(javascript.headers.get('content-type'), /javascript/)
  const icon = await get('/app/favicon.png')
  assert.equal(icon.status, 200)
  assert.deepEqual(
    Buffer.from(await icon.arrayBuffer()),
    readFileSync(resolve(source, 'public/favicon.png')),
  )
  const post = await get('/api/v1/auth/google?smoke=1', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer local-smoke',
      cookie: 'incoming=local',
    },
    body: '{"local":true}',
  })
  assert.equal(post.status, 201)
  assert.deepEqual(await post.json(), { body: '{"local":true}' })
  assert.equal(post.headers.get('cache-control'), 'no-store')
  assert.equal(post.headers.getSetCookie().length, 2)
  assert.doesNotMatch(post.headers.get('set-cookie'), /Domain=/i)
  const forwarded = requests.find(
    (request) => request.url === '/api/v1/auth/google?smoke=1',
  )
  assert.equal(forwarded.method, 'POST')
  assert.equal(forwarded.headers.authorization, 'Bearer local-smoke')
  assert.equal(forwarded.headers.cookie, 'incoming=local')
  assert.equal(forwarded.headers['x-forwarded-host'], '127.0.0.1:8787')
  const callback = await get('/api/v1/auth/google/callback', {
    redirect: 'manual',
  })
  assert.equal(callback.status, 302)
  assert.equal(callback.headers.get('location'), `${origin}/app/login`)
  const image = await get('/api/v1/blog/media/local')
  assert.equal(image.status, 200)
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), media)
  const posts = await get('/api/v1/blog/posts?limit=1')
  assert.equal(posts.status, 200)
  assert.deepEqual(await posts.json(), { items: [], total: 0 })
  // The existing application intentionally gates the public blog off. Preserve
  // its SSR 404 rather than enabling a feature in deployment tooling.
  const blog = await get('/app/blog')
  assert.equal(blog.status, 404)
  assert.match(await blog.text(), /<!DOCTYPE html>/i)
  assert.ok(
    requests.some((request) => request.url.startsWith('/api/v1/blog/posts')),
  )
  console.log(
    'PASS: workerd SSR documents, deep routes and gated blog 404, JS/CSS/public assets, API method/query/body/headers, cookies, redirects, binary blog media and blog API',
  )
} finally {
  if (worker.pid && worker.exitCode === null && worker.signalCode === null) {
    worker.kill('SIGTERM')
    await once(worker, 'exit')
  }
  backend.closeAllConnections()
  await new Promise((accept) => backend.close(accept))
}
