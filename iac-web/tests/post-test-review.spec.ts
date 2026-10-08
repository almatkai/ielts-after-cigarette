import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { AttemptReviewItem } from '../src/features/attempts/api'

const criterion = { band: 7, feedback: 'Criterion feedback' }
const base = {
  materialId: 'material',
  materialVersionId: 'pinned-version',
  status: 'SUBMITTED',
  score: 1,
  maxScore: 2,
  band: 6,
  startedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
}
const mistake = (skill: string): AttemptReviewItem => ({
  questionId: `${skill}-wrong`,
  number: 1,
  prompt: `${skill}: wrong question`,
  type: 'short_answer',
  content: {},
  answer: { value: 'old answer' },
  isCorrect: false,
  pointsAwarded: 0,
  correctAnswer: { accepted: [`${skill}-correct`] },
  explanation: `${skill}: explanation`,
})
const detail = (skill: string) => ({
  ...base,
  id: `${skill}-attempt`,
  materialType: skill,
  review:
    skill === 'reading' || skill === 'listening'
      ? [
          mistake(skill),
          {
            ...mistake(skill),
            questionId: `${skill}-right`,
            number: 2,
            prompt: `${skill}: right question`,
            isCorrect: true,
          },
        ]
      : [],
  ...(skill === 'writing'
    ? {
        writingEvaluation: {
          overallBand: 7,
          summary: 'Writing feedback',
          model: 'fixture',
          evaluatedAt: base.submittedAt,
          criteria: {
            taskResponse: criterion,
            coherence: criterion,
            lexicalResource: criterion,
            grammar: criterion,
          },
          tasks: [
            {
              taskId: 'task',
              position: 1,
              feedback: 'Essay feedback',
              strengths: [],
              improvements: ['Writing suggestion'],
            },
          ],
        },
      }
    : {}),
  ...(skill === 'speaking'
    ? {
        speakingEvaluation: {
          overallBand: 7,
          summary: 'Speaking feedback',
          model: 'fixture',
          evaluatedAt: base.submittedAt,
          pronunciationAvailable: true,
          criteria: {
            fluency: criterion,
            lexicalResource: criterion,
            grammar: criterion,
            pronunciation: criterion,
          },
          parts: [
            {
              partId: 'part',
              feedback: 'Speech feedback',
              strengths: [],
              improvements: ['Speaking suggestion'],
            },
          ],
        },
      }
    : {}),
})
const material = (skill: string) =>
  skill === 'reading'
    ? {
        id: 'material',
        slug: 'material',
        kind: 'PASSAGE',
        examType: 'academic',
        difficulty: 'intermediate',
        title: 'Reading test',
        description: '',
        body: 'This is the saved passage.',
        durationMinutes: 60,
        questionGroups: [
          {
            id: 'group',
            position: 1,
            type: 'short_answer',
            instructions: 'ONE WORD',
            questions: [
              {
                id: 'reading-wrong',
                position: 1,
                prompt: 'reading: wrong question',
                content: {},
                points: 1,
              },
            ],
          },
        ],
      }
    : {
        id: 'material',
        slug: 'material',
        examType: 'academic',
        title: 'Listening test',
        description: '',
        durationMinutes: 40,
        parts: [
          {
            id: 'part',
            position: 1,
            title: 'Photo restoration',
            audioAssetId: null,
            groups: [
              {
                id: 'group',
                position: 1,
                type: 'short_answer',
                instructions: 'ONE WORD',
                context: '',
                config: {},
                imageAssetId: null,
                questions: [
                  {
                    id: 'listening-wrong',
                    position: 1,
                    number: 1,
                    prompt: 'listening: wrong question',
                    content: {},
                    points: 1,
                  },
                ],
              },
            ],
          },
        ],
      }
