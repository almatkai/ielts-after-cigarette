import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const group = (id: string, number: number, choice = false, quote = '') => ({
  id: `group-${id}`,
  position: 1,
  type: choice ? 'multiple_choice' : 'short_answer',
  instructions: 'Answer the questions.',
  questions: [
    {
      id,
      position: number,
      number,
      prompt: `Question ${number}`,
      points: 1,
      content: {
        number,
        quote,
        ...(choice
          ? {
              options: [
                { id: 'a', text: 'First option' },
                { id: 'b', text: 'Second option' },
              ],
            }
          : {}),
      },
      answer: choice ? { optionId: 'a' } : { value: 'secret' },
      explanation: 'secret explanation',
    },
  ],
})
const passage = (
  id: string,
  title: string,
  body: string,
  questionGroups: ReturnType<typeof group>[],
) => ({
  id,
  title,
  body,
  questionGroups,
  kind: 'PASSAGE',
  slug: id,
  examType: 'academic',
  difficulty: 'intermediate',
  durationMinutes: 60,
})
const reading = {
  ...passage(
    'reading-id',
    'Draft reading test',
    'Complete reading text that is sufficiently long to be saved as a valid material.',
    [],
  ),
  kind: 'TEST',
  status: 'PUBLISHED',
  revision: 4,
  currentVersionNumber: 2,
  hasUnpublishedChanges: true,
  sourceTitle: null,
  sourceUrl: null,
  description: '',
  passages: [
    passage('p1', 'First passage', 'It’s the current saved passage.', [
      group('r1', 1, true, 'It’s the current saved passage.'),
    ]),
    passage('p2', 'Empty passage', 'This passage has no questions yet.', []),
    passage('p3', 'Third passage', 'Final passage text.', [group('r2', 2)]),
  ],
}
const listening = {
  id: 'listening-id',
  slug: 'listening-test',
  title: 'Draft listening test',
  description: '',
  examType: 'academic',
  durationMinutes: 40,
  status: 'DRAFT',
  revision: 4,
  currentVersionNumber: 2,
  hasUnpublishedChanges: true,
  parts: [
    {
      position: 1,
      title: 'First part',
      audioAssetId: 'audio-id',
      transcript: 'Introduction. The answer is secret. End of recording.',
      groups: [
        {
          ...group('l1', 1, false, 'The answer is secret.'),
          context: '',
          config: {},
          imageAssetId: 'image-id',
        },
      ],
    },
    {
      position: 2,
      title: 'Second part',
      audioAssetId: null,
      groups: [
        { ...group('l2', 2), context: '', config: {}, imageAssetId: null },
      ],
    },
    { position: 3, title: 'Empty part', audioAssetId: null, groups: [] },
  ],
}

