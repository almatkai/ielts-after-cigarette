import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type {
  Learning,
  TaskPerformance,
} from '../src/features/study-plan/learning-api'
import { cycleFixture, learningFixture, stamp } from './fixtures/learning'

function task(overrides: Partial<TaskPerformance> = {}): TaskPerformance {
  return {
    section: 'reading',
    questionType: 'true_false_not_given',
    title: 'True / False / Not Given',
    answered: 13,
    correct: 9,
    incorrect: 4,
    sourceCount: 3,
    practiceAnswered: 0,
    sourceRefs: [
      {
        sourceId: 'passage-1',
        attemptId: 'attempt-reading',
        title: 'Blue passage',
        occurredAt: stamp,
        answered: 5,
        correct: 1,
        incorrect: 4,
      },
    ],
    limitations: [
      'Показаны первые проверенные сданные ответы; повторы отдельно.',
    ],
    ...overrides,
  }
}
async function setup(
  page: Page,
  data: Omit<Learning, 'taskPerformance'> & {
    taskPerformance?: TaskPerformance[]
  },
) {
  const unexpected: string[] = [],
    errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname
    if (path === '/api/v1/billing/me')
      return route.fulfill({ json: { paywallEnabled: false, guest: false } })
    if (request.method() === 'POST' && path === '/api/v1/auth/refresh')
      return route.fulfill({
        json: {
          accessToken: 'test-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'task-student',
            role: 'STUDENT',
            email: 'task@example.test',
            displayName: 'Task student',
            timezone: 'Asia/Almaty',
          },
        },
      })
    if (request.method() === 'POST' && path === '/api/v1/analytics/ping')
      return route.fulfill({ status: 204 })
    if (request.method() === 'GET' && path === '/api/v1/guest/session')
      return route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } })
    if (request.method() === 'GET' && path === '/api/v1/study-plan/learning')
      return route.fulfill({ json: data })
    if (
      request.method() === 'GET' &&
      ['/api/v1/attempts', '/api/v1/full-mock-sessions/active'].includes(path)
    )
      return route.fulfill({ json: { items: [] } })
    unexpected.push(`${request.method()} ${path}`)
    return route.fulfill({
      status: 501,
      json: { code: 'UNEXPECTED_TEST_REQUEST' },
    })
  })
  return () => {
    expect(unexpected).toEqual([])
    expect(errors).toEqual([])
  }
}
function panel(page: Page) {
  return page.getByRole('region', { name: 'Типы заданий', exact: true })
}
function rows(page: Page) {
  return panel(page).getByTestId('task-performance-row')
}

test('first-answer counts, source refs, all-correct and single-source caution; panel filters do not hide W/S cycles', async ({
  page,
}) => {
  const data = learningFixture()
  data.cycles.push(
    cycleFixture('writing', 'writing'),
    cycleFixture('speaking', 'speaking'),
  )
  data.taskPerformance = [
    task({
      section: 'listening',
      questionType: 'form_completion',
      title: 'Form completion',
      answered: 9,
      correct: 9,
      incorrect: 0,
      sourceCount: 2,
      sourceRefs: [],
    }),
    task({
      questionType: 'short_answer',
      title: 'Short answer',
      answered: 4,
      correct: 3,
      incorrect: 1,
      sourceCount: 1,
      sourceRefs: [],
    }),
    task({ practiceAnswered: 7 }),
  ]
  const verify = await setup(page, data)
  await page.goto('plan/learning')
  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).nth(0)).toContainText('4/13 ошибок')
  await expect(rows(page).nth(0).getByRole('cell').nth(1)).toHaveText(
    'Источников 3',
  )
  await expect(panel(page)).toContainText('Ответов в повторных попытках: 7')
  await expect(rows(page).nth(1)).toContainText(
    'Пока один источник — вывод предварительный',
  )
  await expect(rows(page).nth(1)).not.toContainText(/слаб|дефицит/i)
  await expect(rows(page).nth(2)).toContainText('0/9 ошибок')
  await panel(page)
    .getByText('Источники и ограничения', { exact: true })
    .click()
  await expect(
    panel(page).getByRole('link', { name: 'Blue passage' }),
  ).toHaveAttribute('href', '/app/attempts/attempt-reading')
  await expect(panel(page)).toContainText('неверно 4 из 5')
  await expect(panel(page)).toContainText('Ещё 2 источников не показано')
  await expect(panel(page)).toContainText(
    'Показаны первые проверенные сданные ответы',
  )
  await panel(page).getByRole('tab', { name: 'Listening', exact: true }).click()
  await expect(rows(page)).toHaveCount(1)
  await expect(page.getByTestId('learning-cycle-row')).toHaveCount(2)
  await page.getByRole('button', { name: /Показать ещё/ }).click()
  await expect(
    page.getByTestId('learning-cycle-row').filter({ hasText: 'Writing ·' }),
  ).toHaveCount(1)
  await expect(
    page.getByTestId('learning-cycle-row').filter({ hasText: 'Speaking ·' }),
  ).toHaveCount(1)
  await panel(page).getByRole('tab', { name: 'Все', exact: true }).click()
  await panel(page).getByRole('switch', { name: 'Только с ошибками' }).check()
  await expect(rows(page)).toHaveCount(2)
  await expect(panel(page)).not.toContainText(/\d+%|percentile/)
  verify()
})

