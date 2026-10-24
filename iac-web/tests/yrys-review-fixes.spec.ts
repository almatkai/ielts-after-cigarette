import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import type { Locator, Page } from '@playwright/test'
import type { PublicSpeakingMaterial } from '../src/features/speaking/api'

const user = {
  id: 'brand-student',
  role: 'ADMIN',
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
    quote: 'The library is a place for learning.',
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
    if (path.endsWith('/guest/config'))
      return route.fulfill({ json: { enabled: false } })
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

// Component review uses the real Vite modules and explicit fixture data. No live API.
async function capture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready)
  if (process.env.YRYS_REVIEW_DIR) {
    await mkdir(process.env.YRYS_REVIEW_DIR, { recursive: true })
    await page.screenshot({
      path: `${process.env.YRYS_REVIEW_DIR}/${name}.png`,
      fullPage: true,
    })
  }
}
async function contrast(locator: Locator) {
  await expect(locator).toBeVisible()
  const value = await locator.evaluate((element) => {
    const style = getComputedStyle(element)
    let node: Element | null = element
    let background = 'rgba(0, 0, 0, 0)'
    while (node) {
      background = getComputedStyle(node).backgroundColor
      if (background !== 'rgba(0, 0, 0, 0)') break
      node = node.parentElement
    }
    const luminance = (color: string) => {
      // Canvas resolves CSS Color 4 (oklch/oklab) to the same sRGB pixels
      // the browser paints, so the restored blue palette is measured accurately.
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const context = canvas.getContext('2d')!
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const channels = Array.from(context.getImageData(0, 0, 1, 1).data)
      if (channels[3] !== 255) throw new Error(`Nonopaque background: ${color}`)
      return channels
        .slice(0, 3)
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
    }
    const a = luminance(style.color),
      b = luminance(background)
    return {
      foreground: style.color,
      background,
      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    }
  })
  expect(value.ratio).toBeGreaterThanOrEqual(4.5)
  return value
}
async function insideViewport(locator: Locator) {
  await expect(locator).toBeVisible()
  expect(
    await locator.evaluate((element) => {
      const r = element.getBoundingClientRect()
      let parent = element.parentElement
      let right = window.innerWidth,
        left = 0
      while (parent) {
        if (
          /(hidden|clip|auto|scroll)/.test(getComputedStyle(parent).overflowX)
        ) {
          const p = parent.getBoundingClientRect()
          right = Math.min(right, p.right)
          left = Math.max(left, p.left)
        }
        parent = parent.parentElement
      }
      return r.left >= left && r.right <= right
    }),
  ).toBe(true)
}
for (const theme of ['light', 'dark'] as const) {
  test(`review corrections: real components ${theme}`, async ({
    page,
    context,
  }) => {
    await fixtures(page)
    await page.addInitScript((mode) => {
      localStorage.setItem('yrys-theme', mode)
      localStorage.setItem('daiyndyq-language', 'ru')
    }, theme)
    const answer =
      'Example answer\n```text\nIELTS band = 7.0\n```\n> Evidence from the passage.'
    await page.route('**/api/v1/assistant/chat/stream', (route) =>
      route.fulfill({
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify({ type: 'delta', text: answer })}\n\ndata: ${JSON.stringify({ type: 'done', response: { message: { role: 'assistant', content: answer } } })}\n\n`,
      }),
    )
    await page.goto('./practice')
    await page
      .getByRole('button', { name: 'Открыть чат с Юки', exact: true })
      .last()
      .click()
    const widget = page.locator('#ai-assistant-widget')
    await widget.locator('input').fill('Help with IELTS')
    await widget.getByRole('button', { name: 'Отправить', exact: true }).click()
    const time = widget.locator(
      '.assistant-message:has(> .whitespace-pre-wrap) > .text-right',
    )
    const results = {
      timestamp: await contrast(time),
      code: await contrast(widget.locator('pre')),
    }
    await expect(time).toHaveText(/\d{1,2}:\d{2}/)
    await expect(widget.locator('blockquote')).toHaveCSS('font-style', 'normal')
    await expect(widget.locator('.bg-emerald-500.ring-1')).toHaveCount(1)
    await capture(page, `assistant-sent-code-${theme}`)
    await page.goto('./profile')
    await expect(
      page.getByRole('switch', { name: 'Показывать питомца (Юки)' }),
    ).toBeVisible()
    await expect(
      page.getByRole('switch', { name: 'Показывать питомца (Юки)' }),
    ).toBeChecked()
    await capture(page, `profile-${theme}`)
    const criterion = { band: 7, feedback: 'Criterion feedback' }
    await page.route('**/api/v1/attempts/band-result', (route) =>
      route.fulfill({
        json: {
          ...attempt,
          id: 'band-result',
          materialType: 'speaking',
          speakingEvaluation: {
            overallBand: 7,
            summary: 'Speaking feedback',
            pronunciationAvailable: true,
            criteria: {
              fluency: criterion,
              lexicalResource: criterion,
              grammar: criterion,
              pronunciation: criterion,
            },
            parts: [],
          },
        },
      }),
    )
    await page.goto('./attempts/band-result')
    // Subjective feedback no longer presents an unvalidated IELTS band.
    // Keep typography/contrast coverage on the actual review content instead.
    await expect(page.getByText('7.0', { exact: true })).toHaveCount(0)
    await expect(
      page.getByRole('region', { name: 'Ограничения учебного разбора' }),
    ).toBeVisible()
    const reviewSummary = page.getByText('Speaking feedback', { exact: true })
    await expect(reviewSummary).toBeVisible()
    await expect(reviewSummary).toHaveCSS('font-family', /Golos/)
    await contrast(reviewSummary)
    await capture(page, `result-feedback-${theme}`)

    await page.setViewportSize({ width: 360, height: 844 })
    await page.goto('./')
    await expect(page.locator('header h1')).toHaveCSS('font-family', /Golos/)
    await capture(page, `header-360-${theme}`)
    await page.goto('./not-a-page')
    await expect(page.locator('.brand-logo-stacked:visible')).toHaveCSS(
      'height',
      '120px',
    )
    await capture(page, `404-360-${theme}`)
    await page.goto('./exam/reading/brand-reading')
    const finish = page.getByRole('button', {
      name: /^(Завершить тест|Finish test)$/,
    })
    await insideViewport(finish)
    const input = page.locator('input').filter({ visible: true }).first()
    await input.fill('library')
    await page.locator('button[title]').filter({ hasText: /^2$/ }).click()
    const answered = page
      .locator('button.bg-primary-soft')
      .filter({ hasText: /^1$/ })
    const current = page
      .locator('button.bg-foreground')
      .filter({ hasText: /^2$/ })
    await expect(answered).toHaveCSS(
      'background-color',
      theme === 'dark' ? 'rgb(23, 43, 73)' : 'rgb(239, 246, 255)',
    )
    await expect(current).toHaveCSS(
      'background-color',
      theme === 'dark' ? 'rgb(236, 237, 234)' : 'rgb(23, 25, 28)',
    )
    await contrast(answered)
    await contrast(current)
    await capture(page, `reading-navigator-360-${theme}`)
    await page.setViewportSize({ width: 1440, height: 1000 })
    // ReadingReviewSplitRunner is exported but not routed in this baseline. Mount
    // that exact component with a router, and test its real evidence consumer.
    await page.evaluate(
      ({ material: m, attempt: a }) => {
        Object.assign(window, { reviewFixture: { m, a } })
      },
      { material, attempt },
    )
    await page.addScriptTag({
      type: 'module',
      content: `
      import React from '/app/node_modules/.vite/deps/react.js';
      import ReactDOM from '/app/node_modules/.vite/deps/react-dom_client.js';
      import {createRouter,createRootRoute,RouterProvider,createMemoryHistory} from '/app/node_modules/@tanstack/react-router/dist/esm/index.js';
      import {ReadingReviewSplitRunner} from '/app/src/pages/reading/reading-review-split-runner.tsx';
      import {PreviewEvidenceText} from '/app/src/features/admin/preview-answer.tsx';
      import {Badge} from '/app/src/components/ui/badge.tsx';
      import {LanguageProvider} from '/app/src/lib/i18n.tsx';
      import {QueryClient,QueryClientProvider} from '/app/node_modules/.vite/deps/@tanstack_react-query.js';
      const {m,a}=window.reviewFixture;
      const host=document.createElement('div');host.id='review-component-fixture';host.style.cssText='position:absolute;inset:0;z-index:1000;background:var(--background)';document.body.append(host);
      const route=createRootRoute({component:()=>React.createElement(React.Fragment,null,
        React.createElement(ReadingReviewSplitRunner,{material:m,attempt:a}),
        React.createElement('div',{id:'admin-evidence'},React.createElement(PreviewEvidenceText,{body:m.body,quote:a.review[0].quote})),
        React.createElement('article',{className:'blog-article'},React.createElement('mark',null,'Blog highlighted evidence')),
        React.createElement(Badge,{variant:'destructive'},'Destructive status'))});
      const router=createRouter({routeTree:route,history:createMemoryHistory({initialEntries:['/']})});
      ReactDOM.createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(QueryClientProvider,{client:new QueryClient()},React.createElement(RouterProvider,{router}))));
    `,
    })
    const evidence = page
      .locator('#review-component-fixture .bg-highlight')
      .first()
    await expect(evidence).toHaveCSS('background-color', 'rgb(254, 240, 138)')
    await expect(evidence).toHaveCSS(
      '--tw-ring-offset-color',
      theme === 'dark' ? '#1b1e21' : '#ffffff',
    )
    await expect(page.locator('#admin-evidence mark')).toHaveCSS(
      'background-color',
      'rgb(254, 240, 138)',
    )
    await expect(
      page.locator('#review-component-fixture article mark'),
    ).toHaveCSS('background-color', 'rgb(254, 240, 138)')
    const components = {
      ...results,
      readingEvidence: await contrast(evidence),
      adminEvidence: await contrast(page.locator('#admin-evidence mark')),
      blogMark: await contrast(
        page.locator('#review-component-fixture article mark'),
      ),
      destructiveBadge: await contrast(
        page.locator('#review-component-fixture [data-variant="destructive"]'),
      ),
    }
    await capture(page, `review-evidence-${theme}`)
    if (process.env.YRYS_REVIEW_DIR)
      await writeFile(
        `${process.env.YRYS_REVIEW_DIR}/component-contrast-${theme}.json`,
        JSON.stringify(components, null, 2),
      )
    // Real routed Speaking recording control, microphone input fixture only.
    await page.goto('./practice')
    await context.grantPermissions(['microphone'])
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        const audio = new AudioContext()
        const oscillator = audio.createOscillator()
        const output = audio.createMediaStreamDestination()
        oscillator.connect(output)
        oscillator.start()
        return output.stream
      }
    })
    const speaking = {
      ...attempt,
      id: 'speaking-attempt',
      materialType: 'speaking',
      status: 'IN_PROGRESS',
      submittedAt: null,
      review: [],
      recordings: [],
      answers: [],
      band: null,
    }
    const speakingMaterial: PublicSpeakingMaterial = {
      id: 'speaking',
      slug: 'speaking',
      difficulty: 'intermediate',
      description: '',
      title: 'Speaking practice',
      examType: 'academic',
      parts: [
        {
          id: 'part1',
          position: 1,
          preparationSeconds: 0,
          cueCard: [],
          type: 'part1',
          title: 'Introduction',
          instructions: 'Answer the question.',
          questions: [
            { id: 's-q1', position: 1, prompt: 'Describe your home.' },
          ],
          responseSeconds: 120,
        },
      ],
    }
    await page.route(
      '**/api/v1/speaking/materials/speaking/attempts',
      (route) =>
        route.fulfill({
          json: { material: speakingMaterial, attempt: speaking },
        }),
    )
    await page.route('**/api/v1/attempts/speaking-attempt', (route) =>
      route.fulfill({ json: speaking }),
    )
    await page.route('**/api/v1/attempts/speaking-attempt/answers', (route) =>
      route.fulfill({ json: { items: [] } }),
    )
    await page.goto('./exam/speaking/speaking')
    await page
      .getByRole('button', { name: /^(Начать запись|Start recording)$/ })
      .click()
    const stop = page.getByRole('button', {
      name: /^(Остановить и сохранить|Stop and save)$/,
    })
    await expect(stop).toHaveCSS(
      'background-color',
      theme === 'dark' ? 'rgb(240, 100, 90)' : 'rgb(194, 54, 43)',
    )
    const destructive = await contrast(stop)
    await capture(page, `speaking-recording-${theme}`)
    await page.setViewportSize({ width: 360, height: 844 })
    await insideViewport(stop)
    for (const control of await page
      .getByRole('button', { name: /^(Продолжить позже|Continue later)$/ })
      .all())
      await insideViewport(control)
    await capture(page, `speaking-recording-360-${theme}`)
    if (process.env.YRYS_REVIEW_DIR)
      await writeFile(
        `${process.env.YRYS_REVIEW_DIR}/speaking-contrast-${theme}.json`,
        JSON.stringify(destructive, null, 2),
      )
  })
}

test('profile reuses the translated Yuki settings wording in RU, KK and EN', async ({
  page,
}) => {
  await fixtures(page)
  for (const [locale, label, description] of [
    [
      'ru',
      'Показывать питомца (Юки)',
      'Управление отображением питомца Юки в интерфейсе.',
    ],
    ['kk', 'Юкиді көрсету', 'Юки көмекшісінің экранда көрсетілуін басқару.'],
    ['en', 'Show Yuki', 'Choose whether Yuki appears in the app.'],
  ]) {
    await page.goto('./profile')
    await page.evaluate(
      (value) => localStorage.setItem('daiyndyq-language', value),
      locale,
    )
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(
      page.getByRole('switch', { name: label, exact: true }),
    ).toBeVisible()
    await expect(page.getByText(description, { exact: true })).toBeVisible()
  }
})
