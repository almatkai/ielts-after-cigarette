import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const user = {
  id: 'brand-student',
  role: 'STUDENT',
  email: 'student@example.test',
  displayName: 'Student',
  timezone: 'Asia/Almaty',
  examType: 'academic',
  currentBand: 6,
  targetBand: 7.5,
  examDate: '2026-12-04',
}
const material = {
  id: 'brand-reading',
  slug: 'brand-reading',
  kind: 'PASSAGE',
  examType: 'academic',
  difficulty: 'intermediate',
  title: 'Reading practice',
  description: '',
  durationMinutes: 60,
  body: 'The library is a place for learning. Students read, discuss ideas and develop their understanding of the world. A quiet environment helps them focus on the text.',
  questionGroups: [
    {
      id: 'group',
      position: 1,
      type: 'short_answer',
      instructions: 'Write ONE WORD ONLY for each answer.',
      questions: [1, 2, 3].map((n) => ({
        id: `q${n}`,
        position: n,
        number: n,
        prompt: `Question ${n}`,
        points: 1,
        content: { number: n },
      })),
    },
  ],
}
const attempt = {
  id: 'brand-attempt',
  materialId: material.id,
  materialVersionId: 'brand-version',
  materialType: 'reading',
  status: 'SUBMITTED',
  score: 2,
  maxScore: 3,
  band: 6.5,
  startedAt: '2026-10-22T10:00:00Z',
  submittedAt: '2026-10-22T10:20:00Z',
  review: [1, 2, 3].map((n) => ({
    questionId: `q${n}`,
    number: n,
    prompt: `Question ${n}`,
    type: 'short_answer',
    content: {},
    answer: { value: n === 3 ? 'park' : 'library' },
    isCorrect: n !== 3,
    pointsAwarded: n === 3 ? 0 : 1,
    correctAnswer: { accepted: ['library'] },
    explanation: 'The answer is stated in the passage.',
  })),
}

async function fixtures(page: Page, signedIn = true) {
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: 'window.google={accounts:{id:{initialize(){},renderButton(c){const b=document.createElement("button");b.textContent="Continue with Google";c.append(b)}}}}',
    }),
  )
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/auth/refresh'))
      return signedIn
        ? route.fulfill({
            json: {
              accessToken: 'mock-token',
              tokenType: 'Bearer',
              expiresIn: 3600,
              user,
            },
          })
        : route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED' } })
    if (path.includes('/guest/session'))
      return route.fulfill({ status: 404, json: { code: 'NOT_FOUND' } })
    if (path.endsWith('/profile')) return route.fulfill({ json: user })
    if (path.endsWith('/dashboard'))
      return route.fulfill({
        json: {
          profile: user,
          recommendedAction: {
            type: 'practice',
            title: 'Практика',
            description: 'Выберите секцию',
            target: '/practice',
          },
          todayPlan: [],
          skillProgress: ['listening', 'reading', 'writing', 'speaking'].map(
            (skill, index) => ({
              skill,
              estimatedBand: 5.5 + index * 0.5,
              accuracyPercent: 60 + index * 5,
              completedTasks: index + 1,
            }),
          ),
          unreadNotifications: 0,
        },
      })
    if (path.endsWith(`/reading/materials/${material.id}/attempts`))
      return route.fulfill({
        json: {
          material,
          attempt: {
            ...attempt,
            id: 'brand-live-attempt',
            startedAt: new Date().toISOString(),
            status: 'IN_PROGRESS',
            submittedAt: null,
            review: [],
            band: null,
          },
        },
      })
    if (path.endsWith('/attempts/brand-live-attempt'))
      return route.fulfill({
        json: {
          ...attempt,
          id: 'brand-live-attempt',
          startedAt: new Date().toISOString(),
          status: 'IN_PROGRESS',
          submittedAt: null,
          review: [],
          answers: [],
          band: null,
        },
      })
    if (path.endsWith('/attempts/brand-attempt/material'))
      return route.fulfill({ json: material })
    if (path.endsWith('/attempts/brand-attempt/answers'))
      return route.fulfill({ json: { items: [] } })
    if (path.endsWith('/attempts/brand-attempt'))
      return route.fulfill({ json: attempt })
    if (path.includes('/attempts/brand-attempt/'))
      return route.fulfill({ json: attempt })
    return route.fulfill({ json: { items: [] } })
  })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('daiyndyq-language', 'ru'),
  )
})