// All API requests are intercepted. Tests never use a real account or database.
async function mockApi(page: Page, role = 'ADMIN', saveError = false) {
  const requests: { method: string; path: string }[] = []
  let readingData = structuredClone(reading)
  let listeningData = structuredClone(listening)
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    requests.push({ method: request.method(), path: url.pathname })
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, json: body })
    if (url.pathname.endsWith('/auth/refresh'))
      return json({
        accessToken: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 'admin-id',
          role,
          email: 'preview@example.test',
          displayName: 'Preview admin',
          timezone: 'UTC',
        },
      })
    if (url.pathname.includes('/listening/media/')) {
      if (url.pathname.endsWith('image-id'))
        return route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="50">Test map</text></svg>',
        })
      const wav = Buffer.alloc(46)
      wav.write('RIFF', 0)
      wav.writeUInt32LE(38, 4)
      wav.write('WAVEfmt ', 8)
      wav.writeUInt32LE(16, 16)
      wav.writeUInt16LE(1, 20)
      wav.writeUInt16LE(1, 22)
      wav.writeUInt32LE(8000, 24)
      wav.writeUInt32LE(16000, 28)
      wav.writeUInt16LE(2, 32)
      wav.writeUInt16LE(16, 34)
      wav.write('data', 36)
      wav.writeUInt32LE(2, 40)
      return route.fulfill({ contentType: 'audio/wav', body: wav })
    }
    const isReading = url.pathname.includes('/reading/')
    if (url.pathname.endsWith('/preview')) {
      const data = structuredClone(isReading ? readingData : listeningData)
      if (url.searchParams.get('version') === 'published') {
        data.title = 'Published reading test'
        if ('passages' in data) {
          data.passages[0].body = 'Previous published passage.'
          data.passages[0].questionGroups[0].questions[0].content.quote =
            'Previous published passage.'
          data.passages[0].questionGroups[0].questions[0].answer = {
            optionId: 'b',
          }
          data.passages[0].questionGroups[0].questions[0].explanation =
            'Published explanation'
        }
      }
      const questions =
        'passages' in data
          ? data.passages.flatMap((p) =>
              p.questionGroups.flatMap((g) => g.questions),
            )
          : data.parts.flatMap((p) => p.groups.flatMap((g) => g.questions))
      const answerKeys = Object.fromEntries(
        questions.map((q) => [
          q.id,
          {
            answer: q.answer,
            explanation: q.explanation,
            quote: q.content.quote,
            hint: '',
          },
        ]),
      )
      const publicData = JSON.parse(
        JSON.stringify(data, (key, value) =>
          ['answer', 'explanation', 'quote', 'hint'].includes(key)
            ? undefined
            : value,
        ),
      )
      return json({
        material: publicData,
        answerKeys,
        revision: data.revision,
        versionNumber: url.searchParams.get('version') === 'published' ? 1 : 2,
        status: data.status,
        hasUnpublishedChanges: true,
      })
    }
    if (request.method() === 'PUT') {
      if (saveError)
        return json({ message: 'Save rejected', code: 'VALIDATION_ERROR' }, 422)
      const input = request.postDataJSON()
      if (isReading)
        readingData = {
          ...readingData,
          ...input,
          revision: readingData.revision + 1,
        }
      else
        listeningData = {
          ...listeningData,
          ...input,
          revision: listeningData.revision + 1,
        }
      return json(isReading ? readingData : listeningData)
    }
    if (url.pathname.endsWith('/materials/reading-id')) return json(readingData)
    if (url.pathname.endsWith('/tests/listening-id')) return json(listeningData)
    if (url.pathname.endsWith('/reading/materials'))
      return json({ items: [readingData] })
    if (url.pathname.endsWith('/listening/tests'))
      return json({ items: [listeningData] })
    return json({ items: [] })
  })
  return requests
}

function expectNoAttempts(requests: { method: string; path: string }[]) {
  expect(requests.filter((r) => r.path.includes('/attempts'))).toEqual([])
}

test('Reading preview reuses the exam, answers locally, shows every passage and published snapshot', async ({
  page,
}, testInfo) => {
  const requests = await mockApi(page)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('admin/preview/reading/reading-id')
  await expect(page.getByText('It’s the current saved passage.')).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('reading-preview.png'),
    fullPage: true,
  })
  await expect(
    page.getByRole('button', { name: 'Завершить тест' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Включить таймер' }),
  ).toBeVisible()
  const option = page.locator('label').filter({ hasText: 'First option' })
  await option.click()
  await expect(option).toHaveClass(/border-blue-600/)
  await page.getByRole('button', { name: 'Сбросить ответы' }).click()
  await expect(
    page.locator('label').filter({ hasText: 'First option' }),
  ).not.toHaveClass(/border-blue-600/)
  await page
    .getByRole('button', { name: /Раздел 2/ })
    .first()
    .click()
  await expect(
    page.getByText('This passage has no questions yet.'),
  ).toBeVisible()
  await expect(
    page.getByText('В этом разделе ещё нет вопросов. Добавьте их в редакторе.'),
  ).toBeVisible()
  await page
    .getByRole('button', { name: /Раздел 3/ })
    .first()
    .click()
  await page.getByPlaceholder('Введите ваш ответ здесь…').fill('local answer')
  await expect(page.getByPlaceholder('Введите ваш ответ здесь…')).toHaveValue(
    'local answer',
  )
  await page.getByRole('button', { name: 'Включить таймер' }).click()
  await expect(
    page.getByRole('button', { name: 'Выключить таймер' }),
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() =>
        Object.keys(localStorage).filter((k) => k.includes('deadline')),
      ),
    )
    .toEqual([])
  await page.getByRole('button', { name: 'Опубликованная версия' }).click()
  await expect(page.getByText('Previous published passage.')).toBeVisible()
  expectNoAttempts(requests)
  expect(errors).toEqual([])
})

