import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function guestAPI(
  page: Page,
  restored = false,
  enabled = true,
  examTypes = ['academic', 'general'],
  siteKey = '',
) {
  let active = restored
  const starts: unknown[] = []
  const privateReads: string[] = []
  const session = {
    id: 'guest-mock',
    status: 'SUBMITTED',
    currentSection: 5,
    startedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    deadlineAt: new Date().toISOString(),
    mockTest: {
      title: 'Полный пробный IELTS',
      examType: 'academic',
      durationMinutes: 165,
    },
    overallBand: 6.5,
    sections: ['listening', 'reading', 'writing', 'speaking'].map(
      (skill, index) => ({
        position: index + 1,
        skill,
        attempt: {
          id: `${skill}-guest`,
          status: 'SUBMITTED',
          materialType: skill,
          band: 6.5,
        },
      }),
    ),
  }
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/auth/refresh'))
      return route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } })
    if (path.endsWith('/guest/config'))
      return route.fulfill({ json: { enabled, siteKey, examTypes } })
    if (path.endsWith('/guest/session'))
      return active
        ? route.fulfill({
            json: {
              id: 'guest-actor',
              expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
              sessionId: 'guest-mock',
            },
          })
        : route.fulfill({ status: 401, json: { code: 'GUEST_EXPIRED' } })
    if (path.endsWith('/guest/start')) {
      starts.push(route.request().postDataJSON())
      active = true
      return route.fulfill({ json: session })
    }
    if (path.endsWith('/full-mock-sessions/guest-mock'))
      return route.fulfill({ json: session })
    if (path.endsWith('/attempts/writing-guest'))
      return route.fulfill({
        json: {
          id: 'writing-guest',
          materialType: 'writing',
          status: 'SUBMITTED',
          band: 6.5,
          startedAt: new Date().toISOString(),
          writingEvaluation: {
            overallBand: 6.5,
            summary: 'Guest essay feedback',
            evaluatedAt: new Date().toISOString(),
            tasks: [],
            criteria: {
              taskResponse: { band: 6.5, feedback: 'Ideas are clear' },
              coherence: { band: 6.5, feedback: 'Structure is clear' },
              lexicalResource: { band: 6.5, feedback: 'Expand vocabulary' },
              grammar: { band: 6.5, feedback: 'Check articles' },
            },
          },
        },
      })
    if (!path.endsWith('/analytics/ping')) privateReads.push(path)
    return route.fulfill({ status: 403, json: { code: 'FORBIDDEN' } })
  })
  return { starts, privateReads }
}

