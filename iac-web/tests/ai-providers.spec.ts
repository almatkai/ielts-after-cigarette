import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const provider = {
  id: 'provider-id',
  name: 'Primary',
  endpoint: 'https://api.example.test/v1/chat/completions',
  model: 'primary-model',
  speakingModel: '',
  scopes: ['assistant', 'writing', 'speaking'],
  enabled: true,
  priority: 10,
  timeoutSeconds: 20,
  hasKey: true,
  revision: 1,
  updatedAt: '2026-08-01T00:00:00Z',
  fromEnv: false,
}
async function mockAdmin(
  page: Page,
  role = 'ADMIN',
  configured = true,
  migrationRequired = false,
  localNoTelemetry = false,
  includeEnvironment = false,
  extraProviders = 0,
  routingMigrationRequired = false,
) {
  const environment = {
    ...provider,
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Провайдер из .env',
    model: 'env-model',
    priority: 10000,
    revision: 0,
    fromEnv: true,
  }
  let items = includeEnvironment
    ? [structuredClone(provider), environment]
    : [structuredClone(provider)]
  items.push(
    ...Array.from({ length: extraProviders }, (_, i) => ({
      ...provider,
      id: `extra-provider-${i}`,
      name: `Provider ${i + 3}`,
      priority: 10,
    })),
  )
  let routing = {
    mode: 'sequential',
    maxParallel: 2,
    hedgeDelayMs: 1500,
    providerIds: [] as string[],
    revision: 1,
  }
  const requests: { method: string; path: string; body: unknown }[] = []
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const body: unknown = request.postData() ? request.postDataJSON() : null
    requests.push({ method: request.method(), path: url.pathname, body })
    if (url.pathname.endsWith('/auth/refresh'))
      return route.fulfill({
        json: {
          accessToken: 'mock-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'admin-id',
            role,
            email: 'admin@example.test',
            displayName: 'Admin',
            timezone: 'UTC',
          },
        },
      })
    if (url.pathname.endsWith('/routing')) {
      if (request.method() === 'PUT')
        routing = {
          ...routing,
          ...(body as typeof routing),
          revision: routing.revision + 1,
        }
      return route.fulfill({
        json: { routing, migrationRequired: routingMigrationRequired },
      })
    }
    if (url.pathname.endsWith('/stats'))
      return route.fulfill({
        json: {
          migrationRequired: false,
          models: [
            {
              providerId: provider.id,
              providerName: provider.name,
              model: provider.model,
              purpose: 'assistant',
              calls: 10,
              successes: 8,
              failures: 1,
              timeouts: 1,
              cancelled: 1,
              wins: 6,
              p50Ms: 750,
              p95Ms: 2100,
              firstTokenMs: 150,
              firstResponseMs: 100,
            },
          ],
          recent: [],
        },
      })
    if (url.pathname.endsWith('/order') && request.method() === 'POST') {
      const input = body as { items: { id: string; revision: number }[] }
      items = input.items.map(({ id }, index) => ({
        ...items.find((item) => item.id === id)!,
        priority: (index + 1) * 10,
        revision: (items.find((item) => item.id === id)?.revision ?? 0) + 1,
      }))
      return route.fulfill({
        json: {
          items,
          encryptionConfigured: configured,
          envFallbackConfigured: true,
          errorReportingConfigured: configured && !localNoTelemetry,
          errorReportingRequired: !localNoTelemetry,
          maxProviders: 8,
          migrationRequired: false,
        },
      })
    }
    if (url.pathname.endsWith('/ai-providers') && request.method() === 'GET')
      return route.fulfill({
        json: {
          items: migrationRequired ? [] : items,
          migrationRequired,
          encryptionConfigured: configured,
          envFallbackConfigured: true,
          errorReportingConfigured: configured && !localNoTelemetry,
          errorReportingRequired: !localNoTelemetry,
          maxProviders: 8,
        },
      })
    if (url.pathname.endsWith('/test'))
      return route.fulfill({
        json: { ok: true, model: 'new-model', latencyMs: 128 },
      })
    if (url.pathname.endsWith('/ai-providers') && request.method() === 'POST') {
      const input = body as Omit<
        typeof provider,
        'id' | 'hasKey' | 'updatedAt'
      > & { apiKey: string }
      const { apiKey: _key, ...publicInput } = input
      const saved = {
        ...publicInput,
        id: 'new-provider',
        hasKey: true,
        revision: 1,
        updatedAt: provider.updatedAt,
      }
      items = [...items, saved]
      return route.fulfill({ status: 201, json: saved })
    }
    if (
      url.pathname.endsWith('/00000000-0000-0000-0000-000000000001') &&
      request.method() === 'PUT'
    ) {
      const input = body as typeof environment & { apiKey: string }
      const { apiKey: _key, ...publicInput } = input
      const saved = { ...environment, ...publicInput, revision: 1 }
      items = [saved, ...items.filter((item) => !item.fromEnv)].sort(
        (a, b) => a.priority - b.priority,
      )
      return route.fulfill({ json: saved })
    }
    if (url.pathname.endsWith('/provider-id') && request.method() === 'PUT') {
      const input = body as Omit<
        typeof provider,
        'id' | 'hasKey' | 'updatedAt'
      > & { apiKey: string }
      const { apiKey: _key, ...publicInput } = input
      const saved = { ...provider, ...publicInput, revision: 2 }
      items = [saved, ...items.filter((p) => p.id !== provider.id)].sort(
        (a, b) => a.priority - b.priority,
      )
      return route.fulfill({ json: saved })
    }
    return route.fulfill({ json: { items: [] } })
  })
  return requests
}

