import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type {
  EditorialCandidate,
  EditorialDecision,
} from '../src/features/study-plan/editorial-api'

const candidate = (): EditorialCandidate => ({
  kind: 'drill',
  id: 'ferry-question',
  version: 'draft-1',
  section: 'reading',
  title: 'Ferry TFNG',
  contentHash: 'a'.repeat(64),
  metadata: null,
  answerKey: { value: 'FALSE' },
  explanation: 'The ferry carries forty passengers, not sixty.',
  drill: {
    id: 'ferry-question',
    version: 'draft-1',
    section: 'reading',
    skillId: 'ms-r-tfng',
    title: 'Ferry TFNG',
    durationMinutes: 10,
    modality: 'objective',
    familyId: 'ferry-family',
    introduction: 'Read the original case study.',
    stimulus: 'A ferry carries 40 passengers.',
    task: 'The ferry carries 60 passengers. TRUE, FALSE or NOT GIVEN?',
    rightsProvenance: 'Original IAC practice case.',
    editorialStatus: 'draft',
    masteryEligible: false,
  },
})
async function fixture(
  page: Page,
  options: {
    role?: string
    conflict?: boolean
    script?: boolean
    derived?: boolean
  } = {},
) {
  let item = candidate()
  if (options.script) {
    item.section = 'listening'
    item.drill = { ...item.drill!, section: 'listening', modality: 'script' }
  }
  if (options.derived)
    item.drill = {
      ...item.drill!,
      sourceMaterialId: 'original-material',
      sourceVersionId: 'original-version',
    }
  const writes: EditorialDecision[] = []
  const unexpected: string[] = []
  let reads = 0
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/v1/auth/refresh')
      return route.fulfill({
        json: {
          accessToken: 'test-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'editor-user',
            role: options.role ?? 'ADMIN',
            email: 'editor@example.test',
            displayName: 'Editor Test',
            permissions: [],
            timezone: 'UTC',
          },
        },
      })
    if (path === '/api/v1/analytics/ping') return route.fulfill({ status: 204 })
    if (path === '/api/v1/guest/session')
      return route.fulfill({
        status: 401,
        json: { error: { code: 'UNAUTHORIZED', message: 'No guest session' } },
      })
    if (path === '/api/v1/admin/study-learning/content') {
      reads++
      return route.fulfill({
        json: {
          items: [item],
          limitations: ['Editorial admission is not an IELTS band.'],
        },
      })
    }
    if (path.endsWith('/history')) return route.fulfill({ json: { items: [] } })
    if (
      path === '/api/v1/admin/study-learning/content/drill/ferry-question' &&
      route.request().method() === 'PUT'
    ) {
      const body = route.request().postDataJSON() as EditorialDecision
      writes.push(body)
      if (options.conflict && writes.length === 1) {
        item = {
          ...item,
          metadata: {
            kind: 'drill',
            referenceId: item.id,
            version: item.version,
            section: item.section,
            familyId: 'other-family',
            status: 'reviewed',
            contentHash: item.contentHash,
            revision: 5,
            reviewNotes: 'Another editor checked this source.',
            reviewerId: 'other-editor',
            reviewedAt: '2026-10-24T10:00:00Z',
          },
        }
        return route.fulfill({
          status: 409,
          json: { error: { code: 'CONFLICT', message: 'Changed' } },
        })
      }
      const revision = (item.metadata?.revision ?? 0) + 1
      item = {
        ...item,
        metadata: {
          kind: 'drill',
          referenceId: item.id,
          version: item.version,
          section: item.section,
          familyId: body.familyId,
          status: body.status,
          contentHash: body.contentHash,
          revision,
          reviewNotes: body.reviewNotes,
          reviewerId: 'editor-user',
          reviewedAt: '2026-10-24T11:00:00Z',
        },
      }
      return route.fulfill({
        json: {
          revision,
          status: body.status,
          familyId: body.familyId,
          contentHash: body.contentHash,
        },
      })
    }
    unexpected.push(`${route.request().method()} ${path}`)
    return route.fulfill({
      status: 501,
      json: { error: { message: 'Unexpected request' } },
    })
  })
  await page.goto('./admin/learning-content')
  return { writes, unexpected, reads: () => reads }
}
async function openAndFill(page: Page) {
  if (
    !(await page
      .getByRole('heading', { name: 'Ferry TFNG', exact: true })
      .isVisible())
  )
    await page.getByRole('button', { name: /Ferry TFNG/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Ferry TFNG', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Заметка редактора', exact: true })
    .fill('The source, accepted key and family were checked independently.')
  await page.getByRole('checkbox', { name: /Ключи и объяснения/ }).check()
  await page.getByRole('checkbox', { name: /Семейство назначено/ }).check()
  await page.getByRole('checkbox', { name: /Источник и права/ }).check()
}
test('admin explicitly reviews exact content; keys remain staff-only and no bulk approval exists', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const f = await fixture(page)
  await page.getByRole('button', { name: /Ferry TFNG/ }).click()
  await expect(
    page.getByRole('button', { name: 'Опубликовать', exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByText('Ключ (видят только администраторы)', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Ответ: FALSE', { exact: true })).toBeVisible()
  await openAndFill(page)
  await page.screenshot({
    path: info.outputPath('editorial-desktop-1280.png'),
    fullPage: true,
  })
  const columns = await page
    .getByRole('complementary', { name: 'Предпросмотр материала' })
    .evaluate((element) => ({
      preview: element.getBoundingClientRect().width,
      fields:
        element.previousElementSibling?.getBoundingClientRect().width ?? 0,
    }))
  expect(columns.preview).toBeGreaterThanOrEqual(300)
  expect(columns.fields).toBeGreaterThanOrEqual(300)
  await page.getByRole('button', { name: 'Опубликовать', exact: true }).click()
  await expect(page.getByRole('status')).toContainText(
    'Решение сохранено (ревизия 1)',
  )
  expect(f.writes).toHaveLength(1)
  expect(f.writes[0]).toMatchObject({
    expectedRevision: 0,
    version: 'draft-1',
    contentHash: 'a'.repeat(64),
    familyId: 'ferry-family',
    keysChecked: true,
    familyChecked: true,
    sourceChecked: true,
  })
  await expect(
    page.getByRole('checkbox', { name: /Ключи и объяснения/ }),
  ).not.toBeChecked()
  expect(f.unexpected).toEqual([])
})
test('409 preserves note, clears checklist and requires explicit re-opening current revision', async ({
  page,
}) => {
  const f = await fixture(page, { conflict: true })
  await openAndFill(page)
  await page.getByRole('button', { name: 'Опубликовать', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Заметка осталась в поле')
  await expect(
    page.getByRole('textbox', { name: 'Заметка редактора', exact: true }),
  ).toHaveValue(
    'The source, accepted key and family were checked independently.',
  )
  await expect(
    page.getByRole('checkbox', { name: /Ключи и объяснения/ }),
  ).not.toBeChecked()
  await expect(
    page.getByRole('button', { name: 'Опубликовать', exact: true }),
  ).toBeDisabled()
  await page
    .getByRole('button', { name: 'Загрузить актуальную версию', exact: true })
    .click()
  await page.getByRole('checkbox', { name: /Ключи и объяснения/ }).check()
  await page.getByRole('checkbox', { name: /Семейство назначено/ }).check()
  await page.getByRole('checkbox', { name: /Источник и права/ }).check()
  await page.getByRole('button', { name: 'Опубликовать', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('ревизия 6')
  expect(f.writes[1].expectedRevision).toBe(5)
  expect(f.unexpected).toEqual([])
})
test('a script without audio cannot be admitted as Listening; mobile detail fits', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 900 })
  const f = await fixture(page, { script: true })
  await openAndFill(page)
  await expect(
    page.getByText('Аудио нет. Чтение сценария не подтверждает аудирование.', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Опубликовать', exact: true }),
  ).toBeDisabled()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(360)
  await page.screenshot({
    path: info.outputPath('editorial-mobile.png'),
    fullPage: true,
  })
  expect(f.writes).toHaveLength(0)
  expect(f.unexpected).toEqual([])
})
test('a derived drill requires its reviewed source family', async ({
  page,
}) => {
  const f = await fixture(page, { derived: true })
  await openAndFill(page)
  await expect(
    page.getByRole('button', { name: 'Опубликовать', exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByText(
      'Сначала подтвердите семейство исходного материала; упражнение использует то же семейство',
      { exact: true },
    ),
  ).toBeVisible()
  expect(f.writes).toHaveLength(0)
})

test('409 while withdrawing closes the dialog, preserves the note and exposes reload', async ({
  page,
}) => {
  const f = await fixture(page, { conflict: true })
  await openAndFill(page)
  await page.getByRole('button', { name: 'Снять', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Подтвердить снятие', exact: true })
    .click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Заметка осталась в поле')
  await expect(
    page.getByRole('textbox', { name: 'Заметка редактора', exact: true }),
  ).toHaveValue(
    'The source, accepted key and family were checked independently.',
  )
  await page
    .getByRole('button', { name: 'Загрузить актуальную версию', exact: true })
    .click()
  await page.getByRole('button', { name: 'Снять', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Подтвердить снятие', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('ревизия 6')
  expect(f.writes.map((w) => w.status)).toEqual(['withdrawn', 'withdrawn'])
  expect(f.unexpected).toEqual([])
})

for (const role of ['STUDENT', 'EDITOR']) {
  test(`${role} cannot enter editorial route or request private keys`, async ({
    page,
  }) => {
    const f = await fixture(page, { role })
    await expect(page).toHaveURL(/forbidden/)
    expect(f.reads()).toBe(0)
    expect(f.writes).toHaveLength(0)
    expect(f.unexpected).toEqual([])
  })
}
