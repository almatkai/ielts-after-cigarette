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
  let claimed = false
  let currentSessionId = 'guest-mock'
  const claims: string[] = []
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
      return claimed
        ? route.fulfill({ json: modalAccount })
        : route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } })
    if (path.endsWith('/guest/config'))
      return route.fulfill({ json: { enabled, siteKey, examTypes } })
    if (path.endsWith('/guest/session'))
      return active && !claimed
        ? route.fulfill({
            json: {
              id: 'guest-actor',
              expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
              sessionId: currentSessionId,
            },
          })
        : route.fulfill({ status: 401, json: { code: 'GUEST_EXPIRED' } })
    if (path.endsWith('/guest/claim')) {
      claims.push(route.request().headers().authorization)
      claimed = true
      return route.fulfill({ json: { sessionId: 'guest-mock' } })
    }
    const report = claimed
      ? session
      : {
          ...session,
          resultsLocked: true,
          sections: session.sections.map((section) => ({
            ...section,
            attempt: {
              ...section.attempt,
              band: null,
              score: null,
              maxScore: null,
            },
          })),
        }
    const retake = {
      ...report,
      id: 'guest-retake',
      status: 'IN_PROGRESS',
      currentSection: 1,
      submittedAt: null,
      overallBand: null,
      sections: report.sections.map((section) => ({
        ...section,
        startedAt: null,
        deadlineAt: null,
        attempt: {
          ...section.attempt,
          id: `${section.skill}-retake`,
          status: 'IN_PROGRESS',
          band: null,
        },
      })),
    }
    if (path.endsWith('/guest/start')) {
      const input = route.request().postDataJSON()
      starts.push(input)
      active = true
      if (input.retakeSessionId) {
        currentSessionId = retake.id
        return route.fulfill({ json: retake })
      }
      return route.fulfill({ json: report })
    }
    if (path.endsWith('/full-mock-sessions/guest-retake'))
      return route.fulfill({ json: retake })
    if (path.endsWith('/full-mock-sessions/guest-mock'))
      return route.fulfill({ json: report })
    if (path.endsWith('/attempts/writing-guest'))
      return route.fulfill({
        json: {
          id: 'writing-guest',
          materialType: 'writing',
          status: 'SUBMITTED',
          band: claimed ? 6.5 : null,
          startedAt: new Date().toISOString(),
          ...(!claimed
            ? {
                guestPreview: {
                  totalMistakes: 10,
                  availableMistakes: 3,
                  improvements: Array.from({ length: 10 }, (_, index) => ({
                    number: index + 1,
                    label: 'Task 1',
                    locked: index >= 3,
                    ...(index < 3
                      ? { text: `Guest essay improvement ${index + 1}` }
                      : {}),
                  })),
                },
              }
            : {
                writingEvaluation: {
                  overallBand: 6.5,
                  summary: 'Guest essay feedback',
                  evaluatedAt: new Date().toISOString(),
                  tasks: [],
                  criteria: {
                    taskResponse: { band: 6.5, feedback: 'Ideas are clear' },
                    coherence: { band: 6.5, feedback: 'Structure is clear' },
                    lexicalResource: {
                      band: 6.5,
                      feedback: 'Expand vocabulary',
                    },
                    grammar: { band: 6.5, feedback: 'Check articles' },
                  },
                },
              }),
        },
      })
    if (
      path.endsWith('/attempts/reading-guest') ||
      path.endsWith('/attempts/listening-guest')
    ) {
      const skill = path.includes('reading-guest') ? 'reading' : 'listening'
      return route.fulfill({
        json: {
          id: `${skill}-guest`,
          materialType: skill,
          status: 'SUBMITTED',
          band: claimed ? 6.5 : null,
          startedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          ...(!claimed
            ? { guestPreview: { totalMistakes: 10, availableMistakes: 3 } }
            : {}),
          review: Array.from({ length: 11 }, (_, index) => {
            const isCorrect = index === 10
            const locked = !claimed && !isCorrect && index >= 3
            return {
              questionId: `question-${index + 1}`,
              number: index + 1,
              prompt: `Question ${index + 1}`,
              type: 'short_answer',
              answer: { value: 'my answer' },
              isCorrect,
              pointsAwarded: isCorrect ? 1 : 0,
              locked,
              correctAnswer: locked ? null : { value: `correct-${index + 1}` },
              explanation: locked ? '' : `Explanation ${index + 1}`,
              ...(!locked
                ? {
                    passageBody: 'A reading passage for review.',
                    hint: 'Read closely',
                  }
                : {}),
            }
          }),
        },
      })
    }
    if (path.endsWith('/attempts/listening-guest/material'))
      return route.fulfill({
        json: {
          id: 'listening-test',
          title: 'Trial Listening',
          durationMinutes: 40,
          parts: [],
        },
      })
    if (!path.endsWith('/analytics/ping')) privateReads.push(path)
    return route.fulfill({ status: 403, json: { code: 'FORBIDDEN' } })
  })
  return { starts, privateReads, claims }
}