test('anonymous visitor starts a mock, opens AI review and restores it after reload', async ({
  page,
}) => {
  const { starts, privateReads } = await guestAPI(page)
  await page.goto('./try')
  const start = page.getByRole('button', {
    name: 'Начать бесплатный Full Mock',
  })
  await expect(start).toBeEnabled()
  await expect(
    page.getByText('Бесплатно · Academic · 4 секции', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText(/Таймер каждой секции начнётся при её открытии/),
  ).toBeVisible()
  await expect(
    page.getByText(/Таймер начнётся сразу после запуска/),
  ).toHaveCount(0)
  await expect(page.getByRole('radio')).toHaveCount(0)
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await start.click()
  await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/guest-mock$/)
  await expect(page.getByText('Итоговый IELTS band')).toBeVisible()
  expect(starts).toEqual([
    { examType: 'academic', turnstileToken: '', acceptedTerms: true },
  ])
  await page.getByRole('link', { name: 'Разбор попытки' }).nth(2).click()
  await expect(page.getByText('Guest essay feedback')).toBeVisible()
  await expect(page.locator('#ai-assistant-widget')).toHaveCount(0)
  await page.reload()
  await expect(page.getByText('Guest essay feedback')).toBeVisible()
  await page.getByRole('link', { name: 'К пробному тесту' }).click()
  await expect(
    page.getByRole('link', { name: 'Открыть мой тест и результаты' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Начать бесплатный Full Mock' }),
  ).toHaveCount(0)
  expect(privateReads).toEqual([])
})

test('async Turnstile script renders and passes its challenge to start', async ({
  page,
}) => {
  const { starts } = await guestAPI(
    page,
    false,
    true,
    ['academic'],
    'test-site-key',
  )
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile = {
      ready() { throw new Error('ready is incompatible with async script loading') },
      render(element, options) {
        element.textContent = 'Challenge verified'; options.callback('verified-test-token'); return 'test-widget';
      }, remove() {}
    }`,
      }),
  )
  await page.goto('./try')
  await expect(page.getByText('Challenge verified')).toBeVisible()
  await page
    .getByRole('button', { name: 'Начать бесплатный Full Mock' })
    .click()
  await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/guest-mock$/)
  expect(starts).toEqual([
    {
      examType: 'academic',
      turnstileToken: 'verified-test-token',
      acceptedTerms: true,
    },
  ])
})

test('trial always launches Academic without choosing a format', async ({
  page,
}) => {
  const { starts } = await guestAPI(page, false, true, ['academic'])
  await page.goto('./try')
  await expect(page.getByRole('radio')).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Начать бесплатный Full Mock' })
    .click()
  await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/guest-mock$/)
  expect(starts).toEqual([
    { examType: 'academic', turnstileToken: '', acceptedTerms: true },
  ])
})

test('visitor browses the normal site with locked tests and no private API reads', async ({
  page,
}) => {
  const { privateReads, starts } = await guestAPI(page)
  for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
    const suffix = skill === 'listening' ? 'tests' : 'materials'
    await page.route(`**/api/v1/${skill}/${suffix}`, (route) =>
      route.fulfill({
        json: {
          items: [
            {
              id: `locked-${skill}`,
              title: `Locked ${skill} test`,
              examType: 'academic',
              durationMinutes: 40,
              difficulty: 'intermediate',
            },
          ],
        },
      }),
    )
  }
  await page.goto('./')
  await expect(
    page.getByRole('navigation', { name: 'Основная навигация', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Начать бесплатный Full Mock' }),
  ).toBeEnabled()
  for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
    await page.goto(`./${skill}`)
    await expect(page.getByText(`Locked ${skill} test`)).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Войти в аккаунт', exact: true }).last(),
    ).toBeVisible()
    await expect(page.locator('a[href*="/exam/"]')).toHaveCount(0)
    await expect(page.locator('#ai-assistant-widget')).toHaveCount(0)
  }
  for (const path of [
    'profile',
    'plan',
    'progress',
    'mistakes',
    'exam/writing/another-test',
  ]) {
    await page.goto(`./${path}`)
    await expect(
      page.getByRole('heading', {
        name: 'Войдите в аккаунт, чтобы продолжить',
      }),
    ).toBeVisible()
    await expect(page.locator('#ai-assistant-widget')).toHaveCount(0)
  }
  await page.goto('./admin')
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  expect(starts).toEqual([])
  expect(privateReads).toEqual([])
})

test('disabled guest mode explains availability and never enables start on mobile', async ({
  page,
}, testInfo) => {
  await guestAPI(page, false, false)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  await expect(
    page.getByRole('button', { name: 'Начать бесплатный Full Mock' }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('guest-trial-mobile.png'),
    fullPage: true,
  })
})

test('anonymous dashboard and navigation fit a mobile screen', async ({
  page,
}, testInfo) => {
  await guestAPI(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await expect(
    page.getByRole('button', { name: 'Начать бесплатный Full Mock' }),
  ).toBeEnabled()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.getByRole('button', { name: 'Открыть меню' }).click()
  await expect(
    page.getByRole('navigation', { name: 'Основная навигация', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Практика', exact: true }).click()
  await expect(page).toHaveURL(/\/practice$/)
  await expect(page.locator('#ai-assistant-widget')).toHaveCount(0)
  await page.screenshot({
    path: testInfo.outputPath('guest-site-mobile.png'),
    fullPage: true,
  })
})

async function mockModalGoogle(page: Page) {
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.google = { accounts: { id: {
      initialize(options) { window.modalGoogleOptions = options },
      renderButton(container) {
        const button = document.createElement('button');
        button.textContent = 'Continue with Google';
        button.onclick = () => window.modalGoogleOptions.callback({credential: 'modal-google-token'});
        container.replaceChildren(button);
      }
    } } }`,
    }),
  )
}

const modalAccount = {
  accessToken: 'account-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user: {
    id: 'registered-student',
    email: 'student@example.test',
    phone: '+77001234567',
    displayName: 'Student',
    role: 'STUDENT',
    currentBand: null,
    targetBand: null,
    examDate: null,
    examType: 'academic',
    timezone: 'Asia/Almaty',
    createdAt: '2026-10-07T00:00:00Z',
    updatedAt: '2026-10-07T00:00:00Z',
  },
}

