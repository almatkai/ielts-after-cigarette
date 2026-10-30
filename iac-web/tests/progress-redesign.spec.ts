// Contract-shaped synthetic UI data; no assertions about live backend results.
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { StudyResponse } from '../src/features/study-plan/api'
import { learningFixture } from './fixtures/learning'

const today = '2026-10-24'
function progressFixture(): StudyResponse {
  return {
    today,
    timezone: 'Asia/Almaty',
    settings: {
      dailyMinutes: 45,
      studyDays: [1, 2, 3, 4, 5],
      weeklyMockEnabled: false,
    },
    goal: { targetBand: 7, examDate: null, examType: 'academic' },
    plan: {
      id: 'progress-plan',
      revision: 1,
      startDate: '2026-10-22',
      endDate: '2026-10-24',
      returnAfterPause: false,
      changes: [],
      weeks: [],
      days: [22, 23, 24].map((day) => ({
        date: `2026-10-${day}`,
        dayIndex: day - 21,
        week: 1,
        budgetMinutes: 45,
        plannedMinutes: day === 22 ? 0 : 35,
        isRest: day === 22,
        preliminary: false,
        assignments: [
          {
            id: `assignment-${day}`,
            kind: 'PRACTICE',
            skill: 'reading',
            title: 'Reading practice',
            reason: 'Review evidence',
            durationMinutes: 20,
            status: day === 24 ? 'PLANNED' : 'COMPLETED',
            materialId: 'reading-material',
            attemptId: null,
            sourceAttemptId: null,
            target: '/reading',
            skipReason: null,
            completedAt: day === 24 ? null : `2026-10-${day}T08:00:00Z`,
          },
        ],
      })),
    },
    recommendations: [],
    evidence: (['reading', 'listening', 'writing', 'speaking'] as const).map(
      (skill) => ({
        skill,
        band: null,
        practiceBand: skill === 'reading' ? 6.5 : null,
        status: skill === 'reading' ? 'ready' : 'missing',
        attemptId: skill === 'reading' ? 'reading-attempt' : null,
        assessedAt: skill === 'reading' ? `${today}T08:00:00Z` : null,
        sampleCount: skill === 'reading' ? 2 : 0,
        score: skill === 'reading' ? 7 : null,
        maxScore: skill === 'reading' ? 10 : null,
        source: 'practice / partial section',
        limitations: ['Короткая практика без подтверждённой шкалы.'],
      }),
    ),
    overallBand: null,
    progress: [
      {
        date: today,
        completedAttempts: 1,
        reviewedAssignments: 0,
        skippedAssignments: 0,
        plannedMinutes: 35,
        activeMinutes: null,
      },
      {
        date: '2026-10-23',
        completedAttempts: 0,
        reviewedAssignments: 1,
        skippedAssignments: 0,
        plannedMinutes: 35,
        activeMinutes: 15,
      },
      {
        date: '2026-10-22',
        completedAttempts: 0,
        reviewedAssignments: 0,
        skippedAssignments: 0,
        plannedMinutes: 0,
        activeMinutes: 0,
      },
    ],
    limitations: ['Короткая практика без подтверждённой шкалы.'],
  }
}
async function openProgress(page: Page, data: StudyResponse) {
  const errors: string[] = [],
    unexpected: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const learning = learningFixture()
  learning.cycles = []
  learning.profiles = []
  await page.route('**/api/v1/**', (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    const json = (value: unknown, status = 200) =>
      route.fulfill({ status, json: value })
    if (path === '/billing/me')
      return route.fulfill({ json: { paywallEnabled: false, guest: false } })
    if (path === '/auth/refresh')
      return json({
        accessToken: 'progress-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 'progress-student',
          role: 'STUDENT',
          displayName: 'Student',
          email: 'progress@example.test',
          timezone: data.timezone,
        },
      })
    if (path === '/guest/session') return json({ code: 'UNAUTHENTICATED' }, 401)
    if (path === '/analytics/ping') return route.fulfill({ status: 204 })
    if (path === '/study-plan') return json(data)
    if (path === '/study-plan/learning') return json(learning)
    if (path === '/attempts' || path === '/full-mock-sessions/active')
      return json({ items: [] })
    unexpected.push(`${request.method()} ${path}`)
    return json({ code: 'UNEXPECTED_REQUEST' }, 501)
  })
  await page.goto('./progress')
  await expect(
    page
      .getByRole('main')
      .getByRole('heading', { name: 'Прогресс', exact: true }),
  ).toBeVisible()
  return () => {
    expect(errors).toEqual([])
    expect(unexpected).toEqual([])
  }
}

