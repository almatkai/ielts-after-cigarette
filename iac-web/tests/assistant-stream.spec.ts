import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const user = {
  id: 'student-id',
  role: 'STUDENT',
  email: 'student@example.test',
  displayName: 'Student',
  timezone: 'UTC',
  examType: 'academic',
  currentBand: null,
  targetBand: 7.5,
  examDate: '2026-12-04',
}
const frame = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`
const recovered =
  frame({ type: 'reset' }) +
  frame({ type: 'delta', text: 'Abandoned partial answer' }) +
  frame({ type: 'reset' }) +
  frame({ type: 'delta', text: 'Final answer from reserve' }) +
  frame({
    type: 'done',
    response: {
      message: { role: 'assistant', content: 'Final answer from reserve' },
    },
  })

async function mockStudent(page: Page, body: string, expireOnce = false) {
  let refreshCount = 0
  const chats: { authorization: string | undefined; body: unknown }[] = []
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path.endsWith('/auth/refresh')) {
      refreshCount++
      return route.fulfill({
        json: {
          accessToken: `mock-token-${refreshCount}`,
          tokenType: 'Bearer',
          expiresIn: 3600,
          user,
        },
      })
    }
    if (path.endsWith('/profile')) return route.fulfill({ json: user })
    if (path.endsWith('/assistant/chat/stream')) {
      chats.push({
        authorization: request.headers().authorization,
        body: request.postDataJSON(),
      })
      if (expireOnce && chats.length === 1)
        return route.fulfill({
          status: 401,
          json: { code: 'ACCESS_TOKEN_EXPIRED' },
        })
      return route.fulfill({ contentType: 'text/event-stream', body })
    }
    return route.fulfill({ json: { items: [] } })
  })
  return chats
}
async function ask(page: Page) {
  await page.goto('./practice')
  await page
    .getByRole('button', { name: 'Открыть чат с Юки', exact: true })
    .last()
    .click()
  await page
    .getByPlaceholder('Спроси Юки о подготовке к IELTS...')
    .fill('Help with IELTS')
  await page.getByRole('button', { name: 'Отправить', exact: true }).click()
}

test('stream fallback replaces partial text instead of mixing answers', async ({
  page,
}) => {
  const chats = await mockStudent(page, recovered)
  await ask(page)
  const widget = page.locator('#ai-assistant-widget')
  await expect(
    widget.getByText('Final answer from reserve', { exact: true }),
  ).toBeVisible()
  await expect(widget.getByText('Abandoned partial answer')).toHaveCount(0)
  await expect(widget.getByText(/Соединение с чатом прервалось/)).toHaveCount(0)
  expect(chats[0]?.body).toMatchObject({
    messages: [{ role: 'user', content: 'Help with IELTS' }],
  })
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('iac_yuki_chat_messages_v1'),
    ),
  ).not.toContain('Abandoned partial answer')
})

test('exhausted chain displays a neutral answer, not a technical error', async ({
  page,
}) => {
  await mockStudent(
    page,
    frame({ type: 'reset' }) +
      frame({ type: 'delta', text: 'Discarded content' }) +
      frame({ type: 'reset' }) +
      frame({
        type: 'unavailable',
        text: 'Сейчас не удаётся получить ответ. Попробуй ещё раз чуть позже.',
      }),
  )
  await ask(page)
  await expect(
    page
      .locator('#ai-assistant-widget')
      .getByText(
        'Сейчас не удаётся получить ответ. Попробуй ещё раз чуть позже.',
      ),
  ).toBeVisible()
  await expect(page.getByText('Discarded content')).toHaveCount(0)
  await expect(
    page.getByText(
      /Не удалось связаться с сервером AI|Соединение с чатом прервалось/,
    ),
  ).toHaveCount(0)
})

test('SSE preserves automatic authentication refresh', async ({ page }) => {
  const chats = await mockStudent(page, recovered, true)
  await ask(page)
  await expect(
    page
      .locator('#ai-assistant-widget')
      .getByText('Final answer from reserve', { exact: true }),
  ).toBeVisible()
  expect(chats).toHaveLength(2)
  expect(chats[0].authorization).not.toBe(chats[1].authorization)
})

test('long saved conversations send only the bounded model context', async ({
  page,
}) => {
  const chats = await mockStudent(page, recovered)
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'iac_yuki_chat_messages_v1',
      JSON.stringify(
        Array.from({ length: 120 }, (_, index) => ({
          id: `saved-${index}`,
          sender: index % 2 ? 'fox' : 'user',
          text: `Saved message ${index}`,
          time: '10:00',
        })),
      ),
    )
  })
  await ask(page)
  await expect(
    page
      .locator('#ai-assistant-widget')
      .getByText('Final answer from reserve', { exact: true }),
  ).toBeVisible()
  const body = chats[0].body as {
    messages: { role: string; content: string }[]
  }
  expect(body.messages).toHaveLength(20)
  expect(body.messages.at(-1)).toEqual({
    role: 'user',
    content: 'Help with IELTS',
  })
})

test('unfinished stream stays out of saved conversation history', async ({
  page,
}) => {
  await mockStudent(page, recovered)
  await page.addInitScript(
    ({ prefix, suffix }) => {
      const originalFetch = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        if (!String(input).endsWith('/assistant/chat/stream'))
          return originalFetch(input, init)
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(prefix))
            window.addEventListener(
              'finish-test-chat',
              () => {
                controller.enqueue(encoder.encode(suffix))
                controller.close()
              },
              { once: true },
            )
          },
        })
        return new Response(stream, {
          headers: { 'Content-Type': 'text/event-stream' },
        })
      }
    },
    {
      prefix:
        frame({ type: 'reset' }) +
        frame({ type: 'delta', text: 'Unfinished visible text' }),
      suffix:
        frame({ type: 'reset' }) +
        frame({
          type: 'done',
          response: {
            message: { role: 'assistant', content: 'Completed final answer' },
          },
        }),
    },
  )
  await ask(page)
  await expect(
    page
      .locator('#ai-assistant-widget')
      .getByText('Unfinished visible text', { exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('iac_yuki_chat_messages_v1'),
    ),
  ).not.toContain('Unfinished visible text')
  await page.evaluate(() => window.dispatchEvent(new Event('finish-test-chat')))
  await expect(
    page
      .locator('#ai-assistant-widget')
      .getByText('Completed final answer', { exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('iac_yuki_chat_messages_v1'),
    ),
  ).toContain('Completed final answer')
})
