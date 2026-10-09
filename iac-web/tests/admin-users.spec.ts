import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const user = {
  id: 'student-id',
  displayName: 'Айгерим Садыкова',
  email: 'aigerim@example.test',
  phone: '+77012345678',
  role: 'STUDENT',
  permissions: [] as string[],
  status: 'REGISTERED',
  blocked: false,
  createdAt: '2026-09-12T09:30:00Z',
  updatedAt: '2026-10-08T09:30:00Z',
  lastActiveAt: '2026-10-08T09:30:00Z',
  completedTests: 12,
  unfinishedTests: 2,
  currentBand: 6.5,
  targetBand: 7.5,
  examDate: '2026-12-04',
  examType: 'academic',
  timezone: 'Asia/Almaty',
  source: 'landing',
  referralCode: 'AIGERIM',
  referredByCode: null,
  termsAcceptedAt: '2026-09-12T09:30:00Z',
  googleConnected: true,
  hasPassword: true,
  skills: [
    { skill: 'reading', band: 7, accuracy: 75, completedTasks: 5 },
    { skill: 'listening', band: 6.5, accuracy: 68, completedTasks: 4 },
    { skill: 'writing', band: 6, accuracy: null, completedTasks: 2 },
    { skill: 'speaking', band: 6.5, accuracy: null, completedTasks: 1 },
  ],
  activityDays: ['2026-10-08', '2026-10-07', '2026-10-05'],
  sessions: [
    {
      createdAt: '2026-10-08T09:30:00Z',
      expiresAt: '2027-10-08T09:30:00Z',
      revokedAt: null,
      userAgent: 'Chrome · macOS',
      ipAddress: '127.0.0.1',
    },
  ],
}
async function mock(page: Page, role = 'ADMIN', permissions: string[] = []) {
  const state = {
    user: structuredClone(user),
    reads: [] as string[],
    writes: [] as {
      method: string
      path: string
      body: Record<string, unknown>
    }[],
  }
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url())
    const path = url.pathname
    const method = request.method()
    const json = (value: unknown, status = 200) =>
      route.fulfill({ json: value, status })
    if (path.endsWith('/auth/refresh'))
      return json({
        accessToken: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          ...user,
          id: 'admin-id',
          role,
          permissions,
          displayName: 'Almat Kairatov',
        },
      })
    if (method !== 'GET') {
      state.writes.push({ method, path, body: request.postDataJSON() ?? {} })
      if (method === 'PUT') {
        Object.assign(state.user, request.postDataJSON())
        return json(state.user)
      }
      return route.fulfill({ status: 204 })
    }
    state.reads.push(path)
    if (path.endsWith('/admin/access'))
      return json({ userId: 'admin-id', role })
    if (path.endsWith('/dashboard'))
      return json({
        profile: { currentBand: 6.5, targetBand: 7.5, examDate: '2026-12-04' },
        recommendedAction: {
          type: 'practice',
          title: 'Практика',
          description: 'Выберите секцию',
          target: '/practice',
        },
        todayPlan: [],
        skillProgress: [],
        unreadNotifications: 0,
      })
    if (path.endsWith('/users')) {
      const items = [
        state.user,
        {
          ...user,
          id: 'writer-id',
          displayName: 'Данияр Омаров',
          email: 'daniyar@example.test',
          role: 'WRITER',
          completedTests: 24,
          unfinishedTests: 0,
        },
        {
          ...user,
          id: 'lead-id',
          displayName: 'Алина Ким',
          email: 'alina@example.test',
          completedTests: 0,
          unfinishedTests: 1,
        },
        {
          ...user,
          id: 'blocked-id',
          displayName: 'Руслан Тулеев',
          email: 'ruslan@example.test',
          blocked: true,
          completedTests: 3,
          unfinishedTests: 0,
        },
      ]
        .filter(
          (u) =>
            !url.searchParams.get('q') ||
            `${u.displayName} ${u.email}`
              .toLowerCase()
              .includes(url.searchParams.get('q')!.toLowerCase()),
        )
        .filter(
          (u) =>
            !url.searchParams.get('role') ||
            u.role === url.searchParams.get('role'),
        )
      return json({ items, total: items.length, page: 1, pageSize: 30 })
    }
    if (path.endsWith('/users/student-id')) return json(state.user)
    if (path.endsWith('/attempts'))
      return json({
        items: [
          {
            id: 'attempt-1',
            skill: 'reading',
            title: 'Cambridge IELTS 20 — Academic Reading Test 3',
            status: 'SUBMITTED',
            band: 7,
            score: 30,
            maxScore: 40,
            startedAt: '2026-10-08T08:30:00Z',
            submittedAt: '2026-10-08T09:30:00Z',
            fullMock: null,
          },
          {
            id: 'attempt-2',
            skill: 'listening',
            title: 'Cambridge IELTS 16 — Listening Test 1',
            status: 'IN_PROGRESS',
            band: null,
            score: null,
            maxScore: null,
            startedAt: '2026-10-07T08:30:00Z',
            submittedAt: null,
            fullMock: null,
          },
          {
            id: 'attempt-3',
            skill: 'writing',
            title: 'Academic Writing — Practice Test',
            status: 'ABANDONED',
            band: null,
            score: null,
            maxScore: null,
            startedAt: '2026-10-05T08:30:00Z',
            submittedAt: null,
            fullMock: null,
          },
        ],
        total: 3,
        page: 1,
        pageSize: 30,
      })
    if (path.endsWith('/attempts/attempt-1'))
      return json({
        attempt: {},
        answers: [
          { answer: { value: 'tourism' }, is_correct: true, points_awarded: 1 },
        ],
        writing: null,
        speaking: null,
      })
    return json({ items: [], attempts: [], skills: [] })
  })
  return state
}
test('search, author role, password, sessions and confirmed deletion', async ({
  page,
}, testInfo) => {
  const state = await mock(page)
  await page.goto('admin/users')
  await expect(
    page.getByRole('heading', { name: 'Пользователи', exact: true, level: 1 }),
  ).toBeVisible()
  await expect(page.getByText('Данияр Омаров')).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('ielts-users-list.png'),
    fullPage: true,
  })
  await page.getByLabel('Поиск пользователей').fill('Айгерим')
  await expect(page.getByText('Данияр Омаров')).toHaveCount(0)
  await page
    .getByRole('link', { name: /Айгерим Садыкова/ })
    .first()
    .click()
  await expect(
    page.getByRole('heading', { name: 'Айгерим Садыкова' }),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('ielts-user-profile.png'),
    fullPage: true,
  })
  await page.getByLabel('Роль аккаунта', { exact: true }).selectOption('WRITER')
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Сохранено')
  expect(state.writes.at(-1)?.body.role).toBe('WRITER')
  await page
    .getByRole('button', { name: 'Сменить пароль', exact: true })
    .click()
  await page.getByLabel('Новый пароль').fill('strong-password-123')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Сменить пароль', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.writes.at(-1)?.path).toContain('/password')
  await page.getByRole('button', { name: 'Завершить сессии' }).click()
  await page.getByRole('button', { name: 'Завершить', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.writes.at(-1)?.path).toContain('/revoke-sessions')
  await page.getByRole('button', { name: 'Тесты', exact: true }).click()
  await expect(
    page.getByText('Cambridge IELTS 20 — Academic Reading Test 3'),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('ielts-user-tests.png'),
    fullPage: true,
  })
  await page
    .getByRole('button', {
      name: 'Cambridge IELTS 20 — Academic Reading Test 3',
    })
    .click()
  await expect(page.getByText('tourism')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Активность', exact: true }).click()
  await expect(page.getByText('Chrome · macOS')).toBeVisible()
  await page.getByRole('button', { name: 'Профиль', exact: true }).click()
  await page
    .getByRole('button', { name: 'Удалить аккаунт', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Удалить навсегда' }),
  ).toBeDisabled()
  await page.getByLabel(`Введите ${user.email}`).fill(user.email)
  await page.getByRole('button', { name: 'Удалить навсегда' }).click()
  await expect(page).toHaveURL(/admin\/users\/?$/)
  expect(state.writes.at(-1)?.method).toBe('DELETE')
})
test('admin can combine, narrow and remove editorial access', async ({
  page,
}) => {
  const state = await mock(page)
  await page.goto('admin/users/student-id')
  await page.getByLabel('Роль аккаунта', { exact: true }).selectOption('WRITER')
  const blog = page.getByRole('checkbox', { name: /Авторы и блог/ })
  const content = page.getByRole('checkbox', {
    name: /Учебные материалы и тесты/,
  })
  await blog.check()
  await content.check()
  const save = async (permissions: string[]) => {
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
    await expect(page.getByRole('status')).toHaveText('Сохранено')
    expect(state.writes.at(-1)?.body.role).toBe('WRITER')
    expect(state.writes.at(-1)?.body.permissions).toEqual(permissions)
  }
  await save(['BLOG_MODERATOR', 'CONTENT_EDITOR'])
  await blog.uncheck()
  await save(['CONTENT_EDITOR'])
  await content.uncheck()
  await save([])
  await page.getByLabel('Роль аккаунта', { exact: true }).selectOption('ADMIN')
  await expect(blog).toBeChecked()
  await expect(content).toBeChecked()
  await expect(blog).toBeDisabled()
  await expect(content).toBeDisabled()
})