test('progress shows observed metrics, fourteen days, skill actions, and one consolidated disclaimer', async ({
  page,
}) => {
  const verify = await openProgress(page, progressFixture())
  const metrics = page.getByRole('region', { name: 'Сводка прогресса' })
  await expect(
    metrics.getByRole('heading', { name: 'Дней подряд' }).locator('..'),
  ).toContainText('2')
  await expect(
    metrics.getByRole('heading', { name: 'Минут за 7 дней' }).locator('..'),
  ).toContainText('15+')
  await expect(metrics).toContainText('Нет замера за 5 из 7 дней')
  await expect(
    metrics.getByRole('heading', { name: 'Заданий выполнено' }).locator('..'),
  ).toContainText('2')
  const activity = page.getByRole('region', { name: 'Активность по дням' })
  const chart = page.getByLabel('Задания: план и факт за 14 дней')
  await expect(chart.getByRole('button')).toHaveCount(14)
  await page.setViewportSize({ width: 360, height: 1000 })
  await expect(chart.getByRole('button', { pressed: true })).toBeInViewport()
  await page.setViewportSize({ width: 1280, height: 1000 })
  await chart.getByRole('button', { name: /22 окт.*День отдыха/ }).click()
  await expect(activity.locator('[aria-live]')).toContainText('День отдыха')
  await expect(activity.locator('[aria-live]').locator('dl')).toContainText(
    'Выполнено1',
  )
  await chart.getByRole('button', { name: /24 окт/ }).click()
  await expect(activity.locator('[aria-live]').locator('dl')).toContainText(
    'Выполнено0',
  )
  await expect
    .poll(() =>
      chart
        .getByRole('button', { name: /23 окт/ })
        .getByTestId('daily-completed-bar')
        .evaluate((el) => el.getBoundingClientRect().height),
    )
    .toBeGreaterThanOrEqual(4)
  await chart.getByRole('button').first().click()
  await expect(activity.locator('[aria-live]')).toContainText(
    'Нет сохранённых данных за этот день',
  )
  await expect(
    page
      .getByTestId('evidence-reading')
      .getByRole('link', { name: 'Открыть Reading' }),
  ).toHaveAttribute('href', '/app/attempts/reading-attempt')
  await expect(
    page
      .getByTestId('evidence-speaking')
      .getByRole('link', { name: 'Начать Speaking' }),
  ).toHaveAttribute('href', '/app/speaking')
  await page
    .getByTestId('evidence-reading')
    .getByRole('link', { name: 'Открыть Reading' })
    .click({ trial: true })
  await page
    .getByTestId('evidence-speaking')
    .getByRole('link', { name: 'Начать Speaking' })
    .click({ trial: true })
  await expect(
    page.getByText('Это учебные результаты, не IELTS band.', { exact: true }),
  ).toHaveCount(1)
  await page.getByText('Как мы считаем', { exact: true }).click()
  await expect(
    page.getByText('Короткая практика без подтверждённой шкалы.', {
      exact: true,
    }),
  ).toHaveCount(1)
  await page.getByText('Как мы считаем', { exact: true }).click()
  await expect(
    page.getByRole('region', { name: 'Ориентировочный балл' }),
  ).toContainText('появится, когда будут проверены все 4 навыка (0/4)')
  await expect(
    page.getByRole('progressbar', { name: 'Проверенные навыки' }),
  ).toHaveAttribute('aria-valuenow', '0')
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
      path: `artifact/redesign-qa/feedback/progress-${width}.png`,
      fullPage: true,
    })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
  }
  verify()
})

test('unmeasured minutes stay unavailable instead of becoming a zero-minute total', async ({
  page,
}) => {
  const data = progressFixture()
  data.progress.forEach((day) => {
    day.activeMinutes = null
  })
  const verify = await openProgress(page, data)
  const metric = page
    .getByRole('heading', { name: 'Минут за 7 дней' })
    .locator('..')
  await expect(metric.locator('p').first()).toHaveText('—')
  await expect(metric).toContainText('Нет замера за 7 из 7 дней')
  verify()
})
