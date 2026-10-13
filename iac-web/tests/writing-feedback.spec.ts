import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function openWritingReview(page: Page) {
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
    id: 'writing-attempt',
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
          annotations: [annotation('visitors has increased', 'error')],
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
          annotations: [
            annotation('Many people study abroad', 'suggestion'),
            annotation('A phrase never written by the student', 'error'),
          ],
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
    if (path.endsWith('/attempts/writing-attempt')) {
      return route.fulfill({ json: attempt })
    }
    return route.fulfill({ json: { items: [] } })
  })
  await page.goto('./exam/writing/material')
  await expect(
    page.getByRole('region', { name: 'Writing Task 2' }),
  ).toBeVisible()
}

test('each task links to its own card and honours annotation severity', async ({
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
  await expect(error).toHaveClass(/decoration-red-500/)
  await expect(suggestion).toHaveClass(/decoration-amber-500/)
  await expect(
    taskTwo.getByText('A phrase never written by the student'),
  ).toHaveCount(0)

  await suggestion.click()
  await expect(secondCard).toBeFocused()
  await expect(secondCard).toHaveAttribute('aria-pressed', 'true')
  await expect(
    taskOne.getByRole('button', { name: 'Error 1', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
  expect(await suggestion.getAttribute('aria-controls')).toBe(
    await secondCard.getAttribute('id'),
  )
  const ids = await page
    .locator('[id^="annotation-card-"]')
    .evaluateAll((elements) => elements.map((element) => element.id))
  expect(new Set(ids).size).toBe(ids.length)

  await error.focus()
  await page.keyboard.press('Enter')
  await expect(
    taskOne.getByRole('button', { name: 'Error 1', exact: true }),
  ).toBeFocused()
  expect(errors).toEqual([])
})

test('writing feedback fits a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await openWritingReview(page)
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    await expect(
      page.getByRole('button', { name: 'Suggestion 1', exact: true }),
    ).toBeVisible()
  }
})