for (const variant of ['omitted', 'empty', '25-zero'] as const) {
  test(`${variant} old or unencountered DTO has no observations, no zero or perfect scores`, async ({
    page,
  }) => {
    const data: Omit<Learning, 'taskPerformance'> & {
      taskPerformance?: TaskPerformance[]
    } = learningFixture()
    if (variant === 'omitted') delete data.taskPerformance
    if (variant === '25-zero')
      data.taskPerformance = Array.from({ length: 25 }, (_, i) =>
        task({
          questionType: `format-${i}`,
          answered: 0,
          correct: 0,
          incorrect: 0,
          sourceCount: 0,
          sourceRefs: [],
          practiceAnswered: 0,
        }),
      )
    const verify = await setup(page, data)
    await page.goto('plan/learning')
    await expect(rows(page)).toHaveCount(0)
    await expect(panel(page)).toContainText(
      'Проверенных ответов по типам заданий пока нет.',
    )
    await expect(panel(page)).not.toContainText(/Верно 0|100%|Неверно 0/)
    await expect(page.getByTestId('learning-cycle-row')).toHaveCount(1)
    verify()
  })
}

test('practice-only and unknown future types stay readable, with no initial or perfect result', async ({
  page,
}) => {
  const data = learningFixture()
  data.taskPerformance = [
    task({
      title: '',
      questionType: 'future_format',
      answered: 0,
      correct: 0,
      incorrect: 0,
      sourceCount: 0,
      sourceRefs: [],
      practiceAnswered: 3,
    }),
  ]
  const verify = await setup(page, data)
  await page.goto('plan/learning')
  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page)).toContainText('Reading · future format')
  await expect(rows(page)).toContainText(
    'Исходных проверенных ответов пока нет',
  )
  await expect(panel(page)).toContainText('Ответов в повторных попытках: 3')
  await expect(rows(page)).not.toContainText(/Верно 0|100%/)
  await expect(rows(page).getByRole('link', { name: /Разобрать/ })).toHaveCount(
    0,
  )
  verify()
})

test('exact URL filters cover every cycle state, lift two-card cap and survive reload/back/forward; drill mistakes stay out', async ({
  page,
}) => {
  const data = learningFixture()
  const reading = Array.from({ length: 3 }, (_, i) => cycleFixture(`tfng-${i}`))
  const waiting = cycleFixture('waiting')
  waiting.status = 'awaiting-transfer'
  const demonstrated = cycleFixture('done')
  demonstrated.status = 'demonstrated'
  const skipped = cycleFixture('skipped')
  skipped.skippedAt = stamp
  const unrelated = cycleFixture('short')
  unrelated.source.questionType = 'short_answer'
  const drill = cycleFixture('drill')
  drill.source.attemptId = ''
  drill.source.sessionId = 'practice'
  drill.source.questionType = 'ms-r-tfng'
  const drillSameType = cycleFixture('drill-same-type')
  drillSameType.source.attemptId = ''
  drillSameType.source.sessionId = 'practice-2'
  const listening = cycleFixture('listening', 'listening')
  listening.source.questionType = 'true_false_not_given'
  data.cycles = [
    ...reading,
    waiting,
    demonstrated,
    skipped,
    unrelated,
    drill,
    drillSameType,
    listening,
  ]
  data.taskPerformance = [task()]
  const verify = await setup(page, data)
  await page.goto('plan/learning')
  await panel(page)
    .getByRole('link', { name: /Разобрать/ })
    .click()
  await expect(page).toHaveURL(/section=reading&type=true_false_not_given/)
  await expect(page.getByRole('status')).toContainText('найдено: 6')
  await expect(
    page.getByTestId('learning-cycle-row').filter({ visible: true }),
  ).toHaveCount(5)
  await expect(page.getByRole('button', { name: /Показать ещё/ })).toHaveCount(
    0,
  )
  await page.getByText('Отложенные ошибки', { exact: true }).click()
  await expect(
    page.getByTestId('learning-cycle-row').filter({ visible: true }),
  ).toHaveCount(6)
  await expect(
    page.getByTestId('learning-cycle-row').filter({ hasText: 'Listening' }),
  ).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('status')).toContainText('найдено: 6')
  await page.getByRole('link', { name: 'Сбросить фильтр' }).click()
  await expect(page).not.toHaveURL(/type=/)
  await page.goBack()
  await expect(page.getByRole('status')).toContainText('найдено: 6')
  await page.goForward()
  await expect(page.getByRole('link', { name: 'Сбросить фильтр' })).toHaveCount(
    0,
  )
  verify()
})

