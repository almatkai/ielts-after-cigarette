import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
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

async function fixtures(page: Page, signedIn = true, role = 'STUDENT') {
  const fixtureUser = { ...user, role }
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
              user: fixtureUser,
            },
          })
        : route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED' } })
    if (path.includes('/guest/session'))
      return route.fulfill({ status: 404, json: { code: 'NOT_FOUND' } })
    if (path.endsWith('/profile')) return route.fulfill({ json: fixtureUser })
    if (path.endsWith('/admin/access')) return route.fulfill({ json: { role } })
    if (path.endsWith('/dashboard'))
      return route.fulfill({
        json: {
          profile: fixtureUser,
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

async function stable(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true)
  await expect(page.locator('img[src*="brand/"]:visible').first()).toBeVisible()
  await expect
    .poll(() =>
      page
        .locator('img[src*="brand/"]:visible')
        .evaluateAll((images) =>
          images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
        ),
    )
    .toBe(true)
}

async function screenshot(page: Page, name: string) {
  if (!process.env.YRYS_REVIEW_DIR) return
  await mkdir(process.env.YRYS_REVIEW_DIR, { recursive: true })
  await page.screenshot({
    path: `${process.env.YRYS_REVIEW_DIR}/${name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
}

for (const theme of ['light', 'dark'] as const) {
  test(`Yrys ${theme}: real surfaces, navigation, study screens and responsive evidence`, async ({
    page,
  }) => {
    test.setTimeout(90000)
    await fixtures(page)
    await page.addInitScript(
      (value) => localStorage.setItem('yrys-theme', value),
      theme,
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const width of [360, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 })
      await page.goto('./')
      await expect(
        page.locator('section[aria-label="Основные показатели"]'),
      ).toBeVisible()
      await stable(page)
      await expect(page.locator('html')).toHaveClass(
        theme === 'dark' ? /dark/ : /^$/,
      )
      await screenshot(page, `overview-${width}-${theme}`)
      if (width === 360) {
        await page
          .getByRole('button', { name: 'Открыть меню', exact: true })
          .click()
        await expect(
          page.getByRole('navigation', {
            name: 'Основная навигация',
            exact: true,
          }),
        ).toBeVisible()
        await screenshot(page, `sidebar-${width}-${theme}`)
        await page
          .getByRole('button', { name: 'Закрыть меню', exact: true })
          .last()
          .click()
      }
    }
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: width === 360 ? 844 : 1000 })
      for (const [name, path, visible] of [
        ['practice', './practice', 'Практика'],
        ['settings', './settings', 'Настройки'],
        ['results', './attempts/brand-attempt', 'Reading practice'],
        ['reading', './exam/reading/brand-reading', 'Question 1'],
        ['404', './not-a-page', 'Кажется, эта страница потерялась.'],
      ]) {
        await page.goto(path)
        await expect(
          page
            .getByText(visible, { exact: name !== 'reading' })
            .filter({ visible: true })
            .first(),
        ).toBeVisible()
        await stable(page)
        await screenshot(page, `${name}-${width}-${theme}`)
      }
      await page.goto('./practice')
      await page.getByTestId('yuki-fox').click()
      await expect(
        page.getByPlaceholder('Спроси Юки о подготовке к IELTS...'),
      ).toBeVisible()
      await stable(page)
      await screenshot(page, `assistant-${width}-${theme}`)
    }
    // Read the actual resolved role colors, rather than repeating CSS hexes.
    const contrast = await page.evaluate(() => {
      const colors = [
        'foreground',
        'background',
        'muted-foreground',
        'card',
        'primary',
        'primary-text',
        'primary-fill',
        'primary-foreground',
        'primary-soft',
        'gold',
        'gold-foreground',
        'destructive',
        'success',
      ]
      const result: Record<string, string> = {}
      const probe = document.createElement('span')
      document.body.append(probe)
      for (const name of colors) {
        probe.style.color = `var(--${name})`
        result[name] = getComputedStyle(probe).color
      }
      probe.remove()
      const luminance = (rgb: string) =>
        rgb
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((v) => {
            const c = v / 255
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
          })
          .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
      const pairs = [
        ['foreground', 'background'],
        ['muted-foreground', 'card'],
        ['primary-text', 'card'],
        ['primary-text', 'primary-soft'],
        ['primary-foreground', 'primary-fill'],
        ['gold-foreground', 'gold'],
        ['destructive', 'card'],
        ['success', 'card'],
      ]
      return pairs.map(([fg, bg]) => {
        const a = luminance(result[fg]),
          b = luminance(result[bg])
        return {
          fg,
          bg,
          foreground: result[fg],
          background: result[bg],
          ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        }
      })
    })
    const palette = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      const probe = document.createElement('span')
      probe.className = 'bg-primary text-primary'
      document.body.append(probe)
      const resolved = getComputedStyle(probe)
      const result = {
        accent: style.getPropertyValue('--primary').trim(),
        text: resolved.color,
        fill: resolved.backgroundColor,
      }
      probe.remove()
      return result
    })
    expect(palette.accent.toLowerCase()).toBe('#3c82f6')
    expect(palette.text).toBe(
      theme === 'light' ? 'rgb(36, 95, 196)' : 'rgb(143, 186, 255)',
    )
    expect(palette.fill).toBe(
      theme === 'light' ? 'rgb(37, 99, 235)' : 'rgb(60, 130, 246)',
    )
    for (const pair of contrast)
      expect(pair.ratio, `${pair.fg}/${pair.bg}`).toBeGreaterThanOrEqual(4.5)
    if (process.env.YRYS_REVIEW_DIR)
      await writeFile(
        `${process.env.YRYS_REVIEW_DIR}/contrast-${theme}.json`,
        JSON.stringify(contrast, null, 2),
      )
    expect(errors).toEqual([])
  })
}

test('theme preference persists, follows system changes, and focuses visibly', async ({
  page,
}) => {
  await fixtures(page)
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('./settings')
  const light = page.getByRole('button', { name: 'Светлая', exact: true })
  await expect(light).toBeVisible()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await light.click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.reload()
  await expect(light).toHaveAttribute('aria-pressed', 'true')
  await light.focus()
  await expect(light).toHaveCSS('outline-width', '2px')
  await page.getByRole('button', { name: 'Системная', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2)
  await expect(
    page.locator(
      'meta[name="theme-color"][media="(prefers-color-scheme: light)"]',
    ),
  ).toHaveAttribute('content', '#F6F7F5')
  await expect(
    page.locator(
      'meta[name="theme-color"][media="(prefers-color-scheme: dark)"]',
    ),
  ).toHaveAttribute('content', '#121416')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    /manifest\.webmanifest\?v=3$/,
  )
})

for (const theme of ['light', 'dark'] as const) {
  test(`login ${theme}: exact logo, opaque surfaces and mobile fit`, async ({
    page,
  }) => {
    await fixtures(page, false)
    await page.addInitScript(
      (value) => localStorage.setItem('yrys-theme', value),
      theme,
    )
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: width === 360 ? 844 : 1000 })
      await page.goto('./login')
      await expect(page.getByRole('heading', { name: /Войти/ })).toBeVisible()
      await stable(page)
      await expect(page).toHaveTitle('Войти — Yrys Academy')
      await screenshot(page, `login-${width}-${theme}`)
    }
  })
}

test('device locale changes keep branded titles, navigation and OG in sync without changing URLs', async ({
  page,
}) => {
  await fixtures(page)
  await page.goto('./settings')
  const picker = page.getByRole('combobox', { name: /Выберите язык/ })
  await picker.selectOption('kk')
  await expect(page).toHaveTitle('Басқару панелі — Yrys Academy')
  await expect(
    page.getByRole('link', { name: 'Yrys Academy — шолуға' }).first(),
  ).toBeAttached()
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /og-yrys-kk\.png$/,
  )
  await page
    .getByRole('combobox', { name: 'Тілді таңдаңыз', exact: true })
    .selectOption('en')
  await expect(page).toHaveTitle('Dashboard — Yrys Academy')
  await page.getByRole('link', { name: 'Practice', exact: true }).click()
  await expect(page).toHaveTitle('Practice — Yrys Academy')
  await expect(page).toHaveURL(/\/app\/practice$/)
  expect(
    await page.evaluate(() => localStorage.getItem('daiyndyq-language')),
  ).toBe('en')
  expect(
    await page.evaluate(() => {
      const marker = document.createElement('mark')
      marker.className = 'bg-highlight text-highlight-foreground'
      document.body.append(marker)
      const styles = getComputedStyle(marker)
      const pair = [styles.backgroundColor, styles.color]
      marker.remove()
      return pair
    }),
  ).toEqual(['rgb(254, 240, 138)', 'rgb(23, 25, 28)'])
})

const localizedBrand = {
  ru: {
    home: 'Yrys Academy — подготовка к IELTS онлайн',
    practice: 'Практика — Yrys Academy',
    login: 'Войти — Yrys Academy',
    privacy: 'Политика конфиденциальности — Yrys Academy',
    terms: 'Условия использования — Yrys Academy',
    admin: 'Администрирование — Yrys Academy',
    logo: 'Yrys Academy — к обзору',
    theme: 'Тема оформления',
    light: 'Светлая',
    dark: 'Тёмная',
    assistant: 'Открыть чат с Юки',
    close: 'Закрыть чат',
    yuki: 'Помощник Юки',
  },
  kk: {
    home: 'Yrys Academy — IELTS-ке онлайн дайындық',
    practice: 'Практика — Yrys Academy',
    login: 'Кіру — Yrys Academy',
    privacy: 'Құпиялылық саясаты — Yrys Academy',
    terms: 'Пайдалану шарттары — Yrys Academy',
    admin: 'Әкімшілік — Yrys Academy',
    logo: 'Yrys Academy — шолуға',
    theme: 'Безендіру тақырыбы',
    light: 'Ашық',
    dark: 'Күңгірт',
    assistant: 'Юкимен чат ашу',
    close: 'Чатты жабу',
    yuki: 'Юки көмекшісі',
  },
  en: {
    home: 'Yrys Academy — online IELTS preparation',
    practice: 'Practice — Yrys Academy',
    login: 'Sign in — Yrys Academy',
    privacy: 'Privacy Policy — Yrys Academy',
    terms: 'Terms of Use — Yrys Academy',
    admin: 'Administration — Yrys Academy',
    logo: 'Yrys Academy — overview',
    theme: 'Appearance theme',
    light: 'Light',
    dark: 'Dark',
    assistant: 'Open chat with Yuki',
    close: 'Close chat',
    yuki: 'Yuki assistant',
  },
} as const

for (const locale of ['ru', 'kk', 'en'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`dev compatibility ${locale} ${theme}: localized brand and full surface matrix`, async ({
      page,
    }) => {
      test.setTimeout(120000)
      const labels = localizedBrand[locale]
      await fixtures(page, true, 'ADMIN')
      await page.addInitScript(
        ({ locale: storedLocale, theme: storedTheme }) => {
          localStorage.setItem('daiyndyq-language', storedLocale)
          localStorage.setItem('yrys-theme', storedTheme)
        },
        { locale, theme },
      )
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      for (const width of [360, 1440]) {
        await page.setViewportSize({
          width,
          height: width === 360 ? 844 : 1000,
        })
        for (const [name, path, title] of [
          ['overview', './', labels.home],
          ['practice', './practice', labels.practice],
          ['settings-theme', './settings', null],
          ['legal-privacy', './privacy', labels.privacy],
          ['legal-terms', './terms', labels.terms],
          ['admin', './admin', labels.admin],
          ['results', './attempts/brand-attempt', null],
          ['exam-reading', './exam/reading/brand-reading', null],
        ] as const) {
          await page.goto(path)
          await expect(page.locator('html')).toHaveAttribute('lang', locale)
          await expect(page.locator('html')).toHaveClass(
            theme === 'dark' ? /dark/ : /^$/,
          )
          if (title) await expect(page).toHaveTitle(title)
          await stable(page)
          // The restored assistant is the only permitted fox surface.
          await expect(
            page.locator(
              ':is(img[src*="fox"], img[src*="yuki-avatar"], [data-part="body"]):not([data-testid="yuki-widget"] *, #ai-assistant-widget *)',
            ),
          ).toHaveCount(0)
          if (name === 'overview') {
            await expect(
              page.locator('meta[property="og:image"]'),
            ).toHaveAttribute(
              'content',
              new RegExp(`og-yrys${locale === 'kk' ? '-kk' : ''}\\.png$`),
            )
            await expect(
              page.getByRole('link', { name: labels.logo }).first(),
            ).toBeAttached()
          }
          if (name === 'settings-theme') {
            const group = page.getByRole('group', {
              name: labels.theme,
              exact: true,
            })
            await expect(group).toBeVisible()
            await expect(
              group.getByRole('button', { name: labels[theme], exact: true }),
            ).toHaveAttribute('aria-pressed', 'true')
            await expect(
              page.getByText(labels.yuki, { exact: true }),
            ).toBeVisible()
          }
          if (name.startsWith('legal')) {
            await expect(page.locator('main')).toContainText('Yrys Academy')
            await expect(page.locator('main')).not.toContainText('Daiyndyq')
          }
          await screenshot(page, `${locale}-${name}-${width}-${theme}`)
        }
        await page.goto('./practice')
        await page
          .getByRole('button', { name: labels.assistant, exact: true })
          .click()
        await expect(
          page.getByRole('button', { name: labels.close, exact: true }),
        ).toBeVisible()
        await expect(page.locator('#ai-assistant-widget input')).toBeFocused()
        await stable(page)
        await screenshot(page, `${locale}-assistant-${width}-${theme}`)
      }
      await fixtures(page, false)
      for (const width of [360, 1440]) {
        await page.setViewportSize({
          width,
          height: width === 360 ? 844 : 1000,
        })
        await page.goto('./login')
        await expect(page).toHaveTitle(labels.login)
        await expect(
          page.getByRole('link', { name: labels.logo }),
        ).toBeVisible()
        await stable(page)
        await screenshot(page, `${locale}-auth-${width}-${theme}`)
      }
      expect(errors).toEqual([])
    })
  }
}
