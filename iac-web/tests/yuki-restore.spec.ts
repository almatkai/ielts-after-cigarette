import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import type { ServerResponse } from 'node:http'
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
  // Every original path, circle and gradient stop, including blue sparkle/glow.
  const artwork = await fox(page)
    .locator('path, circle, stop')
    .evaluateAll((nodes) =>
      nodes.map((node) => [
        node.tagName,
        Object.fromEntries(
          Array.from(node.attributes)
            .map((attribute) => [
              attribute.name,
              attribute.name === 'fill' && attribute.value.startsWith('url(')
                ? 'url(#original-glow)'
                : attribute.value,
            ])
            .sort(([a], [b]) => a.localeCompare(b)),
        ),
      ]),
    )
  expect(
    createHash('sha256').update(JSON.stringify(artwork)).digest('hex'),
  ).toBe('7a088152990d92c2ec624c35f5b020856c24ec8b8e1a1f42987d17971b879fef')
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
  const avatars = chat(page).locator('img[src*="thoughtful_arctic_fox.webp"]')
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
    await expect(avatar).toHaveCSS('object-fit', 'contain')
    expect(
      await avatar.evaluate((image) => image.getBoundingClientRect().width),
    ).toBeGreaterThanOrEqual(18)
  }
  const asset = await page.request.get('/app/thoughtful_arctic_fox.webp')
  expect(asset.ok()).toBe(true)
  expect(
    createHash('sha256')
      .update(await asset.body())
      .digest('hex'),
  ).toBe('071261a9b75ca8e69a98c8f54987e3ee5ca7be23063015e8832923a97101bcfe')
  await expect(chat(page).locator('.bg-emerald-500.ring-1')).toHaveCount(1)
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
        ).toBe(width < 640 ? 96 : width < 1024 ? 128 : 144)
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
        ).toBeGreaterThanOrEqual(width < 640 ? 120 : width < 1024 ? 152 : 168)
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
        chat(page).locator('img[src*="thoughtful_arctic_fox.webp"]').first(),
      ).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(fox(page)).toBeFocused()
    })
  }
}

test('Yuki: mobile drawer hides the pending lazy chat fallback', async ({
  page,
}) => {
  let release!: () => void
  const loading = new Promise<void>((resolve) => {
    release = resolve
  })
  await fixtures(page)
  await page.setViewportSize({ width: 360, height: 740 })
  await page.route('**/ai-assistant.tsx*', async (route) => {
    await loading
    await route.continue()
  })
  try {
    await page.goto('./practice')
    await fox(page).click()
    await expect(page.getByRole('status')).toContainText('Загружаем чат Юки')
    await page
      .getByRole('button', { name: 'Открыть меню', exact: true })
      .click()
    await expect(page.locator('#dashboard-mobile-navigation')).toBeVisible()
    await expect(page.getByRole('status')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('status')).toContainText('Загружаем чат Юки')
    release()
    await expect(chat(page).locator('input')).toBeFocused()
  } finally {
    release()
  }
})

test('Yuki: mobile drawer preserves an unsent chat draft', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await fixtures(page)
  await page.goto('./practice')
  await fox(page).click()
  const input = chat(page).locator('input')
  const draft = 'Keep this unsent IELTS question'
  await input.fill(draft)
  await page.getByRole('button', { name: 'Открыть меню', exact: true }).click()
  await expect(page.locator('#dashboard-mobile-navigation')).toBeVisible()
  // The window must stay mounted, but not paint or intercept the drawer.
  await expect(chat(page)).toHaveCSS('opacity', '0')
  await expect(chat(page)).toHaveCSS('pointer-events', 'none')
  await expect(page.getByTestId('yuki-widget')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(input).toBeFocused()
  await expect(input).toHaveValue(draft)
  await expect(chat(page)).toHaveCSS('opacity', '1')
})