for (const access of [
  {
    name: 'test editor',
    role: 'EDITOR',
    permissions: ['CONTENT_EDITOR'],
    groups: ['Обзор', 'Учебные материалы'],
    links: [
      'Обзор',
      'Reading материалы',
      'Listening тесты',
      'Writing материалы',
      'Speaking материалы',
      'Архив Full Mock',
    ],
  },
  {
    name: 'blog editor',
    role: 'EDITOR',
    permissions: ['BLOG_MODERATOR'],
    groups: ['Обзор', 'Блог и авторы'],
    links: ['Обзор', 'Статьи блога', 'Заявки авторов'],
  },
  {
    name: 'combined writer',
    role: 'WRITER',
    permissions: ['BLOG_MODERATOR', 'CONTENT_EDITOR'],
    groups: ['Обзор', 'Учебные материалы', 'Блог и авторы'],
    links: [
      'Обзор',
      'Reading материалы',
      'Listening тесты',
      'Writing материалы',
      'Speaking материалы',
      'Архив Full Mock',
      'Статьи блога',
      'Заявки авторов',
    ],
  },
  {
    name: 'editor without capabilities',
    role: 'EDITOR',
    permissions: [],
    groups: ['Обзор'],
    links: ['Обзор'],
  },
  {
    name: 'administrator',
    role: 'ADMIN',
    permissions: [],
    groups: [
      'Обзор',
      'Учебные материалы',
      'Блог и авторы',
      'Пользователи',
      'Система',
    ],
    links: [
      'Обзор',
      'Аналитика',
      'Reading материалы',
      'Listening тесты',
      'Writing материалы',
      'Speaking материалы',
      'Архив Full Mock',
      'Статьи блога',
      'Заявки авторов',
      'Пользователи',
      'Waitlist',
      'AI-провайдеры',
      'Администраторы',
    ],
  },
]) {
  test(`${access.name}: only accessible sidebar groups`, async ({
    page,
  }, testInfo) => {
    await mock(page, access.role, access.permissions)
    await page.goto('admin')
    const nav = page.getByRole('navigation', { name: 'Администрирование' })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('heading')).toHaveText(access.groups)
    await expect(nav.getByRole('link')).toHaveText(access.links)
    await expect(
      nav.getByRole('link', { name: 'Обзор', exact: true }),
    ).toHaveAttribute('aria-current', 'page')
    await page.screenshot({
      path: testInfo.outputPath('grouped-sidebar.png'),
      fullPage: true,
    })
  })
}

