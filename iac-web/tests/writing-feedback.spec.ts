import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { cycleFixture, learningFixture } from './fixtures/learning'

const observations = new WeakMap<
  Page,
  { unexpected: string[]; errors: string[] }
>()
test.afterEach(({ page }) => {
  const seen = observations.get(page)
  if (seen) {
    expect(seen.unexpected).toEqual([])
    expect(seen.errors).toEqual([])
  }
})

type ReviewScreen = 'exam' | 'history' | 'bank' | 'fullmock'

async function openWritingReview(
  page: Page,
  screen: ReviewScreen = 'exam',
  inline = true,
  correctedTask?: 'task-one' | 'task-two',
  options: {
    learning?: 'cycle' | 'no-cycle' | 'network-error'
    readOnly?: boolean
  } = {},
) {
  const criterion = { band: 7, feedback: 'Clear, accurate sentences.' }
  const criteria = {
    taskResponse: criterion,
    coherence: criterion,
    lexicalResource: criterion,
    grammar: criterion,
  }
  const annotation = (quote: string, severity: 'error' | 'suggestion') => ({
    id: 1,
    quote,
    replacement: 'An alternative formulation',
    type: 'grammar',
    severity,
    explanationRu: 'Исправление или необязательное улучшение конструкции.',
    alternatives: [],
  })
  const attempt = {
    id: '11111111-1111-4111-8111-111111111111',
    materialType: 'writing',
    materialId: 'material',
    materialVersionId: 'version',
    status: 'SUBMITTED',
    score: null,
    maxScore: null,
    band: 7,
    startedAt: '2026-10-12T09:00:00Z',
    submittedAt: '2026-10-12T10:00:00Z',
    answers: [
      {
        questionId: 'task-one',
        answer: { value: 'The visitors has increased.' },
      },
      {
        questionId: 'task-two',
        answer: { value: 'Many people study abroad.' },
      },
    ],
    writingEvaluation: {
      model: 'fixture',
      overallBand: 7,
      criteria,
      summary: 'Разбор двух заданий',
      evaluatedAt: '2026-10-12T10:00:00Z',
      tasks: [
        {
          taskId: 'task-one',
          position: 1,
          band: 7,
          criteria,
          modelParagraph: 'The chart shows an overall rise in visitor numbers.',
          feedback: 'Комментарий к первому заданию',
          strengths: ['Task 1 strength'],
          improvements: ['Task 1 improvement'],
          annotations: inline
            ? [annotation('visitors has increased', 'error')]
            : [],
        },
        {
          taskId: 'task-two',
          position: 2,
          band: 7,
          criteria,
          feedback: 'Комментарий ко второму заданию',
          strengths: ['Task 2 strength'],
          improvements: ['Task 2 improvement'],
          // Both tasks start at #1; the second is a grammar suggestion.
          modelParagraph:
            'Many people believe that studying abroad broadens their perspective.',
          annotations: inline
            ? [
                annotation('Many people study abroad', 'suggestion'),
                annotation('A phrase never written by the student', 'error'),
              ]
            : [],
        },
      ],
    },
  }
  const material = {
    id: 'material',
    slug: 'writing',
    examType: 'academic',
    difficulty: 'intermediate',
    title: 'Writing feedback',
    description: '',
    durationMinutes: 60,
    tasks: [
      {
        id: 'task-one',
        position: 1,
        type: 'task1',
        prompt: 'Describe the data.',
        minimumWords: 150,
      },
      {
        id: 'task-two',
        position: 2,
        type: 'task2',
        prompt: 'Discuss studying abroad.',
        minimumWords: 250,
      },
    ],
  }
  const seen = { unexpected: [] as string[], errors: [] as string[] }
  observations.set(page, seen)
  page.on('pageerror', (error) => seen.errors.push(error.message))
  const learning = learningFixture()
  learning.readOnly = options.readOnly ?? false
  learning.cycles = []
  learning.drills = []
  learning.profiles = []
  if (options.learning !== 'no-cycle') {
    const cycle = cycleFixture('task-two-cycle', 'writing')
    cycle.source.attemptId = attempt.id
    cycle.source.questionId = 'task-two'
    cycle.source.prompt = 'Discuss studying abroad.'
    cycle.source.originalAnswer = 'Many people study abroad.'
    learning.cycles.push(cycle)
  }
  if (correctedTask) {
    const cycle =
      learning.cycles.find(
        (item) => item.source.questionId === correctedTask,
      ) ?? cycleFixture('corrected-task-cycle', 'writing')
    cycle.source.attemptId = attempt.id
    cycle.source.questionId = correctedTask
    cycle.source.prompt =
      correctedTask === 'task-one'
        ? 'Describe the data.'
        : 'Discuss studying abroad.'
    cycle.source.originalAnswer =
      correctedTask === 'task-one'
        ? 'The visitors has increased.'
        : 'Many people study abroad.'
    cycle.correction = {
      text: 'Studying abroad broadens perspectives through daily contact with different customs.',
      explanation: 'I linked the claim to a mechanism.',
      assisted: false,
      savedAt: '2026-10-24T10:00:00Z',
      verdict: 'unverified',
      feedback: 'Saved, not assessed.',
    }
    cycle.status = 'correction-saved'
    if (!learning.cycles.includes(cycle)) learning.cycles.push(cycle)
  }
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/auth/refresh')) {
      return route.fulfill({
        json: {
          accessToken: 'mock-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'student',
            role: 'STUDENT',
            email: 'student@example.test',
            displayName: 'Student',
            timezone: 'UTC',
          },
        },
      })
    }
    if (path.endsWith('/study-plan/learning')) {
      if (options.learning === 'network-error')
        return route.abort('connectionfailed')
      return route.fulfill({ json: learning })
    }
    if (path === '/api/v1/guest/session')
      return route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } })
    if (path === '/api/v1/analytics/ping') return route.fulfill({ status: 204 })
    if (path === '/api/v1/dashboard')
      return route.fulfill({
        json: {
          profile: { currentBand: null, targetBand: null, examDate: null },
          todayPlan: [],
          skillProgress: [],
          recommendedAction: {
            title: 'Practice',
            description: '',
            target: '/practice',
          },
          unreadNotifications: 0,
        },
      })
    if (
      path === '/api/v1/attempts' ||
      path === '/api/v1/full-mock-sessions/active'
    )
      return route.fulfill({ json: { items: [] } })
    if (path.endsWith('/writing/materials/material/attempts')) {
      return route.fulfill({ json: { attempt, material } })
    }
    if (path.endsWith('/attempts/mistakes/attempts')) {
      return route.fulfill({
        json: {
          items: [
            {
              ...attempt,
              testTitle: 'Writing feedback',
              testSlug: 'writing',
              mistakeCount: null,
            },
          ],
          page: 1,
          hasNext: false,
        },
      })
    }
    if (
      path.endsWith('/attempts/11111111-1111-4111-8111-111111111111/mistakes')
    ) {
      return route.fulfill({
        json: {
          attempt,
          answers: attempt.answers,
          writingEvaluation: attempt.writingEvaluation,
          review: [],
          contexts: [],
        },
      })
    }
    if (path.endsWith('/full-mock-sessions/mock-session')) {
      return route.fulfill({
        json: {
          id: 'mock-session',
          mockTestId: 'mock',
          status: 'SUBMITTED',
          currentSection: 4,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          overallBand: 7,
          mockTest: {
            id: 'mock',
            examType: 'academic',
            title: 'Full Mock test',
          },
          sections: [{ position: 3, skill: 'writing', attempt }],
        },
      })
    }
    if (path.endsWith('/attempts/11111111-1111-4111-8111-111111111111')) {
      return route.fulfill({ json: attempt })
    }
    seen.unexpected.push(`${route.request().method()} ${path}`)
    return route.fulfill({
      status: 501,
      json: { code: 'UNEXPECTED_FIXTURE_REQUEST' },
    })
  })
  const urls: Record<ReviewScreen, string> = {
    exam: './exam/writing/material',
    history: './attempts/11111111-1111-4111-8111-111111111111',
    bank: './mistakes?skill=writing&page=1&attempt=11111111-1111-4111-8111-111111111111',
    fullmock:
      './attempts/11111111-1111-4111-8111-111111111111?session=mock-session',
  }
  await page.goto(urls[screen])
  await expect(
    page.getByRole('region', { name: 'Writing Task 2' }),
  ).toBeVisible({ timeout: 15_000 })
  await expect(
    page.getByRole('region', { name: 'Ограничения учебного разбора' }),
  ).toBeVisible()
  await expect(page.getByText('IELTS Band Score', { exact: true })).toHaveCount(
    0,
  )
  await expect(page.getByText('7.0', { exact: true })).toHaveCount(0)
}

