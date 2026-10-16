import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import type {
  AnalyticsOverview,
  GuestConversionCounts,
} from '../src/features/analytics/api'

function overview(
  days: number,
  counts: GuestConversionCounts,
): AnalyticsOverview {
  const daily = Array.from({ length: days }, (_, index) => {
    const day = new Date(Date.UTC(2026, 9, 16 - days + 1 + index))
      .toISOString()
      .slice(0, 10)
    return {
      day,
      registrations: 0,
      waitlistJoins: 0,
      activeUsers: 0,
      attempts: 0,
      submitted: 0,
      visitors: 10_000,
      pageViews: 15_000,
    }
  })
  return {
    days,
    timeZone: 'Asia/Almaty',
    totals: {
      registeredUsers: 200,
      waitlistPending: 0,
      waitlistLeads: 0,
      waitlistConverted: 0,
      registeredToday: 0,
      registered7d: 0,
      registered30d: 0,
      waitlistToday: 0,
      waitlist7d: 0,
      dau: 0,
      wau: 0,
      mau: 0,
      attemptsToday: 0,
      submittedToday: 0,
      fullMocksStarted: 100,
      fullMocksSubmitted: 20,
    },
    daily,
    skills: [],
    funnel: [],
    sources: [],
    heatmap: [],
    cohorts: [],
    guestConversion: {
      ...counts,
      daily: daily.map((point, index) => ({
        day: point.day,
        ...(index === 0
          ? counts
          : { guests: 0, started: 0, completed: 0, registered: 0 }),
      })),
    },
    generatedAt: '2026-10-16T07:00:00Z',
  }
}

async function mockAnalytics(
  page: Page,
  mode: 'normal' | 'empty' | 'legacy' = 'normal',
) {
  const requestedDays: number[] = []
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/auth/refresh')) {
      return route.fulfill({
        json: {
          accessToken: 'mock-admin-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'analytics-admin',
            role: 'ADMIN',
            status: 'REGISTERED',
            displayName: 'Admin',
            email: 'admin@example.test',
            permissions: [],
          },
        },
      })
    }
    if (url.pathname.endsWith('/guest/session')) {
      return route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED' } })
    }
    if (url.pathname.endsWith('/admin/analytics/overview')) {
      const days = Number(url.searchParams.get('days'))
      requestedDays.push(days)
      const counts =
        mode === 'empty'
          ? { guests: 0, started: 0, completed: 0, registered: 0 }
          : days === 7
            ? { guests: 40, started: 20, completed: 10, registered: 1 }
            : { guests: 100, started: 60, completed: 20, registered: 5 }
      const response = overview(days, counts)
      if (mode === 'legacy') delete response.guestConversion
      return route.fulfill({ json: response })
    }
    if (url.pathname.endsWith('/admin/analytics/realtime')) {
      return route.fulfill({
        json: {
          available: true,
          onlineUsers: 1,
          onlineVisitors: 2,
          visitorsToday: 10_000,
          pageViewsToday: 15_000,
          activePages: [],
          topPagesToday: [],
          windowSeconds: 120,
          generatedAt: '2026-10-16T07:00:00Z',
        },
      })
    }
    if (url.pathname.endsWith('/admin/access')) {
      return route.fulfill({
        json: { userId: 'analytics-admin', role: 'ADMIN' },
      })
    }
    return route.fulfill({ status: 204 })
  })
  return requestedDays
}

test('guest funnel uses its own cohort and updates with the selected period', async ({
  page,
}) => {
  const requestedDays = await mockAnalytics(page)
  await page.goto('admin/analytics')
  const funnel = page.getByRole('region', {
    name: 'Конверсия гостевого Full Mock',
  })
  await expect(funnel).toBeVisible()
  // Scope to the stages: chart legend has its own list items.
  const stages = funnel.locator('ol').getByRole('listitem')
  await expect(stages).toHaveCount(4)
  await expect(stages.nth(0)).toContainText('100')
  await expect(stages.nth(1)).toContainText('60% от гостей')
  await expect(stages.nth(2)).toContainText('33,3% от начавших')
  await expect(stages.nth(3)).toContainText('25% от завершивших')
  await expect(funnel.getByText('5%', { exact: true })).toBeVisible()
  await expect(funnel.getByRole('img')).toHaveAccessibleName(
    'Открыли гостевой доступ, Начали Full Mock, Завершили Full Mock, Зарегистрировались после мока',
  )

  await page.locator('[data-slot="card"]').filter({ has: funnel }).screenshot({
    path: 'test-results/guest-conversion-desktop.png',
  })

  await page
    .getByRole('combobox', { name: 'Период', exact: true })
    .selectOption('7')
  await expect(funnel.getByText('2,5%', { exact: true })).toBeVisible()
  await expect(stages.nth(0)).toContainText('40')
  expect(requestedDays).toContain(30)
  expect(requestedDays).toContain(7)
})

test('empty guest cohort shows unavailable rates, not NaN or fake conversion', async ({
  page,
}) => {
  await mockAnalytics(page, 'empty')
  await page.goto('admin/analytics')
  const funnel = page.getByRole('region', {
    name: 'Конверсия гостевого Full Mock',
  })
  await expect(funnel).toContainText(
    'За выбранный период новых гостевых профилей нет.',
  )
  await expect(funnel).toContainText('— от завершивших')
  await expect(funnel).not.toContainText('NaN')
  await expect(funnel).not.toContainText('Infinity')
})

test('older API is explicitly unavailable rather than an empty funnel', async ({
  page,
}) => {
  await mockAnalytics(page, 'legacy')
  await page.goto('admin/analytics')
  await expect(
    page.getByText('Гостевая воронка пока недоступна.'),
  ).toBeVisible()
  await expect(
    page.getByText('За выбранный период новых гостевых профилей нет.'),
  ).not.toBeVisible()
  await expect(
    page.getByText('Регистрации и заявки по дням', { exact: true }),
  ).toBeVisible()
})

test('guest funnel fits a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockAnalytics(page)
  await page.goto('admin/analytics')
  const funnel = page.getByRole('region', {
    name: 'Конверсия гостевого Full Mock',
  })
  await expect(funnel).toBeVisible()
  await expect(funnel.locator('ol').getByRole('listitem')).toHaveCount(4)
  const box = await funnel.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  await page.locator('[data-slot="card"]').filter({ has: funnel }).screenshot({
    path: 'test-results/guest-conversion-mobile.png',
  })
})
