import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

type ReviewScreen = 'exam' | 'history' | 'bank' | 'fullmock'

async function openWritingReview(
  page: Page,
  screen: ReviewScreen = 'exam',
  inline = true,
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
          feedback: 'Комментарий к первому заданию',
          strengths: [],
          improvements: [],
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
          strengths: [],
          improvements: [],
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
    return route.fulfill({ json: { items: [] } })
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
    name: 'Ошибка 1: visitors has increased',
    exact: true,
  })
  const suggestion = taskTwo.getByRole('button', {
    name: 'Рекомендация 1: Many people study abroad',
    exact: true,
  })
  const secondCard = taskTwo.getByRole('button', {
    name: 'Рекомендация 1',
    exact: true,
  })
  await expect(error).toHaveClass(/decoration-red-500/)
  await expect(suggestion).toHaveClass(/decoration-amber-500/)
  await expect(
    taskTwo.getByText('A phrase never written by the student'),
  ).toHaveCount(0)

  await suggestion.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await suggestion.click()
  const popup = page.getByRole('dialog', { name: 'Рекомендация 1' })
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
    taskOne.getByRole('button', { name: 'Ошибка 1', exact: true }),
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
  const errorPopup = page.getByRole('dialog', { name: 'Ошибка 1' })
  await expect(errorPopup).toBeVisible()
  await expect(
    taskOne.getByRole('button', { name: 'Ошибка 1', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await errorPopup.getByRole('button', { name: 'Закрыть' }).click()
  await expect(errorPopup).not.toBeVisible()
  await expect(error).toBeFocused()
  expect(errors).toEqual([])
})

test('writing feedback fits a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await openWritingReview(page)
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page
      .getByRole('button', {
        name: 'Рекомендация 1: Many people study abroad',
        exact: true,
      })
      .click()
    const popup = page.getByRole('dialog', { name: 'Рекомендация 1' })
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
      page.getByRole('button', { name: 'Рекомендация 1', exact: true }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
  }
})

for (const screen of ['history', 'bank', 'fullmock'] as const) {
  test(`${screen}: original essay, inline feedback and rewrite survive the review route`, async ({
    page,
  }) => {
    await openWritingReview(page, screen)
    const taskTwo = page.getByRole('region', { name: 'Writing Task 2' })
    const highlight = taskTwo.getByRole('button', {
      name: 'Рекомендация 1: Many people study abroad',
      exact: true,
    })
    await expect(highlight).toBeVisible()
    await highlight.click()
    const popup = page.getByRole('dialog', { name: 'Рекомендация 1' })
    await expect(popup).toBeVisible()
    await expect(
      taskTwo.getByRole('button', { name: 'Рекомендация 1', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(
      taskTwo.getByText(
        'Many people believe that studying abroad broadens their perspective.',
        { exact: false },
      ),
    ).toBeVisible()
    await expect(
      page.getByText('See the separate Task 1 and Task 2 feedback.'),
    ).toHaveCount(0)
  })
}

test('a saved evaluation without inline annotations still displays the essay honestly', async ({
  page,
}) => {
  await openWritingReview(page, 'history', false)
  await expect(
    page.getByText('The visitors has increased.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Many people study abroad.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Замечаний к отдельным фрагментам в этой проверке нет.', {
      exact: true,
    }),
  ).toHaveCount(2)
  await expect(page.locator('[id^="annotation-card-"]')).toHaveCount(0)
})