const session = {
  id: 'mock-session',
  mockTestId: 'mock',
  status: 'SUBMITTED',
  currentSection: 4,
  startedAt: base.startedAt,
  submittedAt: base.submittedAt,
  deadlineAt: base.submittedAt,
  overallBand: 6.5,
  mockTest: { id: 'mock', examType: 'academic', title: 'Full Mock test' },
  sections: ['listening', 'reading', 'writing', 'speaking'].map(
    (skill, index) => ({ position: index + 1, skill, attempt: detail(skill) }),
  ),
}

async function fixtures(
  page: Page,
  options: {
    empty?: boolean
    processing?: boolean
    failure?: boolean
    fresh?: boolean
    multiple?: boolean
    completion?: 'descriptive' | 'gap'
    sequence?: boolean
    longSolution?: boolean
    audioTiming?: boolean
  } = {},
) {
  let submitted = !options.fresh
  const writes: string[] = []
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/listening/media/review-audio')) {
      const sampleBytes = 16000 * (options.audioTiming ? 145 : 1)
      const audio = Buffer.alloc(sampleBytes + 44)
      audio.write('RIFF', 0)
      audio.writeUInt32LE(sampleBytes + 36, 4)
      audio.write('WAVEfmt ', 8)
      audio.writeUInt32LE(16, 16)
      audio.writeUInt16LE(1, 20)
      audio.writeUInt16LE(1, 22)
      audio.writeUInt32LE(8000, 24)
      audio.writeUInt32LE(16000, 28)
      audio.writeUInt16LE(2, 32)
      audio.writeUInt16LE(16, 34)
      audio.write('data', 36)
      audio.writeUInt32LE(sampleBytes, 40)
      return route.fulfill({ contentType: 'audio/wav', body: audio })
    }
    if (route.request().method() !== 'GET') writes.push(path)
    if (path.endsWith('/auth/refresh'))
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
    if (path.endsWith('/full-mock-sessions/mock-session'))
      return route.fulfill({ json: session })
    if (path.endsWith('/listening/tests/material/attempts'))
      return route.fulfill({
        json: {
          attempt: submitted
            ? detail('listening')
            : {
                ...detail('listening'),
                status: 'IN_PROGRESS',
                submittedAt: null,
                review: [],
              },
          test: material('listening'),
        },
      })
    if (path.endsWith('/attempts/listening-attempt/submit')) {
      submitted = true
      return route.fulfill({ json: detail('listening') })
    }
    const match = path.match(
      /\/attempts\/(reading|listening|writing|speaking)-attempt(\/material|\/status|\/answers)?$/,
    )
    if (match) {
      const skill = match[1]
      if (match[2] === '/material') {
        const pinnedMaterial = material(skill)
        if (options.completion && pinnedMaterial.parts) {
          pinnedMaterial.parts[0].groups[0].context =
            'Where to go: Kite Place near the {{1}}\nFish market: cross the {{2}} and go right.\nBest to visit before {{3}} pm.'
        }
        return route.fulfill({ json: pinnedMaterial })
      }
      if (match[2] === '/answers')
        return route.fulfill({ json: { saved: true } })
      if (options.failure)
        return route.fulfill({
          status: 500,
          json: { message: 'fixture error' },
        })
      const data = detail(skill)
      if (
        (options.longSolution || options.audioTiming) &&
        skill === 'listening'
      ) {
        data.review[0] = {
          ...mistake(skill),
          audioAssetId: 'review-audio',
          timestampStart: options.audioTiming ? 137.3 : 0,
          timestampEnd: options.audioTiming ? 141.5 : 1,
          transcript: 'The fish market is over the bridge, on the right.',
          quote: 'over the bridge, on the right',
          hint: 'Listen for what you need to cross before turning right.',
          explanation:
            'The speaker describes how to reach the fish market. '.repeat(100) +
            'End of explanation.',
        }
      }
      if (options.sequence) {
        data.review.push(
          {
            ...mistake(skill),
            questionId: `${skill}-third`,
            number: 3,
            prompt: `${skill}: third question`,
          },
          {
            ...mistake(skill),
            questionId: `${skill}-locked`,
            number: 4,
            prompt: `${skill}: locked question`,
            locked: true,
            correctAnswer: null,
          },
          {
            ...mistake(skill),
            questionId: `${skill}-last`,
            number: 5,
            prompt: `${skill}: last question`,
          },
        )
      }
      if (options.completion && skill === 'listening') {
        data.review = [
          {
            ...mistake(skill),
            type: 'note_completion',
            prompt:
              options.completion === 'gap'
                ? '{{answer}}'
                : 'Where to go: Kite Place near the {{answer}}',
          },
        ]
      }
      if (options.empty) data.review = []
      if (options.multiple && skill === 'reading')
        data.review = [
          {
            ...mistake(skill),
            type: 'multiple_choice',
            content: {
              options: [
                { id: 'A', text: 'Alpha' },
                { id: 'B', text: 'Beta' },
                { id: 'C', text: 'Gamma' },
              ],
            },
            correctAnswer: { optionIds: ['A', 'C'] },
          },
        ]
      if (options.processing && skill === 'writing')
        return route.fulfill({
          json: {
            ...data,
            status: 'PROCESSING',
            writingEvaluation: undefined,
            writingAssessment: { status: 'PROCESSING', attempts: 1 },
          },
        })
      if (!submitted)
        return route.fulfill({
          json: { ...data, status: 'IN_PROGRESS', answers: [], review: [] },
        })
      return route.fulfill({ json: data })
    }
    return route.fulfill({ json: { items: [], banks: [] } })
  })
  return writes
}

