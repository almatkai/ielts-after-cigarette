// Run against this checkout's built Nitro server, never a deployed service:
// node tests/seo-built.mjs http://127.0.0.1:PORT https://ielts.yrys.academy
// For an empty/unset VITE_SITE_URL build, pass the loopback origin twice.
import assert from 'node:assert/strict'
import { chromium, expect } from '@playwright/test'

const origin = new URL(process.argv[2]).origin
const canonicalOrigin = new URL(process.argv[3]).origin
assert.equal(
  new URL(origin).hostname,
  '127.0.0.1',
  'use an isolated local build',
)
const retiredIdentity = /Daiyndyq IELTS|Дайындық IELTS|ielts\.academy-ai\.kz/i
const browser = await chromium.launch()

async function isolate(context) {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.startsWith('/api/'))
      return route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } })
    return url.origin === origin ? route.continue() : route.abort()
  })
}

try {
  const context = await browser.newContext({ javaScriptEnabled: false })
  await isolate(context)
  const page = await context.newPage()
  for (const path of ['privacy', 'terms']) {
    const response = await page.goto(
      `${origin}/app/${path}?utm_source=seo-check`,
    )
    assert.equal(response.status(), 200)
    await expect(page).toHaveTitle(/Yrys Academy/)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${canonicalOrigin}/app/${path}`,
    )
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow',
    )
    assert.doesNotMatch(await response.text(), retiredIdentity)
    for (const selector of [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ])
      await expect(page.locator(selector)).toHaveAttribute(
        'content',
        'https://ielts.yrys.academy/app/og-yrys.png',
      )
  }
  for (const path of [
    '',
    'login',
    'practice',
    'profile',
    'admin',
    'admin/ai-providers',
    'exam',
  ]) {
    const response = await page.goto(`${origin}/app/${path}`)
    assert.equal(response.status(), 200)
    await expect(page).toHaveTitle(/Yrys Academy/)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    )
    assert.doesNotMatch(await response.text(), retiredIdentity)
  }
  for (const path of [
    'blog',
    'blog/seo-check',
    'blog/become-writer',
    'blog/sitemap.xml',
    'blog/rss.xml',
  ]) {
    const response = await context.request.get(`${origin}/app/${path}`)
    assert.equal(response.status(), 404, `hidden ${path}`)
    if (path.endsWith('.xml')) {
      assert.equal(response.headers()['x-robots-tag'], 'noindex')
      assert.equal(response.headers()['cache-control'], 'no-store')
      assert.doesNotMatch(await response.text(), /<loc>|<item>/)
    }
  }
  const manifest = await context.request.get(
    `${origin}/app/manifest.webmanifest`,
  )
  assert.equal(manifest.status(), 200)
  const data = await manifest.json()
  assert.equal(data.name, 'Yrys Academy')
  assert.equal(data.start_url, '/app/')
  assert.equal(data.scope, '/app/')
  console.log(
    'PASS built initial HTML: legal canonicals/indexing, private/admin noindex, hidden blog, manifest and public identity',
  )
  await context.close()

  // Device locale and client navigation must retain the same canonical URL.
  for (const language of ['ru', 'kk', 'en']) {
    const localized = await browser.newContext()
    await isolate(localized)
    await localized.addInitScript(
      (value) => localStorage.setItem('daiyndyq-language', value),
      language,
    )
    const page = await localized.newPage()
    await page.goto(`${origin}/app/privacy?utm_source=seo-check`)
    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${canonicalOrigin}/app/privacy`,
    )
    await page.locator('header a[href="/app/terms"]').click()
    await expect(page).toHaveURL(`${origin}/app/terms`)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${canonicalOrigin}/app/terms`,
    )
    await expect(page).toHaveTitle(/Yrys Academy/)
    assert.doesNotMatch(await page.locator('head').innerHTML(), retiredIdentity)
    await localized.close()
  }
  console.log('PASS hydrated RU/KK/EN legal canonicals and client navigation')
} finally {
  await browser.close()
}
