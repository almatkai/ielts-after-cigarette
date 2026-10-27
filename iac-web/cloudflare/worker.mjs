import frontend from '../.output-cloudflare.local/server/index.mjs'

function unavailable(status, message) {
  return new Response(message, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}

async function proxyApi(request, env) {
  if (!env.IAC_DEV_BACKEND_ORIGIN) {
    return unavailable(503, 'DEV backend is not configured')
  }
  const incoming = new URL(request.url)
  let backend
  try {
    backend = new URL(env.IAC_DEV_BACKEND_ORIGIN)
    if (
      backend.username ||
      backend.password ||
      backend.pathname !== '/' ||
      backend.search ||
      backend.hash ||
      backend.origin === incoming.origin ||
      !['http:', 'https:'].includes(backend.protocol) ||
      (backend.protocol === 'http:' &&
        !env.IAC_DEV_BACKEND &&
        !['127.0.0.1', 'localhost', '[::1]'].includes(backend.hostname))
    ) {
      return unavailable(503, 'Invalid DEV backend configuration')
    }
  } catch {
    return unavailable(503, 'Invalid DEV backend configuration')
  }

  const target = new URL(backend)
  target.pathname = incoming.pathname
  target.search = incoming.search
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('forwarded')
  headers.set('x-forwarded-host', incoming.host)
  headers.set('x-forwarded-proto', incoming.protocol.slice(0, -1))
  const forwarded = new Request(target, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  })

  try {
    // Optional future VPC/service binding, never the existing proxy's ORIGIN.
    const upstream = env.IAC_DEV_BACKEND
      ? await env.IAC_DEV_BACKEND.fetch(forwarded)
      : await fetch(forwarded)
    const response = new Response(upstream.body, upstream)
    response.headers.set('cache-control', 'no-store')
    const location = response.headers.get('location')
    if (location) {
      const redirect = new URL(location, target)
      if (redirect.origin === backend.origin) {
        redirect.host = incoming.host
        redirect.protocol = incoming.protocol
        response.headers.set('location', redirect.href)
      }
    }
    // Auth cookies belong to this frontend host, not the private backend host.
    const cookies = upstream.headers.getSetCookie()
    if (cookies.length) {
      response.headers.delete('set-cookie')
      for (const cookie of cookies) {
        response.headers.append(
          'set-cookie',
          cookie.replace(/;\s*Domain=[^;]*/gi, ''),
        )
      }
    }
    return response
  } catch {
    return unavailable(502, 'DEV backend is unavailable')
  }
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url)
    if (url.pathname === '/api/v1' || url.pathname.startsWith('/api/v1/')) {
      return proxyApi(request, env)
    }
    if (url.pathname === '/' || url.pathname === '/app') {
      url.pathname = '/app/'
      return Response.redirect(url.href, 307)
    }
    if (!url.pathname.startsWith('/app/')) {
      return unavailable(404, 'Not found')
    }
    return frontend.fetch(request, env, context)
  },
}