test('admin can add, test and save a provider without persisting a browser key', async ({
  page,
}) => {
  const requests = await mockAdmin(page)
  await page.goto('./admin/ai-providers')
  await expect(
    page.getByRole('heading', { name: 'AI-провайдеры', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Последний резерв: .env')).toBeVisible()
  await page.getByRole('button', { name: 'Добавить провайдера' }).click()
  await page.getByLabel('Название', { exact: true }).fill('Reserve')
  await page
    .getByLabel('HTTPS URL completions')
    .fill('https://reserve.example.test/v1/chat/completions')
  await page.getByLabel('Модель', { exact: true }).fill('new-model')
  await page
    .getByLabel('API-ключ', { exact: true })
    .fill('test-secret-not-for-storage')
  await page.getByRole('button', { name: 'Проверить подключение' }).click()
  await expect(page.getByText('Работает · 128 мс')).toBeVisible()
  await page.getByLabel('Включить в цепочку').check()
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Reserve', exact: true }),
  ).toBeVisible()
  expect(
    requests.find(
      (request) =>
        request.method === 'POST' && request.path.endsWith('/ai-providers'),
    )?.body,
  ).toMatchObject({ apiKey: 'test-secret-not-for-storage', enabled: true })
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain('test-secret-not-for-storage')
  await expect(
    page.getByText('test-secret-not-for-storage', { exact: true }),
  ).toHaveCount(0)
})

test('editing leaves encrypted key untouched and applies priority and scope', async ({
  page,
}) => {
  const requests = await mockAdmin(page)
  await page.goto('./admin/ai-providers')
  await page.getByRole('button', { name: 'Изменить', exact: true }).click()
  await expect(page.getByLabel('API-ключ', { exact: true })).toHaveValue('')
  await page.getByLabel('Приоритет', { exact: true }).fill('5')
  await page.getByLabel('Writing', { exact: true }).uncheck()
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
  await expect(
    page.getByText('Провайдер сохранён', { exact: true }),
  ).toBeVisible()
  expect(
    requests.find((request) => request.method === 'PUT')?.body,
  ).toMatchObject({
    apiKey: '',
    priority: 5,
    scopes: ['assistant', 'speaking'],
    revision: 1,
  })
})

test('missing encryption/GlitchTip blocks unsafe management and testing', async ({
  page,
}) => {
  await mockAdmin(page, 'ADMIN', false)
  await page.goto('./admin/ai-providers')
  await expect(page.getByText(/Для хранения ключей настройте/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Добавить провайдера' }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Проверить', exact: true }),
  ).toBeDisabled()
})

test('missing migration opens settings but blocks creating providers', async ({
  page,
}) => {
  await mockAdmin(page, 'ADMIN', true, true)
  await page.goto('./admin/ai-providers')
  await expect(
    page.getByRole('heading', { name: 'AI-провайдеры', exact: true }),
  ).toBeVisible()
  await expect(page.getByText(/База ещё не обновлена/)).toBeVisible()
  await expect(
    page.getByText('Настроенный .env-резерв продолжает использоваться.'),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Добавить провайдера' }),
  ).toBeDisabled()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('local settings allow enabling and testing without GlitchTip', async ({
  page,
}) => {
  await mockAdmin(page, 'ADMIN', true, false, true)
  await page.goto('./admin/ai-providers')
  await expect(
    page.getByText(/Локальный режим: GlitchTip отключён/),
  ).toBeVisible()
  await expect(page.getByText(/настройте GlitchTip/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Добавить провайдера' }).click()
  await page.getByLabel('Название', { exact: true }).fill('Local provider')
  await page
    .getByLabel('HTTPS URL completions')
    .fill('https://local-provider.example.test/v1/chat/completions')
  await page.getByLabel('Модель', { exact: true }).fill('local-model')
  await page.getByLabel('API-ключ', { exact: true }).fill('local-test-secret')
  await expect(page.getByLabel('Включить в цепочку')).toBeEnabled()
  await expect(
    page.getByRole('button', { name: 'Проверить подключение' }),
  ).toBeEnabled()
  await expect(
    page.getByRole('button', { name: 'Сохранить', exact: true }),
  ).toBeEnabled()
})

test('environment provider is visible, renameable and reorderable without exposing its key', async ({
  page,
}) => {
  const requests = await mockAdmin(page, 'ADMIN', true, false, true, true)
  await page.goto('./admin/ai-providers')
  const card = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Провайдер из .env' }) })
  await expect(card.getByText('env-model', { exact: true })).toBeVisible()
  await expect(card.getByText('Ключ из .env', { exact: false })).toBeVisible()
  await expect(card.getByRole('button', { name: 'Удалить' })).toHaveCount(0)
  await expect(page.getByText('Последний резерв: .env')).toHaveCount(0)
  await card.getByRole('button', { name: 'Проверить', exact: true }).click()
  await expect(card.getByText('Работает · 128 мс')).toBeVisible()
  await card.getByRole('button', { name: 'Изменить' }).click()
  await expect(page.getByLabel('API-ключ', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('URL completions из .env')).toHaveAttribute(
    'readonly',
    '',
  )
  await expect(page.getByLabel('Модель', { exact: true })).toHaveAttribute(
    'readonly',
    '',
  )
  await page.getByLabel('Название', { exact: true }).fill('Мой OpenRouter')
  await page.getByLabel('Приоритет').fill('0')
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
  await expect(
    page
      .getByRole('article')
      .first()
      .getByRole('heading', { name: 'Мой OpenRouter' }),
  ).toBeVisible()
  const saved = requests.find((request) => request.method === 'PUT')?.body as {
    name: string
    priority: number
    apiKey: string
  }
  expect(saved).toMatchObject({
    name: 'Мой OpenRouter',
    priority: 0,
    apiKey: '',
  })
})

test('keyboard drag joins providers into one priority level', async ({
  page,
}) => {
  const requests = await mockAdmin(page, 'ADMIN', true, false, true, true)
  await page.goto('./admin/ai-providers')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await expect(
    page.getByRole('button', {
      name: 'Переместить Провайдер из .env',
      exact: true,
    }),
  ).toBeVisible()
  const handle = page.getByRole('button', {
    name: 'Переместить Primary',
    exact: true,
  })
  await handle.focus()
  await handle.press('Space')
  await expect(handle).toHaveAttribute('aria-pressed', 'true')
  // dnd-kit's KeyboardSensor installs its document listener in a macrotask.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => setTimeout(resolve, 0)),
      ),
  )
  await handle.press('ArrowDown')
  await expect(page.locator('[id^="DndLiveRegion-"]')).toContainText(
    /level:10000|00000000-0000-0000-0000-000000000001/,
  )
  await handle.press('Space')
  await expect(
    page.getByText('Уровень сохранён', { exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('[data-priority-level="10000"] article'),
  ).toHaveCount(2)
  const saved = requests.find(
    (request) =>
      request.path.endsWith('/provider-id') && request.method === 'PUT',
  )?.body
  expect(saved).toMatchObject({ priority: 10000, apiKey: '' })
  await expect(
    page.locator('[data-priority-level="10000"] article'),
  ).toHaveCount(2)
})

test('level selection groups database and environment providers without routing migration', async ({
  page,
}, testInfo) => {
  await mockAdmin(page, 'ADMIN', true, false, true, true, 0, true)
  await page.goto('./admin/ai-providers')
  await page
    .getByLabel('Уровень Провайдер из .env', { exact: true })
    .selectOption('10')
  await expect(
    page.getByText('Уровень сохранён', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('[data-priority-level="10"] article')).toHaveCount(
    2,
  )
  await expect(page.locator('[data-priority-level="10000"]')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('[data-priority-level="10"] article')).toHaveCount(
    2,
  )
  await page.screenshot({
    path: testInfo.outputPath('ai-priority-stack.png'),
    fullPage: true,
  })
  await page
    .getByLabel('Уровень Провайдер из .env', { exact: true })
    .selectOption('new')
  await expect(page.locator('[data-priority-level="10"] article')).toHaveCount(
    1,
  )
})

test('admin sees model timing stats and round-robin explanation', async ({
  page,
}, testInfo) => {
  const requests = await mockAdmin(page, 'ADMIN', true, false, true, true)
  await page.goto('./admin/ai-providers')
  await expect(
    page.getByText('По очереди внутри уровня', { exact: true }),
  ).toBeVisible()
  expect(
    requests.some(
      (request) =>
        request.path.endsWith('/routing') && request.method === 'PUT',
    ),
  ).toBe(false)
  const stats = page.getByRole('region', { name: 'Статистика провайдеров' })
  await expect(stats.getByText('750 мс', { exact: true })).toBeVisible()
  await expect(stats.getByText('2.10 с', { exact: true })).toBeVisible()
  await expect(stats.getByText('150 мс', { exact: true })).toBeVisible()
  await expect(stats.getByText('89%', { exact: true })).toBeVisible()
  await expect(stats.getByText(/не оценку качества IELTS/)).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('ai-routing-desktop.png'),
    fullPage: true,
  })
})

test('four providers form a round-robin level, not a race', async ({
  page,
}, testInfo) => {
  await mockAdmin(page, 'ADMIN', true, false, true, true, 2)
  await page.goto('./admin/ai-providers')
  await page
    .getByLabel('Уровень Провайдер из .env', { exact: true })
    .selectOption('10')
  await expect(page.locator('[data-priority-level="10"] article')).toHaveCount(
    4,
  )
  await page.reload()
  await expect(page.locator('[data-priority-level="10"] article')).toHaveCount(
    4,
  )
  await expect(page.getByRole('radio')).toHaveCount(0)
  await expect(
    page.getByText('По очереди внутри уровня', { exact: true }),
  ).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('ai-round-robin-mobile.png'),
    fullPage: true,
  })
})

test('pointer drag joins environment into database provider priority level', async ({
  page,
}) => {
  await mockAdmin(page, 'ADMIN', true, false, true, true)
  await page.goto('./admin/ai-providers')
  const from = await page
    .getByRole('button', { name: 'Переместить Провайдер из .env', exact: true })
    .boundingBox()
  const to = await page
    .getByRole('button', { name: 'Переместить Primary', exact: true })
    .boundingBox()
  if (!from || !to) throw new Error('drag handles missing')
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 15,
  })
  await page.mouse.up()
  await expect(
    page.getByText('Уровень сохранён', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('[data-priority-level="10"] article')).toHaveCount(
    2,
  )
})

test('editors cannot open AI provider settings', async ({ page }) => {
  const requests = await mockAdmin(page, 'EDITOR')
  await page.goto('./admin/ai-providers')
  await expect(page).toHaveURL(/forbidden/)
  expect(
    requests.some((request) => request.path.endsWith('/ai-providers')),
  ).toBe(false)
})

test('provider settings work on a narrow viewport', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockAdmin(page)
  await page.goto('./admin/ai-providers')
  await page.getByRole('button', { name: 'Добавить провайдера' }).click()
  await expect(page.getByLabel('API-ключ', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('ai-providers-mobile.png'),
    fullPage: true,
  })
})