for (const skill of ['reading', 'listening']) {
  test(`${skill}: opens only this attempt's errors without skill tabs or answers`, async ({
    page,
  }) => {
    const writes = await fixtures(page)
    await page.goto(`./attempts/${skill}-attempt`)
    await expect(
      page.getByRole('heading', { name: 'Работа над ошибками', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText(`${skill}: wrong question`, { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText(`${skill}: right question`, { exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('navigation', { name: 'Секции Full Mock' }),
    ).toHaveCount(0)
    await expect(
      page.getByText(`${skill}-correct`, { exact: true }),
    ).toHaveCount(0)
    await expect(page.getByText('Банк ошибок', { exact: true })).toHaveCount(0)
    await page
      .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog
      .getByRole('textbox', { name: 'Ответ', exact: true })
      .fill(`${skill}-correct`)
    await dialog.getByRole('button', { name: 'Проверить', exact: true }).click()
    await expect(dialog.getByText('Верно', { exact: true })).toBeVisible()
    await expect(
      dialog.getByText(`${skill}: explanation`, { exact: true }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    const card = page.getByRole('button', {
      name: 'Разобрать ошибку 1',
      exact: true,
    })
    await expect(card.getByText('Разобрано', { exact: true })).toBeVisible()
    await expect(card.getByText('Ошибка', { exact: true })).toHaveCount(0)
    await page.reload()
    await expect(card.getByText('Разобрано', { exact: true })).toBeVisible()
    await expect(page.getByText('Band 6.0', { exact: false })).toBeVisible()
    await page.goto(
      `./attempts/${skill === 'reading' ? 'listening' : 'reading'}-attempt?session=mock-session`,
    )
    await expect(
      page
        .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
        .getByText('Ошибка', { exact: true }),
    ).toBeVisible()
    expect(
      writes.filter(
        (path) =>
          path.includes('/attempts/') || path.includes('/full-mock-sessions/'),
      ),
    ).toEqual([])
  })
}

for (const skill of ['reading', 'listening']) {
  test(`${skill}: next mistake stays in the attempt and resets the retry form`, async ({
    page,
  }) => {
    if (skill === 'listening')
      await page.setViewportSize({ width: 375, height: 812 })
    const writes = await fixtures(page, { sequence: true })
    await page.goto(`./attempts/${skill}-attempt?session=mock-session`)
    await page
      .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog
      .getByRole('textbox', { name: 'Ответ', exact: true })
      .fill(`${skill}-correct`)
    await dialog.getByRole('button', { name: 'Проверить', exact: true }).click()
    await expect(dialog.getByText('Верно', { exact: true })).toBeVisible()
    await dialog
      .getByRole('button', { name: 'Следующая ошибка', exact: true })
      .click()
    await expect(
      dialog.getByText(`${skill}: third question`, { exact: true }),
    ).toBeVisible()
    await expect(
      dialog.getByRole('textbox', { name: 'Ответ', exact: true }),
    ).toHaveValue('')
    await expect(dialog.getByText('Верно', { exact: true })).toHaveCount(0)
    await expect(
      dialog.getByText(`${skill}: explanation`, { exact: true }),
    ).toHaveCount(0)
    await dialog
      .getByRole('button', { name: 'Следующая ошибка', exact: true })
      .click()
    await expect(
      dialog.getByText(`${skill}: last question`, { exact: true }),
    ).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: 'Следующая ошибка', exact: true }),
    ).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(
      page
        .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
        .getByText('Разобрано', { exact: true }),
    ).toBeVisible()
    expect(
      writes.filter(
        (path) =>
          path.includes('/attempts/') || path.includes('/full-mock-sessions/'),
      ),
    ).toEqual([])
  })
}

test('listening replay includes context before approximate answer timestamps and displays the played range', async ({
  page,
}) => {
  await fixtures(page, { audioTiming: true })
  await page.goto('./attempts/listening-attempt')
  await page
    .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog
    .getByRole('button', { name: 'Показать решение', exact: true })
    .click()
  await expect(dialog.getByText('02:13 – 02:23', { exact: true })).toBeVisible()
  const audio = dialog.locator('audio')
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.duration))
    .toBe(145)
  await dialog
    .getByRole('button', { name: 'Слушать ответ', exact: true })
    .click()
  const start = await audio.evaluate(
    (element: HTMLAudioElement) => element.currentTime,
  )
  expect(start).toBeGreaterThanOrEqual(133)
  expect(start).toBeLessThan(134)
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
    .toBe(false)
  await audio.evaluate((element: HTMLAudioElement) => {
    element.currentTime = 143
    element.dispatchEvent(new Event('timeupdate'))
  })
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
    .toBe(true)
})

for (const width of [1024, 375]) {
  test(`listening ${width}px: hint has one compact replay action and no repeated timestamps on the right`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 700 })
    await fixtures(page, { audioTiming: true })
    await page.goto('./attempts/listening-attempt')
    await page
      .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Подсказка', exact: true }).click()
    const review = dialog.getByRole('region', { name: 'Разбор ошибки' })
    const listen = review.getByRole('button', {
      name: 'Слушать фрагмент',
      exact: true,
    })
    await expect(listen).toHaveCount(1)
    await expect(listen).toBeVisible()
    const box = await listen.boundingBox()
    expect(box!.height).toBeLessThanOrEqual(36)
    expect(box!.width).toBeLessThan(200)
    await expect(
      review.getByText(
        'Listen for what you need to cross before turning right.',
        { exact: true },
      ),
    ).toBeVisible()
    await expect(review).not.toContainText(/\d{2}:\d{2}/)
    await expect(review).not.toContainText('Аудиофрагмент с контекстом')
    await listen.click()
    await expect(dialog.locator('audio')).toBeVisible()
    await expect
      .poll(() =>
        dialog
          .locator('audio')
          .evaluate((element: HTMLAudioElement) => element.paused),
      )
      .toBe(false)
    await review
      .getByRole('button', { name: 'Показать решение', exact: true })
      .first()
      .click()
    await expect(
      review.getByRole('button', { name: 'Слушать ответ', exact: true }),
    ).toBeVisible()
    await expect(review).not.toContainText(/\d{2}:\d{2}/)
  })
}