test('anonymous visitor starts a mock, opens 30% AI review and restores it after reload', async ({
  page,
}) => {
  const { starts, privateReads } = await guestAPI(page)
  await page.goto('./try')
  const start = page.getByRole('button', {
    name: 'Начать бесплатный Full Mock',
  })
  await expect(start).toBeEnabled()
  await expect(
    page.getByText(
      'Проверьте свой уровень IELTS — пройдите полный пробный тест.',
      { exact: true },
    ),
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
  await expect(
    page.getByRole('button', { name: /войти, чтобы увидеть оценку/ }),
  ).toHaveCount(4)
  await page.getByRole('link', { name: 'Разобрать ошибки' }).nth(2).click()
  await expect(
    page.getByText('Разборов без входа: 3 из 10.', { exact: false }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Разобрать рекомендацию 1', exact: true })
    .click()
  await expect(
    page.getByText('Guest essay improvement 1', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#ai-assistant-widget')).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByText('Без аккаунта доступны 30% ошибок', { exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'К результату' }).click()
  await expect(page.getByText('Итоговый IELTS band')).toBeVisible()
  await page.goto('./try')
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

for (const skill of ['reading', 'listening']) {
  for (const mobile of [false, true]) {
    test(`${skill} guest exposes exactly 3 of 10 mistake dialogs${mobile ? ' on mobile' : ''}`, async ({
      page,
    }, testInfo) => {
      const { privateReads } = await guestAPI(page, true)
      await mockModalGoogle(page)
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`./attempts/${skill}-guest`)
      await expect(
        page.getByText('Без аккаунта доступны 30% ошибок', { exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: /^Разобрать ошибку \d+$/ }),
      ).toHaveCount(3)
      await expect(
        page.getByRole('button', {
          name: /Разобрать ошибку .*войти в аккаунт/,
        }),
      ).toHaveCount(7)
      await expect(page.getByText('Question 11', { exact: true })).toHaveCount(
        0,
      )
      await expect(
        page.getByText('Explanation 4', { exact: true }),
      ).toHaveCount(0)
      await page.screenshot({
        path: testInfo.outputPath('guest-review-preview.png'),
      })
      await page
        .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
        .click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(
        page.getByRole('dialog').getByText('Question 1', { exact: true }),
      ).toBeVisible()
      await page.keyboard.press('Escape')
      const locked = page.getByRole('button', {
        name: 'Разобрать ошибку 4: войти в аккаунт',
        exact: true,
      })
      await locked.click()
      const login = page.getByRole('dialog', {
        name: 'Войти или создать аккаунт',
      })
      await expect(login).toBeVisible()
      await expect(
        login.getByText(/Завершённый пробный тест сохранится/).first(),
      ).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(locked).toBeFocused()
      await page.reload()
      await expect(
        page.getByRole('button', { name: /^Разобрать ошибку \d+$/ }),
      ).toHaveCount(3)
      expect(privateReads.filter((path) => path.endsWith('/material'))).toEqual(
        [],
      )
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
    })
  }
}

for (const registration of [false, true]) {
  test(`guest report ${registration ? 'registration' : 'login'} claims the mock and unlocks section bands`, async ({
    page,
  }) => {
    const { claims } = await guestAPI(page, true)
    await mockModalGoogle(page)
    await page.route('**/api/v1/auth/google', (route) =>
      route.fulfill({
        json: registration
          ? {
              registrationRequired: true,
              registrationToken: 'result-registration',
              profile: {
                email: modalAccount.user.email,
                name: 'Student',
                phone: '+77001234567',
              },
            }
          : modalAccount,
      }),
    )
    await page.route('**/api/v1/auth/google/complete', (route) =>
      route.fulfill({ status: 201, json: modalAccount }),
    )
    await page.goto('./exam/full-mock-sessions/guest-mock')
    await expect(page.getByText('6.5', { exact: true })).toHaveCount(1)
    await page
      .getByRole('button', {
        name: 'Reading: войти, чтобы увидеть оценку',
        exact: true,
      })
      .click()
    const login = page.getByRole('dialog', {
      name: 'Войти или создать аккаунт',
    })
    await login.getByRole('button', { name: 'Continue with Google' }).click()
    if (registration) {
      await login.locator('#acceptedTerms').check()
      await login
        .getByRole('button', { name: 'Создать аккаунт', exact: true })
        .click()
    }
    await expect(login).toHaveCount(0)
    await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/guest-mock$/)
    await expect(page.getByText('6.5', { exact: true })).toHaveCount(5)
    await expect(
      page.getByRole('button', { name: /войти, чтобы увидеть оценку/ }),
    ).toHaveCount(0)
    expect(claims).toEqual(['Bearer account-token'])
    await page
      .getByRole('link', { name: 'Reading: работа над ошибками', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Разобрать ошибку 10', exact: true })
      .click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Показать решение', exact: true })
      .click()
    await expect(
      page.getByText('Explanation 10', { exact: true }),
    ).toBeVisible()
    await page.reload()
    await page
      .getByRole('button', { name: 'Разобрать ошибку 10', exact: true })
      .click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Показать решение', exact: true })
      .click()
    await expect(
      page.getByText('Explanation 10', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Без аккаунта доступны 30% ошибок', { exact: true }),
    ).toHaveCount(0)
  })
}

test('failed guest result claim keeps the preview locked and permits retry', async ({
  page,
}) => {
  const { claims } = await guestAPI(page, true)
  await mockModalGoogle(page)
  await page.route('**/api/v1/auth/google', (route) =>
    route.fulfill({ json: modalAccount }),
  )
  let failed = false
  await page.route('**/api/v1/guest/claim', (route) => {
    if (failed) return route.fallback()
    failed = true
    return route.fulfill({
      status: 503,
      json: {
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'Не удалось сохранить результаты',
      },
    })
  })
  await page.goto('./exam/full-mock-sessions/guest-mock')
  await page
    .getByRole('button', { name: 'Writing: войти, чтобы увидеть оценку' })
    .click()
  const login = page.getByRole('dialog', { name: 'Войти или создать аккаунт' })
  await login.getByRole('button', { name: 'Continue with Google' }).click()
  await expect(login.getByRole('alert')).toContainText(
    'Сервис временно недоступен',
  )
  await expect(page.getByText('6.5', { exact: true })).toHaveCount(1)
  await login.getByRole('button', { name: 'Continue with Google' }).click()
  await expect(login).toHaveCount(0)
  await expect(page.getByText('6.5', { exact: true })).toHaveCount(5)
  expect(claims).toEqual(['Bearer account-token'])
})

test('registration retries a failed claim without registering the account twice', async ({
  page,
}) => {
  await guestAPI(page, true)
  await mockModalGoogle(page)
  await page.route('**/api/v1/auth/google', (route) =>
    route.fulfill({
      json: {
        registrationRequired: true,
        registrationToken: 'one-shot-registration',
        profile: {
          email: modalAccount.user.email,
          name: 'Student',
          phone: '+77001234567',
        },
      },
    }),
  )
  let registrations = 0
  await page.route('**/api/v1/auth/google/complete', (route) => {
    registrations++
    return route.fulfill({ status: 201, json: modalAccount })
  })
  let failed = false
  await page.route('**/api/v1/guest/claim', (route) => {
    if (failed) return route.fallback()
    failed = true
    return route.fulfill({
      status: 503,
      json: { code: 'DEPENDENCY_UNAVAILABLE' },
    })
  })
  await page.goto('./exam/full-mock-sessions/guest-mock')
  await page
    .getByRole('button', { name: 'Reading: войти, чтобы увидеть оценку' })
    .click()
  const login = page.getByRole('dialog', { name: 'Войти или создать аккаунт' })
  await login.getByRole('button', { name: 'Continue with Google' }).click()
  await login.locator('#acceptedTerms').check()
  const submit = login.getByRole('button', {
    name: 'Создать аккаунт',
    exact: true,
  })
  await submit.click()
  await expect(login.getByText(/Сервис временно недоступен/)).toBeVisible()
  await submit.click()
  await expect(login).toHaveCount(0)
  await expect(page.getByText('6.5', { exact: true })).toHaveCount(5)
  expect(registrations).toBe(1)
})

test('sign-in from a locked mistake opens the complete review on the same page', async ({
  page,
}) => {
  const { claims } = await guestAPI(page, true)
  await mockModalGoogle(page)
  await page.route('**/api/v1/auth/google', (route) =>
    route.fulfill({ json: modalAccount }),
  )
  await page.goto('./attempts/reading-guest')
  await page
    .getByRole('button', {
      name: 'Разобрать ошибку 10: войти в аккаунт',
      exact: true,
    })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Continue with Google' })
    .click()
  await expect(page).toHaveURL(/\/attempts\/reading-guest$/)
  await page
    .getByRole('button', { name: 'Разобрать ошибку 10', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Показать решение', exact: true })
    .click()
  await expect(page.getByText('Explanation 10', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Без аккаунта доступны 30% ошибок', { exact: true }),
  ).toHaveCount(0)
  expect(claims).toEqual(['Bearer account-token'])
})

test('fresh authenticated restore claims a completed guest mock before loading its report', async ({
  page,
}) => {
  const { claims } = await guestAPI(page, true)
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({ json: modalAccount }),
  )
  await page.goto('./exam/full-mock-sessions/guest-mock')
  await expect(page.getByText('6.5', { exact: true })).toHaveCount(5)
  expect(claims).toEqual(['Bearer account-token'])
  await expect(
    page.getByRole('button', { name: /войти, чтобы увидеть оценку/ }),
  ).toHaveCount(0)
})

test('zero guest mistakes does not fabricate a free error', async ({
  page,
}) => {
  await guestAPI(page, true)
  await page.route('**/api/v1/attempts/reading-guest', (route) =>
    route.fulfill({
      json: {
        id: 'reading-guest',
        materialType: 'reading',
        status: 'SUBMITTED',
        band: null,
        startedAt: new Date().toISOString(),
        review: [],
        guestPreview: { totalMistakes: 0, availableMistakes: 0 },
      },
    }),
  )
  await page.goto('./attempts/reading-guest')
  await expect(
    page.getByText('В этой секции нет ошибок.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /^Разобрать ошибку/ }),
  ).toHaveCount(0)
})

for (const mobile of [false, true]) {
  test(`guest can retake a completed mock${mobile ? ' on mobile' : ''}`, async ({
    page,
  }) => {
    const { starts } = await guestAPI(page, true)
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('./exam/full-mock-sessions/guest-mock')
    await page
      .getByRole('button', { name: 'Пересдать тест', exact: true })
      .click()
    const dialog = page.getByRole('alertdialog', {
      name: 'Пересдать полный тест?',
    })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Отмена', exact: true }).click()
    expect(starts).toEqual([])
    await page
      .getByRole('button', { name: 'Пересдать тест', exact: true })
      .click()
    await dialog
      .getByRole('button', { name: 'Начать заново', exact: true })
      .click()
    await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/guest-retake$/)
    await expect(
      page.getByText('Секции идут строго по порядку.', { exact: false }),
    ).toBeVisible()
    expect(starts).toEqual([
      {
        examType: 'academic',
        acceptedTerms: true,
        retakeSessionId: 'guest-mock',
      },
    ])
    await expect(
      page.getByRole('button', { name: 'Пересдать тест', exact: true }),
    ).toHaveCount(0)
    await page.reload()
    await expect(
      page.getByText('Секции идут строго по порядку.', { exact: false }),
    ).toBeVisible()
    await page.goto('./')
    await page
      .getByRole('link', { name: 'Открыть мой тест и результаты', exact: true })
      .click()
    await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/guest-retake$/)
    await page.goto('./exam/full-mock-sessions/guest-mock')
    await expect(page.getByText('6.5', { exact: true })).toHaveCount(1)
    await expect(
      page.getByRole('button', { name: /войти, чтобы увидеть оценку/ }),
    ).toHaveCount(4)
    await page
      .getByRole('link', { name: 'Открыть последнюю попытку', exact: true })
      .click()
    await expect(page).toHaveURL(/\/exam\/full-mock-sessions\/guest-retake$/)
    expect(starts).toHaveLength(1)
  })
}

test('guest can retake a mock completed without a grade', async ({ page }) => {
  await guestAPI(page, true)
  await page.route('**/api/v1/full-mock-sessions/guest-mock', (route) =>
    route.fulfill({
      json: {
        id: 'guest-mock',
        status: 'SUBMITTED',
        currentSection: 5,
        mockTest: {
          title: 'Полный пробный IELTS',
          examType: 'academic',
          durationMinutes: 165,
        },
        overallBand: null,
        resultsLocked: true,
        sections: ['listening', 'reading', 'writing', 'speaking'].map(
          (skill, index) => ({
            position: index + 1,
            skill,
            attempt: {
              id: `${skill}-guest`,
              materialType: skill,
              status: 'ABANDONED',
              band: null,
            },
          }),
        ),
      },
    }),
  )
  await page.goto('./exam/full-mock-sessions/guest-mock')
  await expect(
    page.getByText('Секция завершена без оценки', { exact: true }),
  ).toHaveCount(4)
  await page
    .getByRole('button', { name: 'Пересдать тест', exact: true })
    .click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Начать заново', exact: true })
    .click()
  await expect(page).toHaveURL(/\/guest-retake$/)
})

test('signed-in student can retake a completed mock without using the guest API', async ({
  page,
}) => {
  const { starts } = await guestAPI(page, true)
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({ json: modalAccount }),
  )
  const fresh = {
    id: 'account-retake',
    status: 'IN_PROGRESS',
    currentSection: 1,
    mockTest: { title: 'Полный пробный IELTS', examType: 'academic' },
    sections: [],
    overallBand: null,
  }
  const accountStarts: unknown[] = []
  await page.route('**/api/v1/full-mocks/start', (route) => {
    accountStarts.push(route.request().postDataJSON())
    return route.fulfill({ json: fresh })
  })
  await page.route('**/api/v1/full-mock-sessions/account-retake', (route) =>
    route.fulfill({ json: fresh }),
  )
  await page.goto('./exam/full-mock-sessions/guest-mock')
  await expect(page.getByText('6.5', { exact: true })).toHaveCount(5)
  await page
    .getByRole('button', { name: 'Пересдать тест', exact: true })
    .click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Начать заново', exact: true })
    .click()
  await expect(page).toHaveURL(/\/account-retake$/)
  expect(accountStarts).toEqual([{ restart: true }])
  expect(starts).toEqual([])
})

test('guest retake quota failure keeps the report and can be retried', async ({
  page,
}) => {
  const { starts } = await guestAPI(page, true)
  let calls = 0
  await page.route('**/api/v1/guest/start', async (route) => {
    calls++
    if (calls === 1)
      return route.fulfill({
        status: 429,
        json: { code: 'GUEST_LIMIT_EXCEEDED', message: 'Попробуйте позже' },
      })
    await new Promise((resolve) => setTimeout(resolve, 300))
    return route.fallback()
  })
  await page.goto('./exam/full-mock-sessions/guest-mock')
  await page
    .getByRole('button', { name: 'Пересдать тест', exact: true })
    .click()
  const dialog = page.getByRole('alertdialog', {
    name: 'Пересдать полный тест?',
  })
  await dialog
    .getByRole('button', { name: 'Начать заново', exact: true })
    .click()
  await expect(dialog.getByRole('alert')).toContainText('Попробуйте позже')
  await expect(page).toHaveURL(/\/guest-mock$/)
  await dialog
    .getByRole('button', { name: 'Начать заново', exact: true })
    .click()
  await expect(
    dialog.getByRole('button', { name: 'Готовим тест…', exact: true }),
  ).toBeDisabled()
  await expect(page).toHaveURL(/\/guest-retake$/)
  expect(calls).toBe(2)
  expect(starts).toHaveLength(1)
})

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