for (const entry of [
  {
    permission: 'CONTENT_EDITOR',
    path: 'admin/blog/posts',
    endpoint: '/admin/blog/posts',
  },
  {
    permission: 'BLOG_MODERATOR',
    path: 'admin/reading/materials',
    endpoint: '/admin/reading/materials',
  },
  {
    permission: 'CONTENT_EDITOR',
    path: 'admin/users',
    endpoint: '/admin/users',
  },
  {
    permission: 'CONTENT_EDITOR',
    path: 'admin/analytics',
    endpoint: '/admin/analytics',
  },
  {
    permission: 'BLOG_MODERATOR',
    path: 'admin/ai-providers',
    endpoint: '/admin/ai-providers',
  },
  {
    permission: 'BLOG_MODERATOR',
    path: 'admin/reading/import',
    endpoint: '/admin/reading/import',
  },
]) {
  test(`${entry.permission} cannot deep-link to ${entry.path}`, async ({
    page,
  }) => {
    const state = await mock(page, 'EDITOR', [entry.permission])
    await page.goto(entry.path)
    await expect(page).toHaveURL(/forbidden/)
    expect(state.reads.some((path) => path.includes(entry.endpoint))).toBe(
      false,
    )
  })
}

test('mobile profile stays within viewport', async ({ page }, testInfo) => {
  await mock(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('admin/users/student-id')
  await expect(
    page.getByRole('heading', { name: user.displayName }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Меню', exact: true }).click()
  await expect(
    page.getByRole('navigation', { name: 'Администрирование' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Меню', exact: true }).click()
  await expect(
    page.getByRole('navigation', { name: 'Администрирование' }),
  ).toBeHidden()
  await page.screenshot({
    path: testInfo.outputPath('ielts-user-mobile.png'),
    fullPage: true,
  })
})
test('editor cannot open user management', async ({ page }) => {
  await mock(page, 'EDITOR')
  await page.goto('admin/users')
  await expect(page).toHaveURL(/forbidden/)
  await expect(page.getByLabel('Поиск пользователей')).toHaveCount(0)
})
test('public blog is hidden without loading posts', async ({ page }) => {
  let fetched = false
  await page.route('**/api/v1/blog/posts**', async (route) => {
    fetched = true
    return route.fulfill({ json: { items: [] } })
  })
  await page.goto('blog')
  await expect(
    page.getByRole('heading', { name: /страница потерялась/i }),
  ).toBeVisible()
  expect(fetched).toBe(false)
})

test('dashboard hides blog and writer links', async ({ page }, testInfo) => {
  await mock(page)
  await page.goto('./')
  await expect(
    page.getByRole('link', { name: 'Администрирование', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Блог', exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Мои статьи', exact: true }),
  ).toHaveCount(0)
  await page.screenshot({
    path: testInfo.outputPath('ielts-blog-hidden-dashboard.png'),
    fullPage: true,
  })
})