test('each task opens inline feedback and keeps its detailed card', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openWritingReview(page)
  const taskOne = page.getByRole('region', { name: 'Writing Task 1' })
  const taskTwo = page.getByRole('region', { name: 'Writing Task 2' })
  const error = taskOne.getByRole('button', {
    name: 'Error 1: visitors has increased',
    exact: true,
  })
  const suggestion = taskTwo.getByRole('button', {
    name: 'Suggestion 1: Many people study abroad',
    exact: true,
  })
  const secondCard = taskTwo.getByRole('button', {
    name: 'Suggestion 1',
    exact: true,
  })
  await expect(error).toHaveClass(/decoration-destructive/)
  await expect(suggestion).toHaveClass(/decoration-warning-fg/)
  await expect(
    taskTwo.getByText('A phrase never written by the student'),
  ).toHaveCount(0)

  await suggestion.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await suggestion.click()
  const popup = page.getByRole('dialog', { name: 'Suggestion 1' })
  await expect(popup).toBeVisible()
  await expect(popup.getByText('An alternative formulation')).toBeVisible()
  await expect(
    popup.getByText('Исправление или необязательное улучшение конструкции.'),
  ).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scrollBefore, 0)
  await expect(secondCard).toBeVisible()
  await expect(secondCard).not.toBeFocused()
  await expect(secondCard).toHaveAttribute('aria-pressed', 'true')
  await expect(
    taskOne.getByRole('button', { name: 'Error 1', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
  expect(await suggestion.getAttribute('aria-controls')).toBe(
    await popup.getAttribute('id'),
  )
  const ids = await page
    .locator('[id^="annotation-card-"]')
    .evaluateAll((elements) => elements.map((element) => element.id))
  expect(new Set(ids).size).toBe(ids.length)

  await page.keyboard.press('Escape')
  await expect(popup).not.toBeVisible()
  await expect(suggestion).toBeFocused()

  await error.focus()
  await page.keyboard.press('Enter')
  const errorPopup = page.getByRole('dialog', { name: 'Error 1' })
  await expect(errorPopup).toBeVisible()
  await expect(
    taskOne.getByRole('button', { name: 'Error 1', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await errorPopup.getByRole('button', { name: 'Close' }).click()
  await expect(errorPopup).not.toBeVisible()
  await expect(error).toBeFocused()
  expect(errors).toEqual([])
})

test('writing comparison pairs the answer and example on desktop and stacks them on mobile', async ({
  page,
}, testInfo) => {
  await openWritingReview(page, 'exam', true, 'task-one')
  const task = page.getByRole('region', { name: 'Writing Task 1', exact: true })
  await expect(task.getByRole('table')).toBeVisible()
  const model = task.getByRole('region', {
    name: 'Model paragraph for comparison',
    exact: true,
  })
  const answer = task.getByText('Your essay with feedback', {
    exact: true,
  })
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(model).toBeVisible()
    const answerBox = await answer.boundingBox()
    const modelBox = await model.boundingBox()
    expect(answerBox).not.toBeNull()
    expect(modelBox).not.toBeNull()
    if (width === 1280) {
      expect(modelBox!.x).toBeGreaterThan(answerBox!.x + answerBox!.width)
    } else {
      expect(modelBox!.y).toBeGreaterThan(answerBox!.y + answerBox!.height)
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
      path: testInfo.outputPath(`writing-${width}.png`),
      fullPage: true,
    })
  }
  const toggle = model.getByRole('button', { name: 'Hide', exact: true })
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await toggle.click()
  await expect(
    model.getByRole('button', { name: 'Show', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false')
})

test('inline feedback and suggestions open above the selected essay passage', async ({
  page,
}) => {
  await openWritingReview(page)
  for (const position of [1, 2]) {
    const task = page.getByRole('region', {
      name: `Writing Task ${position}`,
      exact: true,
    })
    await expect(
      task.getByText('Your essay with feedback', { exact: true }),
    ).toBeVisible()
    await expect(
      task.getByText('Overall feedback', { exact: true }),
    ).toBeVisible()
    await expect(
      task.getByText(`Task ${position} improvement`, { exact: true }),
    ).toBeVisible()
    const label = position === 1 ? 'Error 1' : 'Suggestion 1'
    const passage = task.getByRole('button', {
      name:
        position === 1
          ? 'Error 1: visitors has increased'
          : 'Suggestion 1: Many people study abroad',
      exact: true,
    })
    await passage.evaluate((element) =>
      element.scrollIntoView({ block: 'center' }),
    )
    await passage.click()
    const popup = page.getByRole('dialog', { name: label, exact: true })
    await expect(popup).toBeVisible()
    await expect(popup).toHaveAttribute('data-side', 'top')
    const passageBox = await passage.boundingBox()
    const popupBox = await popup.boundingBox()
    expect(passageBox).not.toBeNull()
    expect(popupBox).not.toBeNull()
    expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(passageBox!.y)
    await expect(
      task.getByRole('button', { name: label, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(passage).toBeFocused()
  }
})

test('writing feedback fits a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await openWritingReview(page)
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page
      .getByRole('button', {
        name: 'Suggestion 1: Many people study abroad',
        exact: true,
      })
      .click()
    const popup = page.getByRole('dialog', { name: 'Suggestion 1' })
    await expect(popup).toBeVisible()
    await expect(popup).toHaveAttribute('data-side', 'top')
    const bounds = await popup.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    await expect(
      page.getByRole('button', { name: 'Suggestion 1', exact: true }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
  }
})

for (const screen of ['history', 'bank', 'fullmock'] as const) {
  for (const corrected of [false, true]) {
    test(`${screen}: original essay and inline feedback survive with model answer ${corrected ? 'unlocked by correction' : 'waiting for own correction'}`, async ({
      page,
    }) => {
      await openWritingReview(
        page,
        screen,
        true,
        corrected ? 'task-two' : undefined,
      )
      const taskTwo = page.getByRole('region', { name: 'Writing Task 2' })
      const highlight = taskTwo.getByRole('button', {
        name: 'Suggestion 1: Many people study abroad',
        exact: true,
      })
      await expect(highlight).toBeVisible()
      await highlight.click()
      const popup = page.getByRole('dialog', { name: 'Suggestion 1' })
      await expect(popup).toBeVisible()
      await expect(
        taskTwo.getByRole('button', { name: 'Suggestion 1', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true')
      await page.keyboard.press('Escape')
      const model = taskTwo.getByText(
        'Many people believe that studying abroad broadens their perspective.',
        { exact: false },
      )
      const correctionRequired = taskTwo.getByText(
        'Сначала сохраните собственное исправление',
        { exact: false },
      )
      if (corrected) {
        await expect(model).toBeVisible()
        await expect(correctionRequired).toHaveCount(0)
      } else {
        await expect(model).toHaveCount(0)
        await expect(correctionRequired).toBeVisible()
      }
      await expect(
        page.getByText('See the separate Task 1 and Task 2 feedback.'),
      ).toHaveCount(0)
    })
  }
}

for (const correctedTask of ['task-one', 'task-two'] as const) {
  test(`a persisted correction of ${correctedTask} unlocks only that task's model paragraph`, async ({
    page,
  }) => {
    await openWritingReview(page, 'history', true, correctedTask)
    const taskOneModel = page
      .getByRole('region', { name: 'Writing Task 1' })
      .getByText('The chart shows an overall rise in visitor numbers.', {
        exact: false,
      })
    if (correctedTask === 'task-one') await expect(taskOneModel).toBeVisible()
    else await expect(taskOneModel).toHaveCount(0)
    const task = page.getByRole('region', { name: 'Writing Task 2' })
    const model = task.getByText(
      'Many people believe that studying abroad broadens their perspective.',
      { exact: false },
    )
    if (correctedTask === 'task-two') {
      await expect(model).toBeVisible()
      await page.reload()
      await expect(model).toBeVisible()
    } else {
      await expect(model).toHaveCount(0)
      await expect(
        task.getByText('Сначала сохраните собственное исправление', {
          exact: false,
        }),
      ).toBeVisible()
    }
  })
}

test('a saved evaluation without inline annotations still displays the essay honestly', async ({
  page,
}) => {
  await openWritingReview(page, 'history', false, undefined, {
    learning: 'no-cycle',
  })
  await expect(
    page.getByText('The visitors has increased.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Many people study abroad.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText(
      'This assessment has no feedback on individual text passages.',
      { exact: true },
    ),
  ).toHaveCount(2)
  await expect(page.locator('[id^="annotation-card-"]')).toHaveCount(0)
})

test('a task without an actionable cycle explains unavailability instead of asking for a nonexistent correction', async ({
  page,
}) => {
  await openWritingReview(page, 'history', false, undefined, {
    learning: 'no-cycle',
  })
  const task = page.getByRole('region', { name: 'Writing Task 2' })
  await expect(
    task.getByText('Для этого задания нет доступного учебного цикла правки.', {
      exact: false,
    }),
  ).toBeVisible()
  await expect(
    task.getByText('Сначала сохраните', { exact: false }),
  ).toHaveCount(0)
  await expect(
    task.getByText(
      'Many people believe that studying abroad broadens their perspective.',
      { exact: false },
    ),
  ).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: /Исправить эту ошибку/ }),
  ).toHaveCount(0)
})

test('learning network failure keeps model paragraph hidden with an honest unavailable message', async ({
  page,
}) => {
  await openWritingReview(page, 'history', false, undefined, {
    learning: 'network-error',
  })
  const task = page.getByRole('region', { name: 'Writing Task 2' })
  await expect(
    task.getByText('Учебные циклы сейчас недоступны.', { exact: false }),
  ).toBeVisible()
  await expect(
    task.getByText('Сначала сохраните', { exact: false }),
  ).toHaveCount(0)
  await expect(
    task.getByText(
      'Many people believe that studying abroad broadens their perspective.',
      { exact: false },
    ),
  ).toHaveCount(0)
})

test('read-only learning does not ask the learner to save a new correction', async ({
  page,
}) => {
  await openWritingReview(page, 'history', true, undefined, { readOnly: true })
  const task = page.getByRole('region', { name: 'Writing Task 2' })
  await expect(
    task.getByText('Для этого задания нет доступного учебного цикла правки.', {
      exact: false,
    }),
  ).toBeVisible()
  await expect(
    task.getByText('Сначала сохраните', { exact: false }),
  ).toHaveCount(0)
  await expect(
    task.getByText(
      'Many people believe that studying abroad broadens their perspective.',
      { exact: false },
    ),
  ).toHaveCount(0)
})