test('an error total without matching cycles is honest; unknown strings are safe and invalid structured search is ignored', async ({
  page,
}) => {
  const data = learningFixture()
  data.taskPerformance = [
    task({ questionType: 'future_format', title: 'Future format' }),
  ]
  const verify = await setup(page, data)
  await page.goto('plan/learning')
  await panel(page)
    .getByRole('link', { name: /Разобрать/ })
    .click()
  await expect(page.getByRole('status')).toContainText('найдено: 0')
  await expect(
    page.getByText('Для этих ошибок карточек правки пока нет.', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByTestId('learning-cycle-row')).toHaveCount(0)
  await page.goto('plan/learning?section=reading&type=javascript%3Aalert(1)')
  await expect(page.getByRole('status')).toContainText('javascript:alert(1)')
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0)
  await page.goto('plan/learning?section=writing&type=%7B%22x%22%3A1%7D')
  await expect(page.getByTestId('learning-cycle-row')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Сбросить фильтр' })).toHaveCount(
    0,
  )
  verify()
})

test('real-scenario first answers remain distinct from repeats and two sources', async ({
  page,
}) => {
  const data = learningFixture()
  data.taskPerformance = [
    task({
      answered: 6,
      correct: 1,
      incorrect: 5,
      sourceCount: 2,
      practiceAnswered: 3,
    }),
    task({
      questionType: 'short_answer',
      title: 'Short answer',
      answered: 4,
      correct: 3,
      incorrect: 1,
      sourceCount: 2,
      practiceAnswered: 2,
      sourceRefs: [],
    }),
  ]
  const verify = await setup(page, data)
  await page.goto('plan/learning')
  await expect(rows(page).nth(0)).toContainText('5/6 ошибок')
  await expect(rows(page).nth(0).getByRole('cell').nth(1)).toHaveText(
    'Источников 2',
  )
  await expect(panel(page)).toContainText('Ответов в повторных попытках: 3')
  await expect(rows(page).nth(1)).toContainText('1/4 ошибок')
  await expect(rows(page).nth(1).getByRole('cell').nth(1)).toHaveText(
    'Источников 2',
  )
  await expect(panel(page)).toContainText('Ответов в повторных попытках: 2')
  verify()
})

for (const width of [360, 1280]) {
  test(`mock visual ${width}px fits with 44px targets and separate unverified W/S`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    const data = learningFixture()
    data.taskPerformance = [
      task({ practiceAnswered: 3 }),
      task({
        questionType: 'short_answer',
        title: 'Short answer',
        answered: 4,
        correct: 3,
        incorrect: 1,
        sourceCount: 1,
        sourceRefs: [],
      }),
    ]
    const writing = cycleFixture('writing', 'writing')
    writing.status = 'correction-saved'
    writing.correction = {
      text: 'My revision',
      explanation: 'My explanation',
      assisted: false,
      savedAt: stamp,
      verdict: 'unverified',
      feedback: 'Requires independent assessment',
    }
    data.cycles.push(writing)
    const verify = await setup(page, data)
    await page.goto('plan/learning')
    await expect(rows(page)).toHaveCount(2)
    await expect(
      page.getByText('Правка сохранена, не проверена', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByTestId('learning-cycle-row').filter({ hasText: 'Writing' }),
    ).toHaveCount(1)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    for (const target of await panel(page)
      .locator('button, a, label, summary')
      .all()) {
      const box = await target.boundingBox()
      if (box) {
        const touchHeight = await target.evaluate(
          (element) =>
            (element.closest('label') ?? element).getBoundingClientRect()
              .height,
        )
        expect(touchHeight).toBeGreaterThanOrEqual(width === 360 ? 44 : 36)
      }
    }
    await page.screenshot({
      path: testInfo.outputPath(`task-performance-mock-${width}.png`),
      fullPage: true,
    })
    verify()
  })
}
