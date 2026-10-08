import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const skills = ['listening', 'reading', 'writing', 'speaking'] as const

function overview(completed = 0) {
  return {
    examType: 'academic',
    durationMinutes: 165,
    ready: true,
    activeSession: null,
    banks: skills.map((skill) => ({
      skill,
      total: 10,
      completed,
      remaining: 10 - completed,
      isExhausted: completed === 10,
    })),
  }
}

function session(id = 'generated-session') {
  return {
    id,
    mockTestId: '00000000-0000-0000-0000-000000000000',
    status: 'IN_PROGRESS',
    currentSection: 1,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    deadlineAt: new Date(Date.now() + 165 * 60_000).toISOString(),
    mockTest: {
      title: 'Полный пробный IELTS',
      examType: 'academic',
      durationMinutes: 165,
    },
    overallBand: null,
    sections: skills.map((skill, index) => ({
      position: index + 1,
      skill,
      attempt: {
        id: `${skill}-attempt`,
        materialType: skill,
        status: 'IN_PROGRESS',
        band: null,
        score: null,
        maxScore: null,
      },
    })),
  }
}

async function mockAPI(page: Page, data: object, role = 'STUDENT') {
  const posts: { path: string; body: unknown }[] = []
  const legacyReads: string[] = []
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/auth/refresh')) {
      return route.fulfill({
        json: {
          accessToken: 'mock-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'student-id',
            role,
            email: 'mock@example.test',
            displayName: 'Student',
            timezone: 'UTC',
            examType: 'academic',
          },
        },
      })
    }
    if (path.endsWith('/full-mocks/overview'))
      return route.fulfill({ json: data })
    if (path.endsWith('/full-mocks/start')) {
      posts.push({ path, body: route.request().postDataJSON() })
      return route.fulfill({ status: 201, json: session() })
    }
    if (path.includes('/full-mock-sessions/'))
      return route.fulfill({ json: session() })
    if (path.endsWith('/attempts/final-listening')) {
      return route.fulfill({
        json: {
          id: 'final-listening',
          materialType: 'listening',
          status: 'SUBMITTED',
          band: 7,
          score: 30,
          maxScore: 40,
          startedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          review: [],
        },
      })
    }
    if (path.endsWith('/attempts/final-listening/material')) {
      return route.fulfill({
        json: { title: 'Listening Test 10', parts: [], durationMinutes: 40 },
      })
    }
    if (path.includes('/full-mocks/') && !path.includes('/admin/'))
      legacyReads.push(path)
    return route.fulfill({ json: { items: [] } })
  })
  return { posts, legacyReads }
}

test('new student sees one launch action, no catalog; start sends no mock ID', async ({
  page,
}) => {
  const { posts } = await mockAPI(page, overview())
  await page.goto('./full-mocks')
  await expect(
    page.getByRole('heading', { name: 'Полный пробный IELTS' }),
  ).toBeVisible()
  await expect(page.getByText('0 из 10 выполнено')).toHaveCount(4)
  await expect(
    page.getByText('В следующих mock-тестах будут повторы'),
  ).toHaveCount(0)
  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('button', { name: 'Начать Full Mock', exact: true })
    .click()
  await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/generated-session$/)
  expect(posts).toEqual([
    { path: '/api/v1/full-mocks/start', body: { restart: false } },
  ])
})

test('listening exhaustion is visible before launch; other sections stay new', async ({
  page,
}) => {
  const data = overview()
  data.banks[0] = {
    skill: 'listening',
    total: 10,
    completed: 10,
    remaining: 0,
    isExhausted: true,
  }
  await mockAPI(page, data)
  await page.goto('./full-mocks')
  await expect(
    page.getByRole('heading', {
      name: 'В следующих mock-тестах будут повторы',
    }),
  ).toBeVisible()
  await expect(page.getByText(/Listening \(10 из 10\)/)).toBeVisible()
  await expect(
    page.getByText(/Для остальных секций сначала подберём непройденные/),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Начать Full Mock', exact: true }),
  ).toBeEnabled()
})

test('exhausted banks do not disable full mocks', async ({
  page,
}, testInfo) => {
  await mockAPI(page, overview(10))
  await page.goto('./full-mocks')
  await expect(
    page.getByText(/Вы выполнили все доступные тесты. Full Mock/),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Начать Full Mock', exact: true }),
  ).toBeEnabled()
  await page.screenshot({
    path: testInfo.outputPath('full-mock-desktop.png'),
    fullPage: true,
  })
})

test('missing published bank blocks a new draw, but not resuming the current exam', async ({
  page,
}) => {
  const data = {
    ...overview(),
    ready: false,
    activeSession: session(),
    banks: overview().banks.map((bank) =>
      bank.skill === 'speaking' ? { ...bank, total: 0, remaining: 0 } : bank,
    ),
  }
  const { posts } = await mockAPI(page, data)
  await page.goto('./full-mocks')
  await expect(
    page.getByText(/недостаточно полных опубликованных тестов: Speaking/),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Начать заново' }),
  ).toBeDisabled()
  await page.getByRole('link', { name: 'Продолжить текущую сессию' }).click()
  await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/generated-session$/)
  expect(posts).toHaveLength(0)
})

test('restart requires confirmation and asks the server to replace the active draw', async ({
  page,
}) => {
  const { posts } = await mockAPI(page, {
    ...overview(),
    activeSession: session('old-session'),
  })
  await page.goto('./full-mocks')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Начать заново' }).click()
  expect(posts).toHaveLength(0)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Начать заново' }).click()
  await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/generated-session$/)
  expect(posts[0].body).toEqual({ restart: true })
})

test('old mock links redirect to automatic generation without loading a chosen test', async ({
  page,
}) => {
  const { legacyReads } = await mockAPI(page, overview())
  await page.goto('./full-mocks/old-mock-id')
  await expect(page).toHaveURL(/\/full-mocks$/)
  await expect(
    page.getByRole('button', { name: 'Начать Full Mock', exact: true }),
  ).toBeVisible()
  expect(legacyReads).toEqual([])
})

test('final listening result immediately opens work on mistakes', async ({
  page,
}) => {
  await mockAPI(page, overview(10))
  await page.goto('./attempts/final-listening')
  await expect(
    page.getByRole('heading', { name: 'Работа над ошибками' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Listening Test 10' }),
  ).toBeVisible()
  await expect(page.getByText('Нет ошибок', { exact: true })).toBeVisible()
})

test('manual creation is retired in admin; archive remains read-only', async ({
  page,
}) => {
  await mockAPI(page, overview(), 'ADMIN')
  await page.goto('./admin/full-mocks/new')
  await expect(page).toHaveURL(/\/admin\/full-mocks\/?$/)
  await expect(
    page.getByText(/Новые Full Mock собираются автоматически/),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Создать Full Mock' }),
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Редактировать' })).toHaveCount(
    0,
  )
})

test('missing exam format explains how to enable generation', async ({
  page,
}) => {
  const data = { ...overview(), examType: '', ready: false }
  await mockAPI(page, data)
  await page.goto('./full-mocks')
  await expect(page.getByText(/Выберите Academic или General/)).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'профиле', exact: true }),
  ).toHaveAttribute('href', /\/profile$/)
  await expect(
    page.getByRole('button', { name: 'Начать Full Mock', exact: true }),
  ).toBeDisabled()
})

test('launch overview fits on a narrow mobile viewport', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockAPI(page, overview(10))
  await page.goto('./full-mocks')
  await expect(
    page.getByRole('button', { name: 'Начать Full Mock', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('full-mock-mobile.png'),
    fullPage: true,
  })
})