test('mobile listening keeps one audio player below both tabs without interrupting playback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 700 })
  await fixtures(page, { audioTiming: true })
  await page.goto('./attempts/listening-attempt')
  await page
    .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
    .click()
  const dialog = page.getByRole('dialog')
  const audio = dialog.locator('audio')
  const transcriptTab = dialog.getByRole('button', {
    name: 'Аудио и стенограмма',
    exact: true,
  })
  const questionTab = dialog.getByRole('button', {
    name: 'Вопрос и решение',
    exact: true,
  })
  await expect(audio).toHaveCount(1)
  await expect(audio).toBeVisible()
  const tabsBox = await transcriptTab.boundingBox()
  const audioBox = await audio.boundingBox()
  const questionBox = await dialog
    .getByRole('region', { name: 'Разбор ошибки' })
    .boundingBox()
  expect(audioBox!.y).toBeGreaterThanOrEqual(tabsBox!.y + tabsBox!.height)
  expect(audioBox!.y + audioBox!.height).toBeLessThanOrEqual(questionBox!.y)
  await dialog
    .getByRole('button', { name: 'Показать решение', exact: true })
    .click()
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.duration))
    .toBe(145)
  await dialog
    .getByRole('button', { name: 'Слушать ответ', exact: true })
    .click()
  await transcriptTab.click()
  await expect(audio).toBeVisible()
  await expect(audio).toHaveCount(1)
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
    .toBe(false)
  await questionTab.click()
  await expect(audio).toBeVisible()
  await expect(audio).toHaveCount(1)
  const position = await audio.evaluate(
    (element: HTMLAudioElement) => element.currentTime,
  )
  expect(position).toBeGreaterThanOrEqual(133)
  expect(position).toBeLessThan(137)
})