async function modalWritingCatalog(page: Page) {
  await page.route('**/api/v1/writing/materials', (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id: 'writing-test',
            title: 'Account Writing Test',
            examType: 'academic',
            difficulty: 'intermediate',
            durationMinutes: 60,
          },
        ],
      },
    }),
  )
}

test('all four practice cards show login in place and restore focus after Escape', async ({
  page,
}) => {
  const { starts, privateReads } = await guestAPI(page)
  await mockModalGoogle(page)
  await page.goto('./')
  const dialog = page.getByRole('dialog', { name: 'Войти или создать аккаунт' })
  for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
    const card = page.locator(`main a[href="/app/${skill}"]`)
    await card.click()
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: 'Continue with Google' }),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/app\/?$/)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(card).toBeFocused()
  }
  expect(starts).toEqual([])
  expect(privateReads).toEqual([])
  await expect(
    page.getByRole('button', { name: 'Начать бесплатный Full Mock' }),
  ).toBeEnabled()
})

test('sign-in buttons and locked sidebar actions open the same dialog without navigating', async ({
  page,
}) => {
  await guestAPI(page)
  await mockModalGoogle(page)
  await page.goto('./')
  const dialog = page.getByRole('dialog', { name: 'Войти или создать аккаунт' })
  await page
    .getByRole('link', { name: 'Войти в аккаунт', exact: true })
    .first()
    .click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('link', { name: 'План подготовки', exact: true }).click()
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(/\/app\/?$/)
  await dialog
    .getByRole('button', { name: 'Продолжить без регистрации' })
    .click()
  await modalWritingCatalog(page)
  await page.goto('./writing')
  await page
    .locator('main')
    .getByRole('link', { name: 'Войти в аккаунт', exact: true })
    .click()
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(/\/writing$/)
})

for (const registration of [false, true]) {
  test(`modal ${registration ? 'registration' : 'login'} unlocks the selected practice section`, async ({
    page,
  }) => {
    await guestAPI(page)
    await mockModalGoogle(page)
    await modalWritingCatalog(page)
    await page.route('**/api/v1/auth/google', (route) => {
      expect(route.request().postDataJSON()).toEqual({
        googleToken: 'modal-google-token',
      })
      return route.fulfill({
        json: registration
          ? {
              registrationRequired: true,
              registrationToken: 'modal-registration',
              profile: {
                email: 'student@example.test',
                name: 'Student',
                phone: '+77001234567',
              },
            }
          : modalAccount,
      })
    })
    await page.route('**/api/v1/auth/google/complete', (route) => {
      expect(route.request().postDataJSON()).toEqual({
        registrationToken: 'modal-registration',
        name: 'Student',
        phone: '+77001234567',
        acceptedTerms: true,
      })
      return route.fulfill({ status: 201, json: modalAccount })
    })
    await page.route('**/api/v1/attempts*', (route) =>
      route.fulfill({ json: { items: [] } }),
    )
    await page.goto('./')
    await page.locator('main a[href="/app/writing"]').click()
    const dialog = page.getByRole('dialog', {
      name: 'Войти или создать аккаунт',
    })
    await dialog.getByRole('button', { name: 'Continue with Google' }).click()
    if (registration) {
      await expect(
        dialog.getByText('Давайте создадим вам аккаунт'),
      ).toBeVisible()
      await expect(page).toHaveURL(/\/app\/?$/)
      await dialog.locator('#acceptedTerms').check()
      await dialog
        .getByRole('button', { name: 'Создать аккаунт', exact: true })
        .click()
    }
    await expect(page).toHaveURL(/\/writing$/)
    await expect(dialog).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'Начать Writing' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Открыть профиль' }),
    ).toContainText('Student')
  })
}

test('mobile login dialog fits and can be dismissed without starting a trial', async ({
  page,
}) => {
  const { starts } = await guestAPI(page)
  await mockModalGoogle(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await page.locator('main a[href="/app/reading"]').click()
  const dialog = page.getByRole('dialog', { name: 'Войти или создать аккаунт' })
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  await dialog
    .getByRole('button', { name: 'Продолжить без регистрации' })
    .click()
  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL(/\/app\/?$/)
  expect(starts).toEqual([])
})
