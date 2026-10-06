import { expect, test } from '@playwright/test'

const completed = {
  id: 'completed',
  materialType: 'listening',
  materialId: 'test-one',
  materialVersionId: 'version',
  status: 'SUBMITTED',
  score: 32,
  maxScore: 40,
  band: 7.5,
  startedAt: '2026-10-06T09:00:00Z',
  submittedAt: '2026-10-06T09:40:00Z',
  testTitle: 'Cambridge Listening Test',
  testSlug: 'test-one',
}
const material = {
  id: 'test-one',
  title: completed.testTitle,
  slug: 'test-one',
  examType: 'academic',
  durationMinutes: 40,
  description: '',
  parts: [
    {
      id: 'part',
      title: 'Part 1',
      position: 1,
      audioAssetId: null,
      groups: [],
    },
  ],
}

for (const skill of ['listening', 'reading']) {
  test(`${skill}: shows saved result, retake and recent improvement`, async ({
    page,
  }) => {
    await page.route('**/api/v1/**', (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith('/auth/refresh'))
        return route.fulfill({
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
        })
      if (path.endsWith('/attempts'))
        return route.fulfill({
          json: {
            items: [
              { ...completed, materialType: skill },
              {
                ...completed,
                id: 'older',
                materialType: skill,
                band: 6,
                score: 24,
                submittedAt: '2026-10-01T09:40:00Z',
                startedAt: '2026-10-01T09:00:00Z',
              },
            ],
          },
        })
      if (
        path.endsWith('/listening/tests') ||
        path.endsWith('/reading/materials')
      )
        return route.fulfill({ json: { items: [material] } })
      return route.fulfill({ json: { items: [] } })
    })
    await page.goto(`./${skill}`)
    const card = page
      .locator('main')
      .locator('[data-slot="card"]')
      .filter({
        has: page.getByRole('heading', {
          name: completed.testTitle,
          exact: true,
        }),
      })
    await expect(card.getByText('Band 7.5', { exact: true })).toBeVisible()
    await expect(card.getByText('32/40', { exact: true })).toBeVisible()
    await expect(card.getByRole('link', { name: 'Результат' })).toHaveAttribute(
      'href',
      '/app/attempts/completed',
    )
    await expect(
      card.getByRole('link', { name: 'Новая попытка' }),
    ).toBeVisible()
    const sidebar = page.getByRole('complementary', {
      name: 'Основная навигация приложения',
    })
    await expect(
      sidebar.getByText('История прогресса', { exact: true }),
    ).toBeVisible()
    await expect(sidebar.getByText('+1.5 band', { exact: true })).toBeVisible()
  })
}

test('retake bypasses cached result and updates the library and sidebar after submission', async ({
  page,
}) => {
  let starts = 0
  let retaking = false
  let saved = false
  const fresh = {
    ...completed,
    id: 'fresh',
    status: 'IN_PROGRESS',
    band: null,
    score: null,
    maxScore: null,
    submittedAt: null,
  }
  const result = {
    ...fresh,
    status: 'SUBMITTED',
    band: 8,
    score: 35,
    maxScore: 40,
    submittedAt: '2026-10-06T10:40:00Z',
  }
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/auth/refresh'))
      return route.fulfill({
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
      })
    if (path.endsWith('/listening/tests/test-one/attempts')) {
      starts++
      return route.fulfill({
        json: { attempt: retaking ? fresh : completed, test: material },
      })
    }
    if (path.endsWith('/attempts/fresh/submit')) {
      saved = true
      return route.fulfill({ json: result })
    }
    if (path.endsWith('/attempts/fresh'))
      return route.fulfill({
        json: { ...(saved ? result : fresh), answers: [], review: [] },
      })
    if (path.endsWith('/attempts/completed'))
      return route.fulfill({ json: { ...completed, review: [] } })
    if (path.endsWith('/full-mocks/overview'))
      return route.fulfill({ json: { banks: [] } })
    if (path.endsWith('/attempts'))
      return route.fulfill({
        json: {
          items: saved
            ? [result, completed]
            : retaking
              ? [fresh, completed]
              : [completed],
        },
      })
    if (path.endsWith('/listening/tests'))
      return route.fulfill({ json: { items: [material] } })
    return route.fulfill({ json: { items: [] } })
  })
  await page.goto('./exam/listening/test-one')
  await page.getByRole('link', { name: 'К списку тестов', exact: true }).click()
  await expect(
    page.locator('main').getByText('Band 7.5', { exact: true }),
  ).toBeVisible()
  const initialStarts = starts
  retaking = true
  await page.getByRole('link', { name: 'Новая попытка', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Завершить тест', exact: true }),
  ).toBeVisible()
  // Dev StrictMode can abort/restart the mount's start request.
  expect(starts).toBeGreaterThan(initialStarts)
  expect(starts).toBeLessThanOrEqual(initialStarts + 2)
  await page.getByRole('link', { name: 'К Listening', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('link', { name: 'Продолжить попытку', exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('main').getByText('Band 7.5', { exact: true }),
  ).toBeVisible()
  await page
    .getByRole('link', { name: 'Продолжить попытку', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Завершить тест', exact: true })
    .click()
  await page.getByRole('button', { name: 'Завершить', exact: true }).click()
  await page.getByRole('link', { name: 'К списку тестов', exact: true }).click()
  await expect(
    page.locator('main').getByText('Band 8.0', { exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('main').getByText('35/40', { exact: true }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('region', { name: 'История прогресса' })
      .getByText('+0.5 band'),
  ).toBeVisible()
  await expect(
    page
      .getByRole('region', { name: 'История прогресса' })
      .getByText('Band 7.5'),
  ).toBeVisible()
})

test('an unfinished retake keeps the previous score and offers continuation', async ({
  page,
}) => {
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/auth/refresh'))
      return route.fulfill({
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
      })
    if (path.endsWith('/attempts'))
      return route.fulfill({
        json: {
          items: [
            {
              ...completed,
              id: 'draft',
              status: 'IN_PROGRESS',
              submittedAt: null,
              band: null,
              score: null,
              maxScore: null,
            },
            completed,
          ],
        },
      })
    if (path.endsWith('/listening/tests'))
      return route.fulfill({ json: { items: [material] } })
    return route.fulfill({ json: { items: [] } })
  })
  await page.goto('./listening')
  await expect(
    page.locator('main').getByText('Band 7.5', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Продолжить попытку', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Новая попытка', exact: true }),
  ).toHaveCount(0)
})