for (const width of [1024, 375]) {
  test(`listening ${width}px: compact audio action and next button do not cover the explanation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 700 })
    await fixtures(page, { sequence: true, longSolution: true })
    await page.goto('./attempts/listening-attempt')
    await page
      .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog
      .getByRole('button', { name: 'Показать решение', exact: true })
      .click()
    const listen = dialog.getByRole('button', {
      name: 'Слушать ответ',
      exact: true,
    })
    await expect(listen).toHaveCount(1)
    await expect(listen).toBeVisible()
    const listenBox = await listen.boundingBox()
    expect(listenBox?.height).toBeLessThanOrEqual(36)
    expect(listenBox?.width).toBeLessThan(200)
    const next = dialog.getByRole('button', {
      name: 'Следующая ошибка',
      exact: true,
    })
    await expect(next).toBeVisible()
    const beforeScroll = await next.boundingBox()
    const scroll = dialog.getByRole('region', { name: 'Разбор ошибки' })
    await scroll.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    const nextBox = await next.boundingBox()
    const scrollBox = await scroll.boundingBox()
    const explanationBox = await dialog
      .getByText(/End of explanation\.$/)
      .boundingBox()
    expect(nextBox).not.toBeNull()
    expect(scrollBox).not.toBeNull()
    expect(explanationBox).not.toBeNull()
    expect(nextBox!.y).toBeCloseTo(beforeScroll!.y, 0)
    expect(scrollBox!.y + scrollBox!.height).toBeLessThanOrEqual(nextBox!.y)
    expect(explanationBox!.y + explanationBox!.height).toBeLessThanOrEqual(
      scrollBox!.y + scrollBox!.height,
    )
    await next.click()
    await expect(
      dialog.getByText('listening: third question', { exact: true }),
    ).toBeVisible()
  })
}

for (const completion of ['descriptive', 'gap'] as const) {
  test(`listening ${completion}: review displays only the selected completion question`, async ({
    page,
  }) => {
    await fixtures(page, { completion })
    await page.goto('./attempts/listening-attempt')
    await page
      .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByText('Where to go: Kite Place near the _____', {
        exact: true,
      }),
    ).toHaveCount(1)
    await expect(dialog.getByText(/Fish market: cross/)).toHaveCount(0)
    await expect(dialog.getByText(/Best to visit before/)).toHaveCount(0)
  })
}

test('submission immediately shows this test’s mistake cards', async ({
  page,
}) => {
  await fixtures(page, { fresh: true })
  await page.goto('./exam/listening/material')
  await page
    .getByRole('button', { name: 'Завершить тест', exact: true })
    .click()
  await page.getByRole('button', { name: 'Завершить', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Работа над ошибками', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Разобрать ошибку 1', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Секции Full Mock' }),
  ).toHaveCount(0)
})

test('Full Mock cards select the section; tabs stay in this exam after reload', async ({
  page,
}) => {
  await fixtures(page)
  await page.goto('./exam/full-mock-sessions/mock-session')
  await page
    .getByRole('link', { name: 'Reading: работа над ошибками', exact: true })
    .click()
  const tabs = page.getByRole('navigation', { name: 'Секции Full Mock' })
  await expect(
    tabs.getByRole('link', { name: 'Reading', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(
    page.getByText('reading: wrong question', { exact: true }),
  ).toBeVisible()
  await tabs.getByRole('link', { name: 'Listening', exact: true }).click()
  await expect(
    page.getByText('listening: wrong question', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('reading: wrong question', { exact: true }),
  ).toHaveCount(0)
  await page.reload()
  await expect(
    tabs.getByRole('link', { name: 'Listening', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await tabs.getByRole('link', { name: 'Writing', exact: true }).click()
  await expect(
    page.getByText('Writing suggestion', { exact: false }),
  ).toBeVisible()
  await tabs.getByRole('link', { name: 'Speaking', exact: true }).click()
  await expect(
    page.getByText('Speaking suggestion', { exact: false }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'К результату', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Full Mock test', exact: true }),
  ).toBeVisible()
})

test('a partial multiple-select answer stays incorrect', async ({ page }) => {
  await fixtures(page, { multiple: true })
  await page.goto('./attempts/reading-attempt')
  await page
    .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'A Alpha', exact: true }).click()
  await dialog.getByRole('button', { name: 'Проверить', exact: true }).click()
  await expect(dialog.getByText('Неверно', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  const card = page.getByRole('button', {
    name: 'Разобрать ошибку 1',
    exact: true,
  })
  await expect(card.getByText('Ошибка', { exact: true })).toBeVisible()
  await card.click()
  await dialog.getByRole('button', { name: 'A Alpha', exact: true }).click()
  await dialog.getByRole('button', { name: 'C Gamma', exact: true }).click()
  await dialog.getByRole('button', { name: 'Проверить', exact: true }).click()
  await expect(dialog.getByText('Верно', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(card.getByText('Разобрано', { exact: true })).toBeVisible()
})

test('revealing a solution does not mark the mistake as reviewed', async ({
  page,
}) => {
  await fixtures(page)
  await page.goto('./attempts/reading-attempt')
  const card = page.getByRole('button', {
    name: 'Разобрать ошибку 1',
    exact: true,
  })
  await card.click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Показать решение', exact: true })
    .click()
  await page.keyboard.press('Escape')
  await expect(card.getByText('Ошибка', { exact: true })).toBeVisible()
})

test('empty attempts and pending AI have correct states', async ({ page }) => {
  await fixtures(page, { empty: true, processing: true })
  await page.goto('./attempts/reading-attempt')
  await expect(page.getByText('Нет ошибок', { exact: true })).toBeVisible()
  await page.goto('./attempts/writing-attempt?session=mock-session')
  await expect(page.getByText('Проверяется', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Секции Full Mock' }),
  ).toBeVisible()
})

test('mobile cards, Full Mock tabs and retry dialog fit the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await fixtures(page)
  await page.goto('./attempts/reading-attempt?session=mock-session')
  await page
    .getByRole('button', { name: 'Разобрать ошибку 1', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Показать решение', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  const width = await page.evaluate(() => ({
    viewport: innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(width.content).toBeLessThanOrEqual(width.viewport)
})
