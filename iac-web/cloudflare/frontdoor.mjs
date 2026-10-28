// Preserve the existing DEV hostname and its OAuth/cookie origin. All runtime
// requests go to the native Cloudflare app; no VPS/VPC fallback is configured.
export default {
  async fetch(request, env) {
    try {
      return await env.DEV_WEB.fetch(request)
    } catch (error) {
      if (
        !/Exceeded allowed rows (read|written) in Durable Objects free tier/.test(
          error?.message ?? '',
        )
      )
        throw error
      const now = Date.now()
      const date = new Date(now)
      const reset = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() + 1,
      )
      const retry = Math.max(1, Math.ceil((reset - now) / 1000))
      const body =
        'IELTS DEV временно недоступен: исчерпан бесплатный суточный лимит операций с базой данных.\n' +
        `Лимит сбросится ${new Date(reset).toISOString().slice(0, 10)} в 00:00 UTC (05:00 по Алматы). Повторите попытку после сброса.\n`
      return new Response(request.method === 'HEAD' ? null : body, {
        status: 503,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
          'retry-after': String(retry),
        },
      })
    }
  },
}