const fox = (page: Page) => page.getByTestId('yuki-fox')
const chat = (page: Page) => page.locator('#ai-assistant-widget')

test('Yuki: hint dismissal is session-only; preferences and focus sync across settings/profile/tabs', async ({
  page,
  context,
}) => {
  await fixtures(page)
  await page.goto('./practice')
  await expect(fox(page)).toBeVisible()
  await expect(page.getByTestId('yuki-hint')).toBeVisible()
  await page
    .getByRole('button', { name: 'Скрыть подсказку', exact: true })
    .click()
  expect(
    await page.evaluate(() => localStorage.getItem('iac_show_mascot')),
  ).toBeNull()
  await expect(fox(page)).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('yuki-hint')).toHaveCount(0)
  await fox(page).focus()
  const hide = page.getByRole('button', { name: 'Скрыть питомца', exact: true })
  await expect(hide).toHaveCSS('opacity', '1')
  await hide.click()
  const compact = page.getByTestId('yuki-compact')
  await expect(compact).toBeFocused()
  expect(
    await page.evaluate(() => localStorage.getItem('iac_show_mascot')),
  ).toBe('false')
  await compact.press('Enter')
  await expect(chat(page).locator('input')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(compact).toBeFocused()

  const other = await context.newPage()
  await fixtures(other)
  await other.goto('./profile')
  const profileToggle = other.getByRole('switch', {
    name: 'Показывать питомца (Юки)',
  })
  await expect(profileToggle).not.toBeChecked()
  await page.goto('./settings')
  const settingsToggle = page.getByRole('switch', {
    name: 'Показывать питомца (Юки)',
  })
  await settingsToggle.click()
  await expect(fox(page)).toBeVisible()
  await expect(profileToggle).toBeChecked()
  await expect(fox(other)).toBeVisible()
  await profileToggle.click()
  await expect(settingsToggle).not.toBeChecked()
  await expect(page.getByTestId('yuki-compact')).toBeVisible()
  await other.close()
})

test('Yuki: original cached avatar loads; animated fox tracks fine pointer and pauses in hidden document', async ({
  page,
}) => {
  await fixtures(page)
  await page.goto('./practice')
  await expect(fox(page)).toBeVisible()
  await expect(fox(page).locator('.animate-fox-float')).toHaveCSS(
    'animation-name',
    'foxFloat',
  )
  const bounds = await fox(page).boundingBox()
  await page.mouse.move(bounds!.x - 50, bounds!.y - 30)
  await expect
    .poll(() =>
      fox(page).locator('[data-part="eyes"] > g').getAttribute('style'),
    )
    .toContain('translate(')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(fox(page).locator('.animate-fox-float')).toHaveCSS(
    'animation-play-state',
    'paused',
  )
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(fox(page).locator('.animate-fox-float')).toHaveCSS(
    'animation-play-state',
    'running',
  )
  await fox(page).click()
  await expect(chat(page).locator('input')).toBeFocused()
  const avatars = chat(page).locator('img[src*="yuki-avatar.svg"]')
  await expect(avatars).toHaveCount(2)
  for (const avatar of await avatars.all()) {
    expect(
      await avatar.evaluate(
        (image) =>
          image instanceof HTMLImageElement &&
          image.complete &&
          image.naturalWidth > 0,
      ),
    ).toBe(true)
    await expect(avatar).toHaveAttribute('alt', '')
    expect(
      await avatar.evaluate((image) => image.getBoundingClientRect().width),
    ).toBeGreaterThanOrEqual(22)
  }
  const asset = await page.request.get('/app/yuki-avatar.svg')
  expect(asset.ok()).toBe(true)
  expect(await asset.text()).toContain('viewBox="265 300 860 860"')
  expect(await asset.text()).not.toMatch(/magic-spark|magicGlow|animate-fox/)
  await expect(chat(page).locator('.bg-success')).toHaveCount(1)
  await chat(page)
    .getByRole('button', { name: 'Закрыть чат', exact: true })
    .click()
  await expect(fox(page)).toBeFocused()
})