test('Listening preview loads draft media, takes local answers and opens empty parts', async ({
  page,
}) => {
  const requests = await mockApi(page)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('admin/preview/listening/listening-id')
  await expect(page.locator('audio')).toBeVisible()
  await expect(page.getByAltText('Схема задания Listening')).toBeVisible()
  await page.getByPlaceholder('Ваш ответ').fill('local listening answer')
  await expect(page.getByPlaceholder('Ваш ответ')).toHaveValue(
    'local listening answer',
  )
  await page.getByRole('button', { name: 'Part 2', exact: true }).click()
  await expect(
    page.getByText('Аудио ещё не прикреплено.').first(),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Part 3', exact: true }).click()
  await expect(
    page.getByText('В этой части ещё нет вопросов. Добавьте их в редакторе.'),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Завершить тест' }),
  ).toHaveCount(0)
  expectNoAttempts(requests)
  expect(errors).toEqual([])
})

for (const role of ['STUDENT', 'EDITOR']) {
  test(`${role} cannot open preview directly`, async ({ page }) => {
    const requests = await mockApi(page, role)
    await page.goto('admin/preview/reading/reading-id')
    await expect(page).toHaveURL(/\/forbidden$/)
    expect(requests.filter((r) => r.path.endsWith('/preview'))).toEqual([])
  })
}

for (const skill of ['reading', 'listening']) {
  test(`${skill} editor saves changes before opening preview`, async ({
    page,
  }) => {
    const requests = await mockApi(page)
    const path =
      skill === 'reading'
        ? 'admin/reading/materials/reading-id'
        : 'admin/listening/tests/listening-id'
    await page.goto(path)
    const title =
      skill === 'reading'
        ? page.getByLabel('Название', { exact: true })
        : page
            .getByText('Название', { exact: true })
            .locator('..')
            .getByRole('textbox')
    await title.fill('Changed title for preview')
    await page.getByRole('button', { name: 'Сохранить и открыть тест' }).click()
    await expect(page).toHaveURL(new RegExp(`/admin/preview/${skill}/`))
    await expect(
      page.getByRole('heading', {
        name: `Предпросмотр ${skill === 'reading' ? 'Reading' : 'Listening'} · Только для администратора`,
      }),
    ).toBeVisible()
    await expect(
      page.getByText(/Текущая сохранённая версия.*revision 5/),
    ).toBeVisible()
    const saved = requests.findIndex((r) => r.method === 'PUT')
    const preview = requests.findIndex((r) => r.path.endsWith('/preview'))
    expect(saved).toBeGreaterThan(-1)
    expect(preview).toBeGreaterThan(saved)
    expectNoAttempts(requests)
  })
}

test('failed save does not open a stale Reading preview', async ({ page }) => {
  const requests = await mockApi(page, 'ADMIN', true)
  await page.goto('admin/reading/materials/reading-id')
  await page.getByLabel('Название', { exact: true }).fill('Unsaved title')
  await page.getByRole('button', { name: 'Сохранить и открыть тест' }).click()
  await expect(
    page.getByText('Проверьте правильность заполнения полей.'),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/app\/admin\/reading\/materials\/reading-id$/)
  expect(requests.filter((r) => r.path.endsWith('/preview'))).toEqual([])
})

for (const skill of ['reading', 'listening']) {
  test(`${skill} library offers preview only to administrators`, async ({
    page,
  }) => {
    await mockApi(page)
    await page.goto(
      skill === 'reading' ? 'admin/reading/materials' : 'admin/listening/tests',
    )
    const preview = page.getByRole('link', { name: 'Предпросмотр теста' })
    await expect(preview).toBeVisible()
    await preview.click()
    await expect(
      page.getByRole('heading', { name: /Только для администратора/ }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('heading', { name: /Только для администратора/ }),
    ).toBeVisible()
  })

  test(`empty ${skill} draft does not crash`, async ({ page }) => {
    const requests = await mockApi(page)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/preview?version=draft', (route) =>
      route.fulfill({
        json: {
          answerKeys: {},
          material:
            skill === 'reading'
              ? { ...reading, body: '', passages: [] }
              : { ...listening, parts: [] },
          revision: 4,
          versionNumber: 2,
          status: 'DRAFT',
          hasUnpublishedChanges: true,
        },
      }),
    )
    await page.goto(`admin/preview/${skill}/${skill}-id`)
    await expect(
      page.getByText(
        skill === 'reading'
          ? 'Текст раздела ещё не добавлен. Вернитесь в редактор.'
          : 'В тесте ещё нет частей. Добавьте их в редакторе.',
      ),
    ).toBeVisible()
    expectNoAttempts(requests)
    expect(errors).toEqual([])
  })
}

test('EDITOR library does not offer the admin-only preview action', async ({
  page,
}) => {
  await mockApi(page, 'EDITOR')
  await page.goto('admin/reading/materials')
  await expect(
    page.getByRole('heading', { name: 'Draft reading test' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Предпросмотр теста' }),
  ).toHaveCount(0)
})

test('clean Reading draft opens without creating another saved revision', async ({
  page,
}) => {
  const requests = await mockApi(page)
  await page.goto('admin/reading/materials/reading-id')
  await page.getByRole('button', { name: 'Предпросмотр теста' }).click()
  await expect(page.getByText('It’s the current saved passage.')).toBeVisible()
  expect(requests.filter((r) => r.method === 'PUT')).toEqual([])
})

test('Reading preview remains usable on a phone', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockApi(page)
  await page.goto('admin/preview/reading/reading-id')
  await expect(page.getByText('It’s the current saved passage.')).toBeVisible()
  await page
    .getByRole('button', { name: /Раздел 3/ })
    .first()
    .click()
  await page.getByPlaceholder('Введите ваш ответ здесь…').fill('mobile answer')
  await expect(page.getByPlaceholder('Введите ваш ответ здесь…')).toHaveValue(
    'mobile answer',
  )
  await page
    .getByRole('button', { name: 'Показать ответ с объяснением' })
    .click()
  await expect(
    page.getByRole('region', { name: 'Ответ и объяснение' }),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('reading-preview-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  })
})

test('Reading reveals the answer and evidence, hides it, resets it and uses the published key', async ({
  page,
}, testInfo) => {
  const requests = await mockApi(page)
  await page.goto('admin/preview/reading/reading-id')
  const show = page.getByRole('button', {
    name: 'Показать ответ с объяснением',
  })
  await expect(show).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Ответ и объяснение' }),
  ).toHaveCount(0)
  await show.click()
  const panel = page.getByRole('region', { name: 'Ответ и объяснение' })
  await expect(
    panel.getByText('a — First option', { exact: true }),
  ).toBeVisible()
  await expect(
    panel.getByText('secret explanation', { exact: true }),
  ).toBeVisible()
  await expect(page.getByTestId('answer-evidence')).toHaveText(
    'It’s the current saved passage.',
  )
  await expect(
    page.locator('label').filter({ hasText: 'First option' }),
  ).not.toHaveClass(/border-blue-600/)
  await page.screenshot({
    path: testInfo.outputPath('reading-answer-revealed.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Скрыть ответ и объяснение' }).click()
  await expect(panel).toHaveCount(0)
  await expect(page.getByTestId('answer-evidence')).toHaveCount(0)
  await show.click()
  await page.getByRole('button', { name: 'Сбросить ответы' }).click()
  await expect(panel).toHaveCount(0)
  await page.getByRole('button', { name: 'Опубликованная версия' }).click()
  await show.click()
  await expect(
    panel.getByText('b — Second option', { exact: true }),
  ).toBeVisible()
  await expect(
    panel.getByText('Published explanation', { exact: true }),
  ).toBeVisible()
  await expect(page.getByTestId('answer-evidence')).toHaveText(
    'Previous published passage.',
  )
  expect(
    requests.filter(
      (request) =>
        request.method !== 'GET' && !request.path.endsWith('/auth/refresh'),
    ),
  ).toEqual([])
  expectNoAttempts(requests)
})

test('Listening reveals the stored answer and explanation and highlights transcript evidence', async ({
  page,
}) => {
  const requests = await mockApi(page)
  await page.goto('admin/preview/listening/listening-id')
  await page
    .getByRole('button', { name: 'Показать ответ с объяснением' })
    .click()
  const panel = page.getByRole('region', { name: 'Ответ и объяснение' })
  await expect(panel.getByText('secret', { exact: true })).toBeVisible()
  await expect(
    panel.getByText('secret explanation', { exact: true }),
  ).toBeVisible()
  await expect(page.getByTestId('answer-evidence')).toHaveText(
    'The answer is secret.',
  )
  await expect(page.getByPlaceholder('Ваш ответ')).toHaveValue('')
  await page.getByRole('button', { name: 'Скрыть ответ и объяснение' }).click()
  await expect(panel).toHaveCount(0)
  await expect(page.getByTestId('answer-evidence')).toHaveCount(0)
  expectNoAttempts(requests)
})

for (const fixture of [
  {
    name: 'missing author data',
    key: { answer: {}, quote: '', explanation: '', hint: '' },
  },
  {
    name: 'quote from a different version',
    key: {
      answer: { accepted: ['CV writer', 'writer'] },
      quote: 'Not in this passage.',
      explanation: '<script>unsafe()</script>',
      hint: '',
    },
  },
]) {
  test(`Reading flags ${fixture.name} rather than inventing evidence`, async ({
    page,
  }) => {
    await mockApi(page)
    await page.route('**/preview?version=draft', (route) =>
      route.fulfill({
        json: {
          material: reading,
          answerKeys: { r1: fixture.key },
          revision: 4,
          versionNumber: 2,
          status: 'DRAFT',
          hasUnpublishedChanges: true,
        },
      }),
    )
    await page.goto('admin/preview/reading/reading-id')
    await page
      .getByRole('button', { name: 'Показать ответ с объяснением' })
      .click()
    const panel = page.getByRole('region', { name: 'Ответ и объяснение' })
    if (!fixture.key.quote) {
      await expect(
        panel.getByText('Цитата не добавлена.', { exact: false }),
      ).toBeVisible()
      await expect(
        panel.getByText('Объяснение не добавлено.', { exact: false }),
      ).toBeVisible()
      await expect(
        panel.getByText('Ответ не добавлен.', { exact: false }),
      ).toBeVisible()
    } else {
      await expect(
        panel.getByText('CV writer / writer', { exact: true }),
      ).toBeVisible()
      await expect(
        panel.getByText('Цитата не найдена в этой версии текста.', {
          exact: false,
        }),
      ).toBeVisible()
      await expect(
        panel.getByText('<script>unsafe()</script>', { exact: true }),
      ).toBeVisible()
      await expect(panel.locator('script')).toHaveCount(0)
    }
    await expect(page.getByTestId('answer-evidence')).toHaveCount(0)
  })
}

test('every Reading question type offers an independent answer reveal, including multi-select', async ({
  page,
}) => {
  const requests = await mockApi(page)
  const types = [
    'multiple_choice',
    'true_false_not_given',
    'yes_no_not_given',
    'matching_information',
    'matching_headings',
    'matching_features',
    'matching_sentence_endings',
    'sentence_completion',
    'summary_completion',
    'note_completion',
    'table_completion',
    'flow_chart_completion',
    'diagram_label_completion',
    'short_answer',
  ]
  const groups = types.map((type, index) => ({
    ...group(
      `type-${index}`,
      index + 1,
      type.startsWith('matching') || type === 'multiple_choice',
      'It’s the current saved passage.',
    ),
    type,
    position: index + 1,
  }))
  const answerKeys = Object.fromEntries(
    groups.map((g, index) => [
      g.questions[0].id,
      {
        answer:
          index === 0
            ? { optionIds: ['a', 'b'] }
            : index === 1
              ? { value: 'TRUE' }
              : index === 2
                ? { value: 'NOT_GIVEN' }
                : { accepted: ['first', 'second'] },
        quote: 'It’s the current saved passage.',
        explanation: `Explanation for ${g.type}`,
        hint: '',
      },
    ]),
  )
  await page.route('**/preview?version=draft', (route) =>
    route.fulfill({
      json: {
        material: {
          ...reading,
          passages: [{ ...reading.passages[0], questionGroups: groups }],
        },
        answerKeys,
        versionNumber: 2,
        revision: 4,
        status: 'DRAFT',
        hasUnpublishedChanges: true,
      },
    }),
  )
  await page.goto('admin/preview/reading/reading-id')
  await expect(
    page.getByRole('button', { name: 'Показать ответ с объяснением' }),
  ).toHaveCount(types.length)
  for (const [index, type] of types.entries()) {
    await page
      .locator(`#reading-q-type-${index}`)
      .getByRole('button', { name: 'Показать ответ с объяснением' })
      .click()
    const panel = page.getByRole('region', { name: 'Ответ и объяснение' })
    await expect(panel).toHaveCount(1)
    await expect(
      panel.getByText(`Explanation for ${type}`, { exact: true }),
    ).toBeVisible()
    if (index === 0)
      await expect(
        panel.getByText('a — First option, b — Second option', { exact: true }),
      ).toBeVisible()
    if (index === 1)
      await expect(panel.getByText('TRUE', { exact: true })).toBeVisible()
    if (index === 2)
      await expect(panel.getByText('NOT GIVEN', { exact: true })).toBeVisible()
  }
  expectNoAttempts(requests)
})

test('every Listening question type offers the stored answer and explanation', async ({
  page,
}) => {
  const requests = await mockApi(page)
  const types = [
    'multiple_choice',
    'matching',
    'map_labelling',
    'plan_labelling',
    'diagram_labelling',
    'form_completion',
    'note_completion',
    'table_completion',
    'flow_chart_completion',
    'sentence_completion',
    'short_answer',
  ]
  const groups = types.map((type, index) => ({
    ...group(
      `type-${index}`,
      index + 1,
      type === 'multiple_choice' || type === 'matching',
    ),
    type,
    position: index + 1,
    config: {},
    context: '',
    imageAssetId: null,
  }))
  const answerKeys = Object.fromEntries(
    groups.map((g) => [
      g.questions[0].id,
      {
        answer: g.questions[0].answer,
        quote: '',
        hint: '',
        explanation: `Explanation for ${g.type}`,
      },
    ]),
  )
  await page.route('**/preview?version=draft', (route) =>
    route.fulfill({
      json: {
        material: {
          ...listening,
          parts: [
            { position: 1, title: 'All types', audioAssetId: null, groups },
          ],
        },
        answerKeys,
        versionNumber: 2,
        revision: 4,
        status: 'DRAFT',
        hasUnpublishedChanges: true,
      },
    }),
  )
  await page.goto('admin/preview/listening/listening-id')
  for (const [index, type] of types.entries()) {
    await page
      .getByRole('button', { name: 'Показать ответ с объяснением' })
      .click()
    await expect(
      page
        .getByRole('region', { name: 'Ответ и объяснение' })
        .getByText(`Explanation for ${type}`, { exact: true }),
    ).toBeVisible()
    if (index < types.length - 1)
      await page.getByRole('button', { name: 'Далее', exact: true }).click()
  }
  expectNoAttempts(requests)
})

for (const skill of ['reading', 'listening']) {
  test(`normal ${skill} exam still saves a real attempt and persists its timer`, async ({
    page,
  }) => {
    await mockApi(page, 'STUDENT')
    const writes: unknown[] = []
    const attempt = {
      id: 'normal-attempt',
      materialType: skill,
      materialId: `${skill}-id`,
      materialVersionId: 'published-version',
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      submittedAt: null,
      score: null,
      maxScore: null,
      band: null,
    }
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (!path.includes('/attempts')) return route.fallback()
      if (path.endsWith('/answers')) {
        writes.push(route.request().postDataJSON())
        return route.fulfill({ json: { saved: 1 } })
      }
      if (path.endsWith('/attempts'))
        return route.fulfill({
          json:
            skill === 'reading'
              ? {
                  attempt,
                  material: { ...reading, passages: [reading.passages[2]] },
                }
              : { attempt, test: listening },
        })
      return route.fulfill({ json: { ...attempt, answers: [] } })
    })
    await page.goto(`exam/${skill}/${skill}-id`)
    const input = page.getByPlaceholder(
      skill === 'reading' ? 'Введите ваш ответ здесь…' : 'Ваш ответ',
    )
    await input.fill('student answer')
    await expect.poll(() => writes.length).toBeGreaterThan(0)
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            Object.keys(localStorage).filter((k) =>
              k.includes('deadline_normal-attempt'),
            ).length,
        ),
      )
      .toBe(1)
    await expect(
      page.getByRole('heading', { name: /Только для администратора/ }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Показать ответ с объяснением' }),
    ).toHaveCount(0)
    await expect(
      page.getByText('secret explanation', { exact: true }),
    ).toHaveCount(0)
  })
}
