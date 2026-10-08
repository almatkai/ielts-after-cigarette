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

test('opening a section renders the nested route and requests its material', async ({
  page,
}) => {
  await mockAPI(page, overview())
  let sectionReads = 0
  await page.route(
    '**/api/v1/full-mock-sessions/generated-session/sections/1',
    (route) => {
      sectionReads++
      return route.fulfill({
        status: 403,
        json: { code: 'FORBIDDEN', message: 'Section route probe' },
      })
    },
  )
  await page.goto('./exam/full-mock-sessions/generated-session')
  await page.getByRole('link', { name: 'Открыть секцию' }).click()
  await expect(
    page.getByRole('heading', { name: 'Не удалось открыть секцию Full Mock' }),
  ).toBeVisible()
  expect(sectionReads).toBeGreaterThan(0)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Не удалось открыть секцию Full Mock' }),
  ).toBeVisible()
})

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

for (const [index, skill] of skills.entries()) {
  test(`${skill} opens with its server timer and preserves it across reload`, async ({
    page,
  }) => {
    const now = new Date()
    await page.clock.install({ time: now })
    await mockAPI(page, overview())
    const mock = session()
    mock.currentSection = index + 1
    mock.startedAt = new Date(now.getTime() - 4 * 3600000).toISOString()
    const attempt = {
      ...mock.sections[index].attempt,
      startedAt: mock.startedAt,
    }
    let deadlineAt = new Date(now.getTime() + 600000).toISOString()
    let remainingMilliseconds: number | null = null
    let resumeTime = now.getTime()
    let pauses = 0
    let failPause = true
    const sessionState = () => ({
      ...mock,
      sections: mock.sections.map((section, position) =>
        position === index
          ? {
              ...section,
              deadlineAt: remainingMilliseconds === null ? deadlineAt : null,
              remainingMilliseconds,
            }
          : section,
      ),
    })
    const material = {
      id: `${skill}-material`,
      title: `${skill} section material`,
      slug: skill,
      examType: 'academic',
      difficulty: 'intermediate',
      description: '',
      durationMinutes: 60,
      parts:
        skill === 'speaking'
          ? [
              {
                id: 'part-1',
                position: 1,
                type: 'part1',
                title: 'Interview',
                instructions: 'Speak',
                preparationSeconds: 0,
                responseSeconds: 120,
                cueCard: [],
                questions: [
                  {
                    id: 'question-1',
                    position: 1,
                    prompt: 'Describe your home',
                  },
                ],
              },
            ]
          : [],
      body: 'Reading passage',
      kind: 'PASSAGE',
      questionGroups: [],
      tasks: [
        {
          id: 'task-1',
          position: 1,
          type: 'task1',
          prompt: 'Describe this chart',
          minimumWords: 150,
        },
        {
          id: 'task-2',
          position: 2,
          type: 'task2',
          prompt: 'Discuss education',
          minimumWords: 250,
        },
      ],
    }
    await page.route(
      '**/api/v1/full-mock-sessions/generated-session',
      (route) => route.fulfill({ json: sessionState() }),
    )
    await page.route(
      '**/api/v1/full-mock-sessions/generated-session/pause',
      (route) => {
        pauses++
        if (failPause)
          return route.fulfill({
            status: 503,
            json: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Pause failed' },
          })
        remainingMilliseconds = 480000
        return route.fulfill({ json: sessionState() })
      },
    )
    let reads = 0
    await page.route(
      `**/api/v1/full-mock-sessions/generated-session/sections/${index + 1}`,
      (route) => {
        reads++
        if (remainingMilliseconds !== null) {
          deadlineAt = new Date(
            resumeTime + remainingMilliseconds,
          ).toISOString()
          remainingMilliseconds = null
        }
        return route.fulfill({
          json: { skill, position: index + 1, attempt, material, deadlineAt },
        })
      },
    )
    await page.route(`**/api/v1/attempts/${skill}-attempt`, (route) =>
      route.fulfill({ json: { ...attempt, answers: [], recordings: [] } }),
    )
    if (skill === 'listening') {
      await page.route('**/api/v1/auth/refresh', (route) =>
        route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } }),
      )
      await page.route('**/api/v1/guest/config', (route) =>
        route.fulfill({
          json: { enabled: true, siteKey: '', examTypes: ['academic'] },
        }),
      )
      await page.route('**/api/v1/guest/session', (route) =>
        route.fulfill({
          json: {
            id: 'guest-actor',
            sessionId: mock.id,
            expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
          },
        }),
      )
    }
    await page.addInitScript(
      ({ skill: timerSkill }) => {
        localStorage.setItem(
          `iac_${timerSkill}_deadline_${timerSkill}-attempt_remaining`,
          '18000',
        )
      },
      { skill },
    )
    await page.goto('./exam/full-mock-sessions/generated-session')
    const open = page.getByRole('link', { name: 'Открыть секцию' })
    await open.hover()
    await page.clock.runFor(400)
    expect(reads).toBe(0)
    await open.click()
    await expect(
      page.getByRole('heading', { name: material.title }).first(),
    ).toBeAttached()
    const timer = page.locator(
      `[aria-label="${skill === 'speaking' ? 'Время секции Speaking' : skill === 'reading' ? 'Осталось' : 'Оставшееся время'}"]`,
    )
    await expect(timer).toBeVisible()
    await page.clock.pauseAt(new Date(now.getTime() + 60000))
    await expect(timer).toHaveText('09:00')
    await page.clock.runFor(10000)
    await expect(timer).toHaveText('08:50')
    await page.clock.resume()
    await page.reload()
    await expect(timer).toBeVisible()
    await page.clock.pauseAt(new Date(now.getTime() + 120000))
    await expect(timer).toHaveText('08:00')

    await page.getByRole('button', { name: 'Продолжить позже' }).first().click()
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'Не удалось сохранить черновик' }),
    ).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/sections/${index + 1}$`))
    expect(pauses).toBe(1)
    failPause = false
    await page.getByRole('button', { name: 'Продолжить позже' }).first().click()
    await expect(page).toHaveURL(/full-mock-sessions\/generated-session$/)
    await expect(page.getByText('На паузе · 08:00')).toBeVisible()
    await page.clock.runFor(120000)
    await expect(page.getByText('На паузе · 08:00')).toBeVisible()
    await page.clock.resume()
    await page.reload()
    await expect(page.getByText('На паузе · 08:00')).toBeVisible()
    await page.clock.pauseAt(
      new Date((await page.evaluate(() => Date.now())) + 1000),
    )
    await open.hover()
    expect(remainingMilliseconds).toBe(480000)
    await page.clock.resume()
    resumeTime = await page.evaluate(() => Date.now())
    await open.click()
    await expect(timer).toBeVisible()
    await expect(timer).toHaveText(/^(08:00|07:5\d)$/)
    await page.clock.pauseAt(new Date(new Date(deadlineAt).getTime() - 470000))
    await expect(timer).toHaveText('07:50')
    await page.clock.runFor(10000)
    await expect(timer).toHaveText('07:40')
    expect(pauses).toBe(2)
  })
}

for (const state of ['unopened', 'running', 'paused', 'completed']) {
  test(`return to site preserves a ${state} mock without finishing it`, async ({
    page,
  }) => {
    await mockAPI(page, overview())
    const mock = session()
    let paused = state === 'paused'
    let pauseCalls = 0
    let finishCalls = 0
    const data = () => ({
      ...mock,
      status: state === 'completed' ? 'SUBMITTED' : 'IN_PROGRESS',
      sections: mock.sections.map((section, index) => ({
        ...section,
        deadlineAt:
          index === 0 && state === 'running' && !paused
            ? new Date(Date.now() + 600000).toISOString()
            : null,
        remainingMilliseconds: index === 0 && paused ? 600000 : null,
      })),
    })
    await page.route(
      '**/api/v1/full-mock-sessions/generated-session',
      (route) => route.fulfill({ json: data() }),
    )
    await page.route(
      '**/api/v1/full-mock-sessions/generated-session/pause',
      (route) => {
        pauseCalls++
        paused = true
        return route.fulfill({ json: data() })
      },
    )
    await page.route(
      '**/api/v1/full-mock-sessions/generated-session/finish',
      (route) => {
        finishCalls++
        return route.fulfill({ json: data() })
      },
    )
    await page.goto('./exam/full-mock-sessions/generated-session')
    if (state === 'paused')
      await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Вернуться на сайт' }).click()
    await expect(page).toHaveURL(/\/app\/$/)
    expect(pauseCalls).toBe(state === 'running' ? 1 : 0)
    expect(finishCalls).toBe(0)
  })
}

test('return to site stays in the mock if pausing fails', async ({ page }) => {
  await mockAPI(page, overview())
  const mock = session()
  await page.route('**/api/v1/full-mock-sessions/generated-session', (route) =>
    route.fulfill({
      json: {
        ...mock,
        sections: mock.sections.map((section, index) => ({
          ...section,
          deadlineAt:
            index === 0 ? new Date(Date.now() + 600000).toISOString() : null,
        })),
      },
    }),
  )
  await page.route(
    '**/api/v1/full-mock-sessions/generated-session/pause',
    (route) =>
      route.fulfill({ status: 503, json: { code: 'DEPENDENCY_UNAVAILABLE' } }),
  )
  await page.goto('./exam/full-mock-sessions/generated-session')
  await page.getByRole('button', { name: 'Вернуться на сайт' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/full-mock-sessions\/generated-session$/)
})