test('Yuki: reduced motion removes animation and tracking, including live preference changes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const original = window.addEventListener.bind(window)
    window.addEventListener = ((
      ...args: Parameters<typeof window.addEventListener>
    ) => {
      if (args[0] === 'mousemove')
        document.documentElement.dataset.mouseListeners = String(
          Number(document.documentElement.dataset.mouseListeners ?? 0) + 1,
        )
      original(...args)
    }) as typeof window.addEventListener
  })
  await fixtures(page)
  await page.goto('./practice')
  await expect(fox(page)).toBeVisible()
  await expect(fox(page).locator('[class*="animate-fox-"]')).toHaveCount(0)
  expect(
    await page.locator('html').getAttribute('data-mouse-listeners'),
  ).toBeNull()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(fox(page).locator('.animate-fox-float')).toHaveCSS(
    'animation-name',
    'foxFloat',
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(fox(page).locator('[class*="animate-fox-"]')).toHaveCount(0)
  await expect(fox(page).locator('[data-part="eyes"] > g')).not.toHaveAttribute(
    'style',
    /transform|transition/,
  )
  await fox(page).click()
  await expect(chat(page).locator('input')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(fox(page)).toBeFocused()
})

for (const theme of ['light', 'dark']) {
  for (const width of [360, 768, 1440]) {
    test(`Yuki: ${theme} ${width}px reserves essential actions, targets, drawer and avatar`, async ({
      page,
    }) => {
      await fixtures(page)
      await page.setViewportSize({
        width,
        height: width === 360 ? 740 : width === 768 ? 1024 : 900,
      })
      await page.addInitScript(
        (mode) => localStorage.setItem('yrys-theme', mode),
        theme,
      )
      for (const path of ['./', './practice', './settings', './profile']) {
        await page.goto(path)
        await expect(fox(page)).toBeVisible()
        expect(
          await fox(page).evaluate((el) => el.getBoundingClientRect().width),
        ).toBe(width < 640 ? 80 : width < 1024 ? 112 : 136)
        const action = page
          .locator(
            'main button:visible:not([disabled]), main a:visible, main [role="switch"]:visible',
          )
          .last()
        await action.scrollIntoViewIfNeeded()
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        )
        await action.click({ trial: true })
        expect(
          await page
            .locator('main')
            .evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom)),
        ).toBeGreaterThanOrEqual(width < 640 ? 104 : width < 1024 ? 136 : 160)
      }
      await fox(page).focus()
      for (const target of [
        fox(page),
        page.getByRole('button', { name: 'Скрыть питомца', exact: true }),
        ...(await page
          .getByRole('button', { name: 'Скрыть подсказку', exact: true })
          .all()),
      ]) {
        const box = await target.boundingBox()
        expect(box!.width).toBeGreaterThanOrEqual(44)
        expect(box!.height).toBeGreaterThanOrEqual(44)
      }
      if (width < 1024) {
        await page
          .getByRole('button', { name: 'Открыть меню', exact: true })
          .click()
        await expect(fox(page)).toHaveCount(0)
        await page.keyboard.press('Escape')
        await expect(fox(page)).toBeVisible()
      }
      await fox(page).click()
      await expect(chat(page).locator('input')).toBeFocused()
      await expect(
        chat(page).locator('img[src*="yuki-avatar.svg"]').first(),
      ).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(fox(page)).toBeFocused()
    })
  }
}

test('Yuki: mobile introduction appears once per session without hiding the fox', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await fixtures(page)
  await page.goto('./practice')
  await expect(page.getByTestId('yuki-hint')).toBeVisible()
  await page.reload()
  await expect(fox(page)).toBeVisible()
  await expect(page.getByTestId('yuki-hint')).toHaveCount(0)
  expect(
    await page.evaluate(() => localStorage.getItem('iac_show_mascot')),
  ).toBeNull()
})
