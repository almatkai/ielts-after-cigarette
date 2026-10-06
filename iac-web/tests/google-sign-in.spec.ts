import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const iPhoneUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  userAgent: iPhoneUserAgent,
})

const user = {
  id: 'student',
  role: 'STUDENT',
  email: 'student@example.test',
  displayName: 'Student',
  timezone: 'Asia/Almaty',
}
const session = {
  accessToken: 'token',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user,
}
const dashboard = {
  profile: { currentBand: null, targetBand: 7.5, examDate: null },
  recommendedAction: {
    type: 'practice',
    title: 'Практика',
    description: 'Выберите секцию',
    target: '/practice',
  },
  todayPlan: [],
  skillProgress: [],
  unreadNotifications: 0,
}

async function mockGoogle(page: Page) {
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
      window.google = { accounts: { id: {
        initialize(options) { window.googleOptions = options; },
        renderButton(container, options) {
          const button = document.createElement('button');
          button.textContent = 'Continue with Google';
          button.onclick = () => {
            options.click_listener?.();
            // An in-app browser cannot deliver the popup callback. The real
            // redirect flow posts the credential back in this same tab.
            if (window.googleOptions.ux_mode !== 'redirect') return;
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = window.googleOptions.login_uri;
            for (const [name, value] of Object.entries({credential: 'google-test', g_csrf_token: 'csrf-test'})) {
              const input = document.createElement('input');
              input.name = name; input.value = value; form.append(input);
            }
            document.body.append(form); form.submit();
          };
          container.replaceChildren(button);
        }
      } } };
    `,
    }),
  )
}

test('one tap on Google returns in the same tab and opens new-user registration', async ({
  page,
}) => {
  await mockGoogle(page)
  let googlePosts = 0
  let completed = false
  await page.route('**/api/v1/**', (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path === '/api/v1/auth/google') {
      googlePosts++
      expect(request.method()).toBe('POST')
      expect(request.postData()).toContain('credential=google-test')
      return route.fulfill({
        // WebKit's request interception cannot fulfill an HTTP 303. The Go
        // handler tests assert that status; here emulate its same-tab return.
        contentType: 'text/html',
        body: '<script>location.replace("/app/login?google=registration")</script>',
      })
    }
    if (path.endsWith('/google/pending'))
      return route.fulfill({
        json: {
          registrationRequired: true,
          registrationToken: 'registration-test',
          profile: {
            email: user.email,
            name: user.displayName,
            phone: '+77001234567',
          },
        },
      })
    if (path.endsWith('/google/complete')) {
      expect(request.postDataJSON()).toEqual({
        registrationToken: 'registration-test',
        name: user.displayName,
        phone: '+77001234567',
        acceptedTerms: true,
      })
      completed = true
      return route.fulfill({ status: 201, json: session })
    }
    if (path.endsWith('/auth/refresh'))
      return completed
        ? route.fulfill({ json: session })
        : route.fulfill({
            status: 401,
            json: { code: 'INVALID_REFRESH_TOKEN' },
          })
    if (path.endsWith('/dashboard')) return route.fulfill({ json: dashboard })
    return route.fulfill({ json: { items: [], skillProgress: [] } })
  })
  await page.goto('./login')
  await page.getByRole('button', { name: 'Continue with Google' }).tap()
  await expect(page.getByText('Давайте создадим вам аккаунт')).toBeVisible()
  expect(googlePosts).toBe(1)
  expect(page.url()).not.toContain('google-test')
  expect(page.url()).not.toContain('registration-test')
  await expect(page.getByLabel('Имя', { exact: true })).toHaveValue('Student')
  await page.locator('#acceptedTerms').check()
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).tap()
  await expect(page).toHaveURL(/\/app\/?$/)
  await expect(
    page.getByRole('region', { name: 'Основные показатели' }),
  ).toBeVisible()
  expect(completed).toBe(true)
})

for (const redirect of ['/', '/admin']) {
  test(`existing account returns from Google to ${redirect}`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await mockGoogle(page)
    let signedIn = false
    await page.route('**/api/v1/**', (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/v1/auth/google') {
        signedIn = true
        return route.fulfill({
          contentType: 'text/html',
          body: '<script>location.replace("/app/login?google=success")</script>',
        })
      }
      if (path.endsWith('/auth/refresh'))
        return signedIn
          ? route.fulfill({
              json: { ...session, user: { ...user, role: 'ADMIN' } },
            })
          : route.fulfill({
              status: 401,
              json: { code: 'INVALID_REFRESH_TOKEN' },
            })
      if (path.endsWith('/dashboard')) return route.fulfill({ json: dashboard })
      if (path.endsWith('/admin/access'))
        return route.fulfill({ json: { role: 'ADMIN' } })
      return route.fulfill({ json: { items: [], skillProgress: [] } })
    })
    await page.goto(`./login?redirect=${encodeURIComponent(redirect)}`)
    await page.getByRole('button', { name: 'Continue with Google' }).tap()
    await expect(page).toHaveURL(
      redirect === '/admin' ? /\/app\/admin\/?$/ : /\/app\/?$/,
    )
    await expect(
      redirect === '/admin'
        ? page.getByText('Доступ подтверждён сервером:')
        : page.getByRole('region', { name: 'Основные показатели' }),
    ).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('expired registration return shows an error and restores the Google button', async ({
  page,
}) => {
  await mockGoogle(page)
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ status: 401, json: { code: 'GOOGLE_TOKEN_INVALID' } }),
  )
  await page.goto('./login?google=registration')
  await expect(page.getByRole('alert')).toContainText(
    'Не удалось подтвердить Google-аккаунт',
  )
  await expect(
    page.getByRole('button', { name: 'Continue with Google' }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('failed Google return offers another sign-in instead of a blank page', async ({
  page,
}) => {
  await mockGoogle(page)
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ status: 401, json: { code: 'INVALID_REFRESH_TOKEN' } }),
  )
  await page.goto('./login?google=error')
  await expect(page.getByRole('alert')).toContainText(
    'Не удалось завершить вход через Google',
  )
  await expect(
    page.getByRole('button', { name: 'Continue with Google' }),
  ).toBeVisible()
})

test('blocked Google script shows an error after a bounded wait', async ({
  page,
}) => {
  await page.clock.install()
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ status: 401, json: { code: 'INVALID_REFRESH_TOKEN' } }),
  )
  await page.route('https://accounts.google.com/gsi/client', () => {})
  await page.goto('./login', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Войти или создать аккаунт')).toBeVisible()
  await page.clock.runFor(15_100)
  await expect(page.getByRole('alert')).toContainText(
    'Не удалось загрузить вход через Google',
  )
})

test.describe('desktop', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
    hasTouch: false,
    userAgent: undefined,
  })

  test('keeps the popup flow so sign-in needs no redirect URI', async ({
    page,
  }) => {
    await mockGoogle(page)
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({ status: 401, json: { code: 'INVALID_REFRESH_TOKEN' } }),
    )
    await page.goto('./login')
    await expect(
      page.getByRole('button', { name: 'Continue with Google' }),
    ).toBeVisible()
    const options = await page.evaluate(() => {
      const { ux_mode, login_uri } = (window as any).googleOptions
      return { ux_mode, login_uri }
    })
    expect(options).toEqual({ ux_mode: undefined, login_uri: undefined })
  })
})