test('Yuki: mobile drawer preserves the same in-flight stream without abort or re-request', async ({
  page,
}, testInfo) => {
  // A gated real HTTP response: route.fulfill would buffer all SSE chunks and
  // could not prove that the request survives while the drawer is open.
  let response: ServerResponse | undefined
  let requests = 0
  let aborted = 0
  const frame = (event: object) => `data: ${JSON.stringify(event)}\n\n`
  const server = createServer((request, reply) => {
    if (request.method === 'OPTIONS') {
      reply.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      })
      reply.end()
      return
    }
    requests += 1
    response = reply
    request.resume()
    reply.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    })
    reply.once('close', () => {
      if (!reply.writableEnded) aborted += 1
    })
    reply.write(frame({ type: 'reset' }))
    reply.write(frame({ type: 'delta', text: 'First streamed chunk' }))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Missing SSE port')
  const failedRequests: string[] = []
  page.on('requestfailed', (request) => {
    if (request.url().includes('/assistant/chat/stream'))
      failedRequests.push(request.failure()?.errorText ?? 'failed')
  })
  try {
    await page.setViewportSize({ width: 360, height: 740 })
    await fixtures(page)
    await page.route('**/assistant/chat/stream', (route) =>
      route.continue({
        url: `http://127.0.0.1:${address.port}/api/v1/assistant/chat/stream`,
      }),
    )
    await page.goto('./practice')
    await fox(page).click()
    const input = chat(page).locator('input')
    await input.fill('Stream a mocked IELTS answer')
    await input.press('Enter')
    const answer = chat(page).getByText('First streamed chunk', { exact: true })
    await expect(answer).toBeVisible()
    // Also preserve the next draft while a previous answer is streaming.
    await input.fill('My next unsent question')
    await page.screenshot({ path: testInfo.outputPath('drawer-before.png') })
    await page
      .getByRole('button', { name: 'Открыть меню', exact: true })
      .click()
    await expect(page.locator('#dashboard-mobile-navigation')).toBeVisible()
    await expect(chat(page)).toHaveCSS('opacity', '0')
    await expect(chat(page)).toHaveCSS('pointer-events', 'none')
    await page.screenshot({ path: testInfo.outputPath('drawer-open.png') })
    response!.write(
      frame({ type: 'delta', text: ' and continued behind drawer' }),
    )
    await expect(
      chat(page).getByText('First streamed chunk and continued behind drawer', {
        exact: true,
      }),
    ).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('My next unsent question')
    await expect(
      chat(page).getByRole('button', { name: 'Отправить', exact: true }),
    ).toBeDisabled()
    expect(requests).toBe(1)
    expect(aborted).toBe(0)
    expect(failedRequests).toEqual([])
    const content = 'First streamed chunk and continued behind drawer: complete'
    response!.end(
      frame({
        type: 'done',
        response: { message: { role: 'assistant', content } },
      }),
    )
    await expect(chat(page).getByText(content, { exact: true })).toBeVisible()
    await expect(
      chat(page).getByRole('button', { name: 'Отправить', exact: true }),
    ).toBeEnabled()
    await expect
      .poll(() =>
        page.evaluate(() =>
          sessionStorage.getItem('iac_yuki_chat_messages_v1'),
        ),
      )
      .toContain(content)
    expect(requests).toBe(1)
    expect(aborted).toBe(0)
    // The parser cancels its reader after `done`; Chromium may then report
    // ERR_ABORTED for that completed request, so assert failures before `done`.
    await page.screenshot({ path: testInfo.outputPath('drawer-after.png') })
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})

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

for (const width of [360, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`Yuki exact reference: blue compact button and original chat ${width} ${theme}`, async ({
      page,
    }, testInfo) => {
      await fixtures(page)
      await page.setViewportSize({ width, height: width === 360 ? 844 : 1000 })
      await page.addInitScript((mode) => {
        localStorage.setItem('iac_show_mascot', 'false')
        localStorage.setItem('yrys-theme', mode)
      }, theme)
      await page.goto('./practice')
      const compact = page.getByTestId('yuki-compact')
      expect(
        await compact.evaluate(
          (el) =>
            parseFloat(getComputedStyle(el).borderRadius) >= el.clientWidth / 2,
        ),
      ).toBe(true)
      await expect(compact).toHaveCSS('color', 'rgb(255, 255, 255)')
      await expect(compact).toHaveCSS('background-image', /gradient/)
      expect(await compact.getAttribute('class')).toContain('from-[#3C82F6]')
      await expect(compact.locator('img')).toHaveCSS('object-fit', 'contain')
      await expect
        .poll(() =>
          compact
            .locator('img')
            .evaluate((img) => (img as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0)
      await page.screenshot({
        path: testInfo.outputPath('compact.png'),
        animations: 'disabled',
      })
      await compact.click()
      await expect(chat(page).locator('input')).toBeFocused()
      await expect(
        chat(page).getByText('IELTS AI', { exact: true }),
      ).toBeVisible()
      await expect(chat(page).locator('.assistant-message').first()).toHaveCSS(
        'border-top-left-radius',
        '16px',
      )
      await expect(chat(page).locator('.assistant-message').first()).toHaveCSS(
        'background-color',
        'rgb(255, 255, 255)',
      )
      await page.screenshot({
        path: testInfo.outputPath('chat.png'),
        animations: 'disabled',
      })
      await page.keyboard.press('Escape')
      await page.evaluate(() => {
        localStorage.setItem('iac_show_mascot', 'true')
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'iac_show_mascot',
            newValue: 'true',
            storageArea: localStorage,
          }),
        )
      })
      await expect(fox(page)).toBeVisible()
      await page.screenshot({
        path: testInfo.outputPath('floating.png'),
        animations: 'disabled',
      })
    })
  }
}
