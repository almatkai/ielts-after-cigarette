// Strict contract-shaped API mocks; these tests make no real-database claims.
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { cycleFixture, learningFixture } from './fixtures/learning'
import type {
  AttemptDetail,
  AttemptMaterialType,
} from '../src/features/attempts/api'

const ids = {
  reading: '11111111-1111-4111-8111-111111111111',
  listening: '22222222-2222-4222-8222-222222222222',
  writing: '33333333-3333-4333-8333-333333333333',
  speaking: '44444444-4444-4444-8444-444444444444',
} as const

function attempt(skill: AttemptMaterialType, evaluated = true): AttemptDetail {
  const criterion = { band: 7, feedback: `${skill} criterion comment retained` }
  const base: AttemptDetail = {
    id: ids[skill],
    materialType: skill,
    materialId: `${skill}-material`,
    materialVersionId: 'v1',
    status: 'SUBMITTED',
    score: ['reading', 'listening'].includes(skill) ? 12 : null,
    maxScore: ['reading', 'listening'].includes(skill) ? 20 : null,
    band: 7,
    startedAt: '2026-10-24T08:00:00Z',
    submittedAt: '2026-10-24T08:30:00Z',
    answers: [],
    review: [],
    recordings: [],
  }
  if (skill === 'speaking' && evaluated)
    base.speakingEvaluation = {
      model: 'fixture',
      overallBand: 7,
      evaluatedAt: base.submittedAt!,
      pronunciationAvailable: true,
      summary: 'Speaking feedback is retained',
      criteria: {
        fluency: criterion,
        lexicalResource: criterion,
        grammar: criterion,
        pronunciation: criterion,
      },
      parts: [],
    }
  if (skill === 'writing' && evaluated)
    base.writingEvaluation = {
      model: 'fixture',
      overallBand: 7,
      evaluatedAt: base.submittedAt!,
      summary: 'Writing feedback is retained',
      criteria: {
        taskResponse: criterion,
        coherence: criterion,
        lexicalResource: criterion,
        grammar: criterion,
      },
      tasks: [],
    }
  return base
}
async function fixture(page: Page, evaluated = true) {
  const unexpected: string[] = [],
    errors: string[] = []
  const attempts = Object.fromEntries(
    (['reading', 'listening', 'writing', 'speaking'] as const).map((skill) => [
      skill,
      attempt(skill, evaluated),
    ]),
  )
  const learning = learningFixture()
  const speakingCycle = cycleFixture('speaking-cycle', 'speaking')
  speakingCycle.source.attemptId = ids.speaking
  learning.cycles = [speakingCycle]
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace('/api/v1', '')
    const json = (value: unknown, status = 200) =>
      route.fulfill({ status, json: value })
    if (path === '/billing/me')
      return route.fulfill({ json: { paywallEnabled: false, guest: false } })
    if (path === '/auth/refresh' && req.method() === 'POST')
      return json({
        accessToken: 'fixture-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 'student',
          role: 'STUDENT',
          email: 'student@example.test',
          displayName: 'Student',
          timezone: 'UTC',
        },
      })
    if (path === '/guest/session' && req.method() === 'GET')
      return json({ code: 'UNAUTHENTICATED' }, 401)
    if (path === '/analytics/ping' && req.method() === 'POST')
      return route.fulfill({ status: 204 })
    if (path === '/dashboard' && req.method() === 'GET')
      return json({
        profile: { currentBand: null, targetBand: null, examDate: null },
        todayPlan: [],
        skillProgress: [],
        recommendedAction: {
          title: 'Practice',
          description: '',
          target: '/practice',
        },
        unreadNotifications: 0,
      })
    if (
      (path === '/attempts' || path === '/full-mock-sessions/active') &&
      req.method() === 'GET'
    )
      return json({ items: [] })
    if (path === '/study-plan/learning' && req.method() === 'GET')
      return json(learning)
    if (path === '/attempts/mistakes/attempts' && req.method() === 'GET') {
      const skill = url.searchParams.get('materialType') as AttemptMaterialType
      return json({
        items: [
          {
            ...attempts[skill],
            testTitle: `${skill} saved work`,
            testSlug: skill,
            fullMockSessionId: null,
            mistakeCount: ['reading', 'listening'].includes(skill) ? 1 : null,
          },
        ],
        page: 1,
        hasNext: false,
      })
    }
    const detail = /^\/attempts\/([a-zA-Z0-9-]+)(\/mistakes)?$/.exec(path)
    if (detail && req.method() === 'GET') {
      const item = Object.values(attempts).find(
        (entry) => entry.id === detail[1],
      )
      if (!item) {
        unexpected.push(`Unknown attempt ${detail[1]}`)
        return json({ code: 'NOT_FOUND' }, 404)
      }
      return json(
        detail[2]
          ? {
              attempt: item,
              answers: item.answers,
              writingEvaluation: item.writingEvaluation,
              speakingEvaluation: item.speakingEvaluation,
              review: [],
              contexts: [],
            }
          : item,
      )
    }
    if (path === '/full-mock-sessions/mock-state' && req.method() === 'GET')
      return json({
        id: 'mock-state',
        mockTestId: 'mock',
        status: 'SUBMITTED',
        currentSection: 4,
        startedAt: attempts.writing.startedAt,
        submittedAt: attempts.writing.submittedAt,
        overallBand: null,
        mockTest: {
          id: 'mock',
          examType: 'academic',
          title: 'Saved full mock',
        },
        sections: [
          { position: 3, skill: 'writing', attempt: attempts.writing },
          { position: 4, skill: 'speaking', attempt: attempts.speaking },
        ],
      })
    unexpected.push(`${req.method()} ${path}`)
    return json({ code: 'UNEXPECTED_FIXTURE_REQUEST' }, 501)
  })
  return {
    verify: () => {
      expect(unexpected).toEqual([])
      expect(errors).toEqual([])
    },
  }
}
for (const skill of ['writing', 'speaking'] as const) {
  test(`${skill} mistakes list hides bands and preserves saved-work status`, async ({
    page,
  }) => {
    const api = await fixture(page)
    await page.setViewportSize({ width: 360, height: 900 })
    await page.goto(`mistakes?skill=${skill}&page=1`)
    await expect(
      page.getByRole('heading', { name: `${skill} saved work` }),
    ).toBeVisible()
    await expect(
      page.getByText('Работа сохранена · без подтверждённой оценки IELTS'),
    ).toBeVisible()
    await expect(page.locator('main').getByText(/Band\s*7|7\.0/)).toHaveCount(0)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    api.verify()
  })
  test(`${skill} submitted work without evaluation is unavailable in history and bank`, async ({
    page,
  }) => {
    const api = await fixture(page, false)
    await page.goto(`attempts/${ids[skill]}`)
    await expect(
      page.getByText('Разбор пока недоступен', { exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Нет ошибок', { exact: true })).toHaveCount(0)
    await page.goto(`mistakes?skill=${skill}&page=1&attempt=${ids[skill]}`)
    await expect(
      page.getByText('Разбор пока недоступен', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('В этой попытке нет ошибок для разбора.', { exact: true }),
    ).toHaveCount(0)
    api.verify()
  })
}
for (const skill of ['reading', 'listening'] as const) {
  test(`${skill} mistakes list retains raw score instead of inferred bands`, async ({
    page,
  }) => {
    const api = await fixture(page)
    await page.goto(`mistakes?skill=${skill}&page=1`)
    await expect(
      page.getByText('1 ошибка · 12/20', { exact: true }),
    ).toBeVisible()
    await expect(page.locator('main').getByText(/Band\s*7|7\.0/)).toHaveCount(0)
    api.verify()
  })
}
test('Speaking inline review retains comments and learning link, hides all numeric bands, explains typed/audio limits', async ({
  page,
}) => {
  const api = await fixture(page)
  await page.goto(`mistakes?skill=speaking&page=1&attempt=${ids.speaking}`)
  await expect(
    page.getByText('Speaking · учебный разбор', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Speaking feedback is retained', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('speaking criterion comment retained', { exact: true }),
  ).toHaveCount(4)
  await expect(page.locator('main').getByText(/Band\s*7|7\.0/)).toHaveCount(0)
  await expect(
    page.getByText(
      'Текстовый ответ и расшифровка не подтверждают беглость и произношение.',
      { exact: false },
    ),
  ).toBeVisible()
  await expect(
    page.getByRole('link', {
      name: /Исправить эту ошибку|Правка сохранена · открыть цикл/,
    }),
  ).toHaveAttribute('href', /\/plan\/learning\/cycles\/speaking-cycle$/)
  api.verify()
})
test('Full Mock distinguishes absent W/S evaluation from ready feedback', async ({
  page,
}) => {
  const api = await fixture(page, false)
  await page.goto('exam/full-mock-sessions/mock-state?section=3')
  const sections = page.getByRole('group', { name: 'Full Mock sections' })
  await expect(
    sections.getByText('Разбор пока недоступен', { exact: true }),
  ).toHaveCount(2)
  await expect(sections.getByText('Разбор готов', { exact: true })).toHaveCount(
    0,
  )
  await expect(
    page
      .locator('#full-mock-review')
      .getByText('Разбор пока недоступен', { exact: true }),
  ).toBeVisible()
  await sections
    .getByRole('button', { name: 'Show Speaking review', exact: true })
    .click()
  await expect(
    page
      .locator('#full-mock-review')
      .getByText('Разбор пока недоступен', { exact: true }),
  ).toBeVisible()
  api.verify()
})
