import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function auth(page: Page) {
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({
      json: {
        accessToken: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 'student',
          role: 'STUDENT',
          email: 'student@example.test',
          displayName: 'Student',
          timezone: 'UTC',
        },
      },
    }),
  )
}
const attempt = (index: number, status = 'SUBMITTED') => ({
  id: `history-${index}`,
  materialType: 'reading',
  materialId: `material-${index}`,
  materialVersionId: 'version',
  status,
  score: 1,
  maxScore: 1,
  band: 7,
  testTitle: `History ${index}`,
  testSlug: 'test',
  startedAt: '2026-10-01T10:00:00Z',
  submittedAt: '2026-10-01T11:00:00Z',
})

test('history loads older attempts when scrolled instead of loading all rows on entry', async ({
  page,
}) => {
  let pages = 0
  await page.route('**/api/v1/**', (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/dashboard'))
      return route.fulfill({ json: { skillProgress: [] } })
    if (url.pathname.endsWith('/attempts')) {
      pages++
      expect(url.searchParams.get('limit')).toBe('50')
      return route.fulfill({
        json: url.searchParams.has('cursor')
          ? { items: [attempt(50)] }
          : {
              items: Array.from({ length: 50 }, (_, i) => attempt(i)),
              nextCursor: 'opaque-cursor',
            },
      })
    }
    return route.fulfill({ json: { items: [] } })
  })
  await auth(page)
  await page.goto('./progress')
  await expect(page.getByText('History 0', { exact: true })).toBeVisible()
  await expect(page.getByText('History 49', { exact: true })).toHaveCount(1)
  // StrictMode can abort/restart the initial query in the dev server.
  const initialReads = pages
  expect(initialReads).toBeLessThanOrEqual(2)
  await expect(page.getByText('History 50', { exact: true })).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Показать ещё' })
    .scrollIntoViewIfNeeded()
  await expect(page.getByText('History 50', { exact: true })).toBeVisible()
  expect(pages).toBe(initialReads + 1)
  await expect(page.getByText('History 0', { exact: true })).toHaveCount(1)
})

test('chat module loads on first open and keeps its draft after close/reopen', async ({
  page,
}) => {
  let chatModuleReads = 0
  page.on('request', (request) => {
    if (request.url().includes('/ai-assistant.tsx')) chatModuleReads++
  })
  await page.route('**/api/v1/**', (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/dashboard'))
      return route.fulfill({ json: { skillProgress: [] } })
    return route.fulfill({ json: { items: [] } })
  })
  await auth(page)
  await page.goto('./progress')
  const open = page
    .getByRole('button', { name: 'Открыть чат с Юки', exact: true })
    .first()
  await expect(open).toBeVisible()
  expect(chatModuleReads).toBe(0)
  await open.click()
  const input = page.getByPlaceholder('Спроси Юки о подготовке к IELTS...')
  await expect(input).toBeVisible()
  expect(chatModuleReads).toBe(1)
  await input.fill('Черновик вопроса')
  await page.getByRole('button', { name: 'Закрыть чат', exact: true }).click()
  await open.click()
  await expect(input).toHaveValue('Черновик вопроса')
  expect(chatModuleReads).toBe(1)
})

for (const initiallyProcessing of [false, true]) {
  test(`finished Full Mock polls only while AI is pending (${initiallyProcessing})`, async ({
    page,
  }) => {
    let reads = 0
    let processing = initiallyProcessing
    await page.clock.install()
    await page.route('**/api/v1/**', (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith('/full-mock-sessions/session')) {
        reads++
        return route.fulfill({
          json: {
            id: 'session',
            status: 'SUBMITTED',
            currentSection: 4,
            startedAt: '2026-10-01T10:00:00Z',
            submittedAt: '2026-10-01T12:00:00Z',
            deadlineAt: '2026-10-01T12:00:00Z',
            mockTest: {
              title: 'Finished Full Mock',
              examType: 'academic',
              durationMinutes: 120,
            },
            sections: [
              {
                position: 4,
                skill: 'speaking',
                attempt: {
                  ...attempt(1, processing ? 'PROCESSING' : 'SUBMITTED'),
                  materialType: 'speaking',
                },
              },
            ],
            overallBand: processing ? null : 7,
          },
        })
      }
      return route.fulfill({ json: { items: [] } })
    })
    await auth(page)
    await page.goto('./exam/full-mock-sessions/session')
    await expect(page.getByText('Итоговый IELTS band')).toBeVisible()
    const initial = reads
    if (initiallyProcessing) {
      await page.clock.runFor(10_100)
      await expect.poll(() => reads).toBe(initial + 1)
      processing = false
      await page.clock.runFor(10_100)
      await expect.poll(() => reads).toBe(initial + 2)
    }
    const stopped = reads
    await page.clock.runFor(30_000)
    expect(reads).toBe(stopped)
  })
}
