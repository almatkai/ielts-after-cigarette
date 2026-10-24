// These are UI tests against an explicit fake Study Plan API, not real-backend tests.
import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import type {
  StudyAssignment,
  StudyResponse,
} from '../src/features/study-plan/api'
import { learningFixture } from './fixtures/learning'
import { addDays, daysBetween } from '../src/features/study-plan/calendar'

// Captured authenticated local GET responses, replayed without modifying fields.
const liveResponse = JSON.parse(
  readFileSync(
    new URL('./fixtures/study-plan-live-response.json', import.meta.url),
    'utf8',
  ),
) as StudyResponse
const liveMockResponse = JSON.parse(
  readFileSync(
    new URL('./fixtures/study-plan-live-mock-response.json', import.meta.url),
    'utf8',
  ),
) as StudyResponse
// The synthetic fixtures below deliberately cover defensive/legacy edge states.
// They do not describe current backend output and are not used for review PNGs.
const today = '2026-10-24'
const settings = {
  dailyMinutes: 60,
  studyDays: [1, 2, 3, 4, 5, 6],
  weeklyMockEnabled: true,
}
function assignment(
  id: string,
  extra: Partial<StudyAssignment> = {},
): StudyAssignment {
  return {
    id,
    kind: 'PRACTICE',
    skill: 'reading',
    title: 'Новый текст: городские сады',
    reason:
      'В последней работе неверно определено доказательство для False / Not Given.',
    durationMinutes: 20,
    status: 'PLANNED',
    materialId: 'reading-material',
    attemptId: null,
    sourceAttemptId: null,
    target: '/exam/reading/reading-material',
    skipReason: null,
    completedAt: null,
    ...extra,
  }
}
function fixture(): StudyResponse {
  return {
    today,
    timezone: 'Asia/Almaty',
    settings: { ...settings, studyDays: [...settings.studyDays] },
    goal: { targetBand: 7, examDate: '2026-12-12', examType: 'academic' },
    plan: {
      id: 'cycle-1',
      revision: 1,
      startDate: '2026-10-19',
      endDate: '2026-11-17',
      returnAfterPause: false,
      changes: [],
      days: Array.from({ length: 30 }, (_, i) => {
        const date = addDays('2026-10-19', i)
        const rest = i % 7 === 6
        return {
          date,
          dayIndex: i + 1,
          week: Math.floor(i / 7) + 1,
          budgetMinutes: rest ? 0 : 60,
          plannedMinutes: rest ? 0 : 35,
          isRest: rest,
          preliminary: i >= 7,
          assignments: rest
            ? []
            : [
                assignment(`practice-${i}`),
                assignment(`review-${i}`, {
                  kind: 'REVIEW',
                  title: 'Разбор False / Not Given',
                  durationMinutes: 15,
                  sourceAttemptId: 'source-attempt',
                  target: '/attempts/source-attempt',
                }),
              ],
        }
      }),
      weeks: Array.from({ length: 5 }, (_, i) => ({
        week: i + 1,
        startDate: addDays('2026-10-19', i * 7),
        endDate: addDays('2026-10-19', Math.min(29, i * 7 + 6)),
        goal:
          i === 0
            ? 'Разобрать доказательства в Reading и проверить Speaking'
            : 'Поддержать навыки и проверить новые ошибки',
        preliminary: i > 0,
        mockOffer: {
          status: 'AVAILABLE',
          durationMinutes: 165,
          scheduledDate: null,
          windowMinutes: null,
          target: '/full-mocks',
        },
      })),
    },
    recommendations: [
      {
        id: 'tfng',
        skill: 'reading',
        title: 'Просмотр разбора: 3 неверных ответа',
        reason:
          'В работе Reading от 22 октября неверных ответов: 3. Можно посмотреть сохранённый разбор.',
        attemptId: 'source-attempt',
        target: '/attempts/source-attempt',
      },
    ],
    evidence: ['listening', 'reading', 'writing', 'speaking'].map((skill) => ({
      skill: skill as 'reading',
      band: null,
      practiceBand: skill === 'reading' ? 6.5 : null,
      status: skill === 'reading' ? 'STALE' : 'MISSING',
      attemptId: skill === 'reading' ? 'source-attempt' : null,
      assessedAt: skill === 'reading' ? '2026-09-02T18:00:00Z' : null,
      sampleCount: skill === 'reading' ? 2 : 0,
      score: skill === 'reading' ? 7 : null,
      maxScore: skill === 'reading' ? 10 : null,
      source: skill === 'reading' ? 'practice / partial section' : 'none',
      limitations: ['Короткая работа, без подтверждённой конверсии IELTS.'],
    })),
    overallBand: null,
    progress: [
      {
        date: today,
        completedAttempts: 1,
        reviewedAssignments: 0,
        skippedAssignments: 0,
        plannedMinutes: 35,
        activeMinutes: null,
      },
    ],
    limitations: ['Активное время не измеряется.'],
  }
}
function defensiveFixture(): StudyResponse {
  const data = fixture()
  const shift = 3 // Thursday, 22 October: a cycle week is not a calendar Monday.
  data.plan!.startDate = '2026-10-22'
  data.plan!.endDate = '2026-11-20'
  for (const day of data.plan!.days) {
    day.date = addDays(day.date, shift)
    day.isRest = new Date(`${day.date}T12:00:00Z`).getUTCDay() === 0
    day.budgetMinutes = day.isRest ? 0 : 60
    day.assignments = day.isRest ? [] : day.assignments
    day.plannedMinutes = day.isRest
      ? 0
      : day.assignments.reduce((sum, a) => sum + a.durationMinutes, 0)
  }
  for (const week of data.plan!.weeks) {
    week.startDate = addDays(week.startDate, shift)
    week.endDate = addDays(week.endDate, shift)
  }
  const day = data.plan!.days.find((d) => d.date === today)!
  day.assignments = [
    assignment('review-one', {
      kind: 'REVIEW',
      title: 'Просмотр разбора: 3 неверных ответа',
      durationMinutes: 15,
      sourceAttemptId: 'source-attempt',
      target: '/attempts/source-attempt',
      reason:
        'В сохранённой работе Reading есть неверные ответы. Просмотрите доказательства и объяснения.',
    }),
    assignment('review-two', {
      kind: 'REVIEW',
      title: 'Просмотр разбора: 3 неверных ответа',
      durationMinutes: 15,
      sourceAttemptId: 'other-source',
      target: '/attempts/other-source',
      reason:
        'В другой сохранённой работе Reading есть неверные ответы. Просмотр не подтверждает освоение.',
    }),
    assignment('blocked', {
      title: 'Практика Reading',
      status: 'BLOCKED',
      durationMinutes: 0,
      materialId: null,
      target: '/reading',
      reason:
        'Нет подходящего непройденного материала в пределах дневного бюджета.',
    }),
  ]
  day.plannedMinutes = 30
  const replaced = data.plan!.days.find((d) => d.date === '2026-10-26')!
  replaced.assignments = [
    assignment('superseded', {
      status: 'SKIPPED',
      skipReason: 'superseded_by_optional_mock',
      reason: 'Обычное задание заменено выбранным длинным окном.',
    }),
  ]
  replaced.plannedMinutes = 0
  data.plan!.weeks[0].mockOffer = {
    ...data.plan!.weeks[0].mockOffer,
    status: 'SCHEDULED',
    scheduledDate: replaced.date,
    windowMinutes: 180,
  }
  data.plan!.changes = [
    {
      type: 'MOCK_SCHEDULED',
      date: today,
      description:
        'Обычные задания 26 октября заменены отдельным длинным окном. Долг не добавлен.',
    },
  ]
  data.evidence[1].score = 3
  data.evidence[1].maxScore = 5
  data.evidence[1].practiceBand = 6
  data.evidence[1].sampleCount = 1
  return data
}
const sourceAttempt = {
  id: 'source-attempt',
  materialType: 'reading',
  materialId: 'reading-material',
  materialVersionId: 'v1',
  status: 'SUBMITTED',
  score: 7,
  maxScore: 10,
  band: 6.5,
  testTitle: 'Исходный текст',
  testSlug: 'source',
  startedAt: '2026-10-22T10:00:00Z',
  submittedAt: '2026-10-22T10:20:00Z',
  answers: [],
  review: [],
  recordings: [],
}
const material = {
  id: 'reading-material',
  title: 'Исходный текст',
  examType: 'academic',
  kind: 'PASSAGE',
  durationMinutes: 20,
  body: 'A published reading passage.',
  questionGroups: [],
}
async function mockStudy(page: Page, initial = fixture()) {
  let data = structuredClone(initial)
  const archived: StudyResponse['plan'][] = []
  let failure:
    | { method: string; suffix: string; status: number; remaining: number }
    | undefined
  const calls: {
    method: string
    path: string
    body: Record<string, unknown>
  }[] = []
  const unknown: string[] = []
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const method = request.method()
    const body = request.postDataJSON() ?? {}
    if (path === '/guest/session')
      return route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } })
    if (path === '/analytics/ping' && method === 'POST')
      return route.fulfill({ status: 204 })
    if (path === '/auth/refresh')
      return route.fulfill({
        json: {
          accessToken: 'mock-study-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'study-student',
            role: 'STUDENT',
            email: 'study@example.test',
            displayName: 'Student',
            timezone: data.timezone,
            currentBand: null,
            targetBand: 7,
            examDate: '2026-12-12',
            examType: 'academic',
          },
        },
      })
    if (path === '/dashboard')
      return route.fulfill({
        json: {
          profile: { currentBand: 8.5, targetBand: 7, examDate: '2026-12-12' },
          todayPlan: [],
          skillProgress: [],
          recommendedAction: {
            title: 'legacy',
            description: '',
            target: '/practice',
          },
          unreadNotifications: 0,
        },
      })
    if (path === '/attempts' && method === 'GET')
      return route.fulfill({ json: { items: [] } })
    if (path === '/attempts/source-attempt' && method === 'GET')
      return route.fulfill({ json: sourceAttempt })
    if (path === '/attempts/source-attempt/material')
      return route.fulfill({ json: material })
    if (
      path === '/reading/materials/reading-material' ||
      path === '/reading/reading-material'
    )
      return route.fulfill({ json: material })
    if (path === '/full-mock-sessions/active')
      return route.fulfill({ json: { items: [] } })
    if (path === '/study-plan/learning' && method === 'GET') {
      const learning = learningFixture()
      learning.cycles = []
      learning.profiles = []
      learning.today = data.today
      learning.examDate = data.goal.examDate
      learning.readOnly = !!(
        data.goal.examDate && data.today >= data.goal.examDate
      )
      return route.fulfill({ json: learning })
    }
    if (path.startsWith('/study-plan')) {
      calls.push({ method, path, body })
      if (
        failure &&
        failure.method === method &&
        path.endsWith(failure.suffix) &&
        failure.remaining > 0
      ) {
        failure.remaining--
        return route.fulfill({
          status: failure.status,
          json: {
            code:
              failure.status === 409
                ? 'REVISION_CONFLICT'
                : 'DEPENDENCY_UNAVAILABLE',
            message: 'Mock failure',
          },
        })
      }
      if (method === 'GET' && path === '/study-plan')
        return route.fulfill({ json: data })
      if (method === 'POST' && path === '/study-plan') {
        if (data.plan && data.today <= data.plan.endDate)
          return route.fulfill({ json: data })
        const previous = data.plan
        const next = fixture()
        if (previous) {
          archived.push(structuredClone(previous))
          const shift = daysBetween(next.plan!.startDate, data.today)
          next.today = data.today
          next.plan!.id = previous.id
          next.plan!.revision = previous.revision + 1
          next.plan!.startDate = data.today
          next.plan!.endDate = addDays(data.today, 29)
          for (const day of next.plan!.days) day.date = addDays(day.date, shift)
          for (const week of next.plan!.weeks) {
            week.startDate = addDays(week.startDate, shift)
            week.endDate = addDays(week.endDate, shift)
          }
          next.plan!.changes = [
            {
              type: 'NEW_CYCLE',
              date: data.today,
              description:
                'Новый 30-дневный цикл создан по вашему запросу; история предыдущего цикла сохранена',
            },
          ]
          next.progress = data.progress
        }
        data = { ...next, settings: body as typeof settings }
        return route.fulfill({ json: data })
      }
      if (data.plan && body.expectedRevision !== data.plan.revision)
        return route.fulfill({
          status: 409,
          json: { code: 'REVISION_CONFLICT' },
        })
      if (path === '/study-plan/settings' && method === 'PUT') {
        data.settings = {
          dailyMinutes: body.dailyMinutes,
          studyDays: body.studyDays,
          weeklyMockEnabled: body.weeklyMockEnabled,
        }
        data.plan!.revision++
        return route.fulfill({ json: data })
      }
      if (path === '/study-plan/replan' && method === 'POST') {
        data.plan!.revision++
        data.plan!.changes = [
          {
            type: 'MOVED',
            date: today,
            description:
              'Перенесено: разбор на следующий учебный день. Нагрузка не увеличена.',
          },
        ]
        return route.fulfill({ json: data })
      }
      const match = path.match(
        /^\/study-plan\/assignments\/([^/]+)\/(start|skip|review)$/,
      )
      if (match && method === 'POST') {
        const item = data
          .plan!.days.flatMap((d) => d.assignments)
          .find((a) => a.id === match[1])!
        if (match[2] === 'start') {
          item.status = 'IN_PROGRESS'
          data.plan!.revision++
          return route.fulfill({
            json: {
              attemptId:
                item.kind === 'REVIEW'
                  ? item.sourceAttemptId
                  : 'active-attempt',
              target: item.target,
              planRevision: data.plan!.revision,
            },
          })
        }
        if (match[2] === 'skip') {
          item.status = 'SKIPPED'
          item.skipReason = String(body.reason)
          data.progress[0].skippedAssignments++
        }
        if (match[2] === 'review') {
          item.status = 'COMPLETED'
          data.progress[0].reviewedAssignments++
        }
        data.plan!.revision++
        return route.fulfill({ json: data })
      }
      const week = path.match(/^\/study-plan\/weeks\/(\d+)\/mock$/)
      if (week && method === 'POST') {
        const offer = data.plan!.weeks[Number(week[1]) - 1].mockOffer
        offer.status = body.action === 'decline' ? 'DECLINED' : 'SCHEDULED'
        offer.scheduledDate = (body.scheduledDate as string | undefined) ?? null
        offer.windowMinutes = (body.windowMinutes as number | undefined) ?? null
        if (offer.scheduledDate) {
          const day = data.plan!.days.find(
            (d) => d.date === offer.scheduledDate,
          )
          if (day) {
            day.assignments = []
            day.plannedMinutes = 0
          }
          data.plan!.changes = [
            {
              type: 'REMOVED',
              date: offer.scheduledDate,
              description:
                'Убрано: обычные задания для отдельного длинного окна.',
            },
          ]
        }
        data.plan!.revision++
        return route.fulfill({ json: data })
      }
    }
    unknown.push(`${method} ${path}`)
    return route.fulfill({
      status: 404,
      json: {
        code: 'MOCK_UNHANDLED_ROUTE',
        message: `Unhandled mock route: ${path}`,
      },
    })
  })
  return {
    calls,
    unknown,
    errors,
    archived,
    data: () => data,
    fail: (method: string, suffix: string, status: number, remaining = 1) => {
      failure = { method, suffix, status, remaining }
    },
  }
}
async function openPlan(page: Page, suffix = '') {
  await page.goto(`./plan${suffix}`)
  await expect(
    page.getByRole('heading', { name: 'План', exact: true }),
  ).toBeVisible()
  await page.getByText('Как составлен план', { exact: true }).click()
}
function noRuntimeErrors(mock: Awaited<ReturnType<typeof mockStudy>>) {
  expect(mock.errors).toEqual([])
  expect(mock.unknown).toEqual([])
}

test.describe('Study plan — mocked API UI', () => {
  test('new student chooses real settings, validates empty weekdays and creates a plan', async ({
    page,
  }) => {
    const initial = fixture()
    initial.plan = null
    initial.goal = { targetBand: null, examDate: null, examType: null }
    initial.evidence = []
    initial.recommendations = []
    const mock = await mockStudy(page, initial)
    await openPlan(page)
    await expect(
      page.getByRole('button', { name: 'Добавить дату экзамена', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Задать цель' }),
    ).toHaveAttribute('href', '/app/profile')
    for (const label of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'])
      await page
        .getByRole('button', { name: label, exact: true, pressed: true })
        .click()
    await expect(
      page.getByRole('button', { name: 'Создать план' }),
    ).toBeDisabled()
    await page
      .getByRole('button', { name: 'Вт', exact: true, pressed: false })
      .click()
    await page
      .getByRole('radiogroup', { name: 'Минут в учебный день' })
      .getByRole('radio', { name: '30', exact: true })
      .click()
    await page.getByRole('button', { name: 'Создать план' }).click()
    await expect(
      page.getByText('Версия плана 1', { exact: false }),
    ).toBeVisible()
    expect(
      mock.calls.find((c) => c.method === 'POST' && c.path === '/study-plan')
        ?.body,
    ).toEqual({ dailyMinutes: 30, studyDays: [2], weeklyMockEnabled: true })
    noRuntimeErrors(mock)
  })
  test('settings save revision, selected days and weekly mock preference', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await openPlan(page)
    await page.getByRole('button', { name: 'Меню плана', exact: true }).click()
    await page.getByRole('button', { name: 'Настройки', exact: true }).click()
    await page
      .getByRole('radiogroup', { name: 'Минут в учебный день' })
      .getByRole('radio', { name: '45', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Сб', exact: true, pressed: true })
      .click()
    await page
      .getByRole('switch', { name: 'Пробный экзамен раз в неделю' })
      .uncheck()
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
    await expect(
      page.getByText('Версия плана 2', { exact: false }),
    ).toBeVisible()
    expect(mock.calls.find((c) => c.path.endsWith('/settings'))?.body).toEqual({
      ...settings,
      dailyMinutes: 45,
      studyDays: [1, 2, 3, 4, 5],
      weeklyMockEnabled: false,
      expectedRevision: 1,
    })
    noRuntimeErrors(mock)
  })
  test('plan menu keeps service data out of the first screen; optional exam date saves through the existing goal endpoint', async ({
    page,
  }) => {
    const data = fixture()
    data.goal.examDate = null
    const mock = await mockStudy(page, data)
    const goals: unknown[] = []
    await page.route('**/api/v1/profile/goal', (route) => {
      const body = route.request().postDataJSON()
      goals.push(body)
      mock.data().goal.examDate = body.examDate
      return route.fulfill({
        json: {
          id: 'study-student',
          role: 'STUDENT',
          email: 'study@example.test',
          displayName: 'Student',
          timezone: data.timezone,
          currentBand: null,
          targetBand: body.targetBand,
          examType: body.examType,
          examDate: body.examDate,
        },
      })
    })
    await page.goto('./plan')
    await expect(
      page.getByRole('heading', { name: 'План', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Версия плана 1', { exact: false }),
    ).toBeHidden()
    await expect(page.getByText('Календарь:', { exact: false })).toBeHidden()
    await page
      .getByRole('button', { name: 'Добавить дату экзамена', exact: true })
      .click()
    const dialog = page.getByRole('dialog', { name: 'Настройки нагрузки' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel(/Дата экзамена/)).toHaveAttribute(
      'lang',
      'ru',
    )
    await dialog.getByLabel(/Дата экзамена/).fill('2026-12-20')
    await dialog.getByRole('button', { name: 'Отмена', exact: true }).click()
    expect(goals).toEqual([])
    await page.getByRole('button', { name: 'Меню плана', exact: true }).click()
    await page.getByRole('button', { name: 'Настройки', exact: true }).click()
    await expect(dialog.getByLabel(/Дата экзамена/)).toHaveValue('')
    await dialog.getByLabel(/Дата экзамена/).fill('2026-12-20')
    await dialog.getByRole('button', { name: 'Сохранить', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    expect(goals).toEqual([
      { targetBand: 7, examType: 'academic', examDate: '2026-12-20' },
    ])
    expect(mock.calls.filter((c) => c.path.endsWith('/settings'))).toHaveLength(
      1,
    )
    await expect(
      page.getByRole('button', { name: 'Добавить дату экзамена', exact: true }),
    ).toHaveCount(0)
    noRuntimeErrors(mock)
  })
  test('two skips preserve explicit reasons and replan never increases displayed budgets', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await openPlan(page)
    for (const [title, reason] of [
      ['Новый текст: городские сады', 'Нет времени'],
      ['Разбор False / Not Given', 'Уже сделал вне приложения'],
    ]) {
      await page.getByRole('button', { name: `Действия: ${title}` }).click()
      await page
        .getByRole('button', { name: 'Пропустить', exact: true })
        .click()
      await page.getByLabel(reason, { exact: true }).check()
      await page.getByRole('button', { name: 'Подтвердить пропуск' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }
    await expect(page.getByText('Пропущено', { exact: false })).toHaveCount(2)
    await page
      .getByRole('button', { name: 'Перепланировать оставшееся' })
      .click()
    await expect(page.getByText('История версий и изменения')).toBeVisible()
    await expect(
      page.getByText(/Перенесено: разбор на следующий/),
    ).toBeVisible()
    await expect(
      page.getByText(/Выполнено \d+ из 60 мин/, { exact: true }),
    ).toBeVisible()
    expect(
      mock.calls
        .filter((c) => c.path.endsWith('/skip'))
        .map((c) => c.body.reason),
    ).toEqual(['no_time', 'outside_app'])
    expect(
      mock.data().plan!.days.every((d) => d.plannedMinutes <= d.budgetMinutes),
    ).toBe(true)
    noRuntimeErrors(mock)
  })
  test('failed skip keeps dialog and can be retried without pretending completion', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    mock.fail('POST', '/skip', 503)
    await openPlan(page)
    await page
      .getByRole('button', { name: 'Действия: Новый текст: городские сады' })
      .click()
    await page.getByRole('button', { name: 'Пропустить', exact: true }).click()
    await page.getByRole('button', { name: 'Подтвердить пропуск' }).click()
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
    expect(mock.data().plan!.days[5].assignments[0].status).toBe('PLANNED')
    await page.getByRole('button', { name: 'Подтвердить пропуск' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(mock.calls.filter((c) => c.path.endsWith('/skip'))).toHaveLength(2)
    noRuntimeErrors(mock)
  })
  test('409 refetches authoritative revision before another explicit action', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await openPlan(page)
    mock.data().plan!.revision = 9
    mock.fail('POST', '/replan', 409)
    await page
      .getByRole('button', { name: 'Перепланировать оставшееся' })
      .click()
    await expect(page.getByRole('alert')).toContainText('План изменился')
    await expect(
      page.getByText('Версия плана 9', { exact: false }),
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Перепланировать оставшееся' })
      .click()
    await expect(
      page.getByText('Версия плана 10', { exact: false }),
    ).toBeVisible()
    expect(
      mock.calls
        .filter((c) => c.path.endsWith('/replan'))
        .map((c) => c.body.expectedRevision),
    ).toEqual([1, 9])
    noRuntimeErrors(mock)
  })
  test('recommendation links point at evidence, stale practice score stays unvalidated', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await openPlan(page)
    const recommendations = page.getByRole('region', { name: 'Что изменить' })
    await expect(recommendations).toContainText('неверных ответов: 3')
    await expect(
      recommendations.getByRole('link', { name: 'Исходная работа' }),
    ).toHaveAttribute('href', '/app/attempts/source-attempt')
    await expect(page.getByTestId('evidence-reading')).toContainText(
      'Результат: 7/10',
    )
    await expect(page.getByTestId('evidence-reading')).toContainText(
      'Данные устарели',
    )
    await expect(
      page.getByText('появится, когда будут проверены все 4 навыка (0/4)'),
    ).toBeVisible()
    noRuntimeErrors(mock)
  })
  test('weekly mock uses server duration, requires explicit sufficient window and replaces ordinary tasks', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await openPlan(page, '?view=week&date=2026-10-24')
    await page
      .getByText('Полный пробный экзамен · необязательно', { exact: true })
      .click()
    await expect(
      page.getByText('Займёт 165 мин подряд:', { exact: false }),
    ).toBeVisible()
    await page.getByLabel('Непрерывное окно, минут').fill('60')
    await expect(
      page.getByRole('button', { name: 'Запланировать окно' }),
    ).toBeDisabled()
    await expect(page.getByRole('alert')).toContainText('не хватает окна')
    await page.getByLabel('Непрерывное окно, минут').fill('180')
    await page.getByLabel('День длинного окна').selectOption('2026-10-26')
    await page.getByRole('button', { name: 'Запланировать окно' }).click()
    await expect(
      page.getByText('Длинное окно · Full Mock · 180 мин', { exact: true }),
    ).toBeVisible()
    expect(mock.calls.find((c) => c.path.endsWith('/1/mock'))?.body).toEqual({
      expectedRevision: 1,
      action: 'schedule',
      scheduledDate: '2026-10-26',
      windowMinutes: 180,
    })
    expect(mock.data().plan!.days[7].assignments).toEqual([])
    noRuntimeErrors(mock)
  })
  test('weekly mock decline persists on reload and does not start an exam', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await openPlan(page)
    await page
      .getByText('Полный пробный экзамен · необязательно', { exact: true })
      .click()
    await page.getByRole('button', { name: 'Не на этой неделе' }).click()
    await expect(
      page.getByText('Решение сохранено.', { exact: false }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByText('Решение сохранено.', { exact: false }),
    ).toBeVisible()
    expect(mock.calls.filter((c) => c.method !== 'GET')).toEqual([
      {
        method: 'POST',
        path: '/study-plan/weeks/1/mock',
        body: { expectedRevision: 1, action: 'decline' },
      },
    ])
    noRuntimeErrors(mock)
  })
  test('past and future dates are read-only; URL selectors never mutate or follow browser midnight', async ({
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-10-23T23:59:55Z') })
    const mock = await mockStudy(page)
    await openPlan(page, '?view=day&date=2026-10-23')
    await expect(
      page.getByRole('button', { name: 'Начать', exact: true }),
    ).toHaveCount(0)
    await page.getByRole('radio', { name: 'Неделя' }).click()
    await expect(page).toHaveURL(/view=week/)
    await page.getByRole('radio', { name: 'Месяц' }).click()
    await expect(
      page.getByRole('heading', { name: /^Итоговые проверки и обзор/ }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Сегодня', exact: true }).click()
    await expect(page).toHaveURL(/date=2026-10-24/)
    await page.getByRole('radio', { name: 'День', exact: true }).click()
    await page.getByRole('button', { name: 'Следующий период' }).click()
    await expect(page).toHaveURL(/date=2026-10-25/)
    await page.clock.runFor(10000)
    await expect(page).toHaveURL(/date=2026-10-25/)
    expect(mock.calls.every((c) => c.method === 'GET')).toBe(true)
    noRuntimeErrors(mock)
  })
  test('pending W/S cannot create an overall or expose AI numbers as assessed bands', async ({
    page,
  }) => {
    const data = fixture()
    data.overallBand = 8
    for (const e of data.evidence) {
      e.band = 8
      e.practiceBand = 8
      e.status = ['writing', 'speaking'].includes(e.skill)
        ? 'AWAITING_RESULT'
        : 'CONFIRMED'
      e.source = ['writing', 'speaking'].includes(e.skill)
        ? 'AI'
        : 'official conversion'
    }
    data.plan!.days[5].assignments = [
      assignment('writing-pending', {
        skill: 'writing',
        title: 'Эссе сохранено',
        status: 'AWAITING_RESULT',
        attemptId: 'pending-attempt',
      }),
    ]
    const mock = await mockStudy(page, data)
    await openPlan(page)
    await expect(
      page.getByText('Работа сохранена и ожидает проверки', { exact: false }),
    ).toBeVisible()
    await expect(page.getByTestId('evidence-writing')).toContainText(
      'Ожидает проверки',
    )
    await expect(page.getByTestId('evidence-writing')).not.toContainText('8.0')
    await expect(
      page.getByText('появится, когда будут проверены все 4 навыка (2/4)'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Начать', exact: true }),
    ).toHaveCount(0)
    noRuntimeErrors(mock)
  })
  test('review starts the server target then records only an explicitly acknowledged view', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await openPlan(page)
    await page
      .getByRole('button', { name: 'Открыть разбор', exact: true })
      .click()
    await expect(page).toHaveURL(
      /attempts\/source-attempt\?studyReview=review-5/,
    )
    await expect(
      page.getByRole('button', { name: 'Подтвердить просмотр разбора' }),
    ).toBeDisabled()
    expect(mock.calls.some((c) => c.path.endsWith('/review'))).toBe(false)
    await page.getByLabel('Я просмотрел разбор этой работы').check()
    await page
      .getByRole('button', { name: 'Подтвердить просмотр разбора' })
      .click()
    await expect(
      page.getByText('Разбор просмотрен.', { exact: false }),
    ).toBeVisible()
    expect(mock.data().progress[0].reviewedAssignments).toBe(1)
    expect(mock.data().progress[0].completedAttempts).toBe(1)
    noRuntimeErrors(mock)
  })
  test('mobile study review acknowledgement is clickable without dismissing the assistant', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    const data = fixture()
    data.plan!.returnAfterPause = true
    data.plan!.days[5].assignments = [
      assignment('reentry-review', {
        kind: 'REVIEW',
        title: 'Возвращение: просмотр разбора',
        durationMinutes: 10,
        sourceAttemptId: 'source-attempt',
        target: '/attempts/source-attempt',
      }),
    ]
    data.plan!.days[5].plannedMinutes = 10
    const mock = await mockStudy(page, data)
    await openPlan(page)
    await page
      .getByRole('button', { name: 'Открыть разбор', exact: true })
      .click()
    await expect(page).toHaveURL(/studyReview=reentry-review/)
    await expect(
      page.getByRole('button', { name: 'Открыть чат с Юки', exact: true }),
    ).toHaveCount(0)
    await page.getByLabel('Я просмотрел разбор этой работы').check()
    await page
      .getByRole('button', {
        name: 'Подтвердить просмотр разбора',
        exact: true,
      })
      .click()
    await expect(
      page.getByText('Разбор просмотрен.', { exact: false }),
    ).toBeVisible()
    expect(mock.data().progress[0].reviewedAssignments).toBe(1)
    await page
      .getByRole('link', { name: 'Вернуться к плану', exact: true })
      .click()
    await expect(
      page.getByText('Разбор просмотрен', {
        exact: true,
      }),
    ).toBeVisible()
    await page.goto('./attempts/source-attempt')
    await expect(
      page.locator('main').getByText('Band 6.5', { exact: false }),
    ).toHaveCount(0)
    await expect(
      page
        .getByRole('button', { name: 'Открыть чат с Юки', exact: true })
        .first(),
    ).toBeVisible()
    noRuntimeErrors(mock)
  })

  test('start double click posts once and navigates to the returned app target', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await page.route(
      '**/api/v1/study-plan/assignments/practice-5/start',
      async (route) => {
        mock.calls.push({
          method: 'POST',
          path: '/study-plan/assignments/practice-5/start',
          body: route.request().postDataJSON(),
        })
        await new Promise((resolve) => setTimeout(resolve, 250))
        await route.fulfill({
          json: {
            attemptId: null,
            target: '/app/attempts/source-attempt',
            planRevision: 1,
          },
        })
      },
    )
    await openPlan(page)
    await page
      .getByRole('button', { name: 'Начать', exact: true })
      .evaluate((button) => {
        ;(button as HTMLButtonElement).click()
        ;(button as HTMLButtonElement).click()
      })
    await expect(page).toHaveURL(/\/app\/attempts\/source-attempt$/)
    expect(mock.calls.filter((c) => c.path.endsWith('/start'))).toHaveLength(1)
    noRuntimeErrors(mock)
  })
  test('GET failure has retry; missing assignment 404 refreshes without a fake success', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    mock.fail('GET', '/study-plan', 503, 100)
    await page.goto('./plan')
    await expect(
      page.getByRole('heading', { name: 'Не удалось загрузить план' }),
    ).toBeVisible()
    mock.fail('GET', '/study-plan', 503, 0)
    await page.getByRole('button', { name: 'Повторить попытку' }).click()
    await expect(
      page.getByRole('heading', { name: 'План', exact: true }),
    ).toBeVisible()
    mock.fail('POST', '/start', 404)
    await page.getByRole('button', { name: 'Начать', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('больше недоступны')
    await expect(page).toHaveURL(/\/plan/)
    expect(mock.data().plan!.days[5].assignments[0].status).toBe('PLANNED')
    noRuntimeErrors(mock)
  })
  test('overview and progress show plan evidence and actual activity without the legacy overall', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await page.goto('./')
    await expect(
      page.getByRole('region', { name: 'План на сегодня' }),
    ).toContainText('Почему:')
    await expect(page.getByText('Расчётный IELTS Band')).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'Перейти к следующему заданию' }),
    ).toHaveAttribute('href', /plan/)
    await page.goto('./progress')
    await expect(
      page
        .getByRole('region', { name: 'Активность по дням' })
        .locator('[aria-live]'),
    ).toContainText('Выполнено0')
    await expect(
      page.getByRole('region', { name: 'Активность по дням' }),
    ).toContainText('Последние 14 дней · задания')
    noRuntimeErrors(mock)
  })
  test('early weekly overview cannot schedule a long window before its offer day', async ({
    page,
  }) => {
    const data = fixture()
    data.today = '2026-10-19'
    const mock = await mockStudy(page, data)
    await openPlan(page, '?view=week&date=2026-10-19')
    await page
      .getByText('Полный пробный экзамен · необязательно', { exact: true })
      .click()
    await expect(
      page.getByText('Предложение станет доступно', { exact: false }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Запланировать окно' }),
    ).toHaveCount(0)
    expect(mock.calls.every((c) => c.method === 'GET')).toBe(true)
    noRuntimeErrors(mock)
  })
  test('an expired authenticated mutation clears the plan and asks for sign in', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await openPlan(page)
    await page.route('**/api/v1/auth/refresh', (route) =>
      route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } }),
    )
    mock.fail('POST', '/start', 401, 100)
    await page.getByRole('button', { name: 'Начать', exact: true }).click()
    await expect(
      page.getByText('Сессия истекла. Войдите снова.', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Задания плана' }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'Войти', exact: true }).last(),
    ).toHaveAttribute('href', '/app/login')
    noRuntimeErrors(mock)
  })

  test('a target without an exam date is a valid rolling plan', async ({
    page,
  }) => {
    const data = fixture()
    data.goal.examDate = null
    const mock = await mockStudy(page, data)
    await openPlan(page)
    await expect(
      page.getByRole('button', { name: 'Добавить дату экзамена', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Задать цель', exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Добавить дату экзамена', exact: true }),
    ).toBeVisible()
    noRuntimeErrors(mock)
  })
  test('plan suppresses the assistant without changing visibility on progress; sidebar labels practice scores', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await page.route('**/api/v1/attempts?**', (route) =>
      route.fulfill({
        json: { items: [{ ...sourceAttempt, score: 3, maxScore: 5, band: 6 }] },
      }),
    )
    await openPlan(page)
    await expect(
      page.getByRole('button', { name: 'Открыть чат с Юки', exact: true }),
    ).toHaveCount(0)
    const sidebar = page.getByRole('region', { name: 'История прогресса' })
    await expect(sidebar).toContainText('3/5')
    await expect(sidebar).not.toContainText('Band 6.0')
    await page.getByRole('link', { name: 'Вся история', exact: true }).click()
    await expect(
      page
        .getByRole('button', { name: 'Открыть чат с Юки', exact: true })
        .first(),
    ).toBeVisible()
    await page
      .getByRole('link', { name: 'План подготовки', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Открыть чат с Юки', exact: true }),
    ).toHaveCount(0)
    noRuntimeErrors(mock)
  })

  test('expired cycle stays readable until an explicit next-cycle create preserves history', async ({
    page,
  }) => {
    const data = fixture()
    data.today = '2026-11-18'
    data.plan!.days[0].assignments[0].status = 'COMPLETED'
    const mock = await mockStudy(page, data)
    await openPlan(page, '?view=month&date=2026-11-18')
    await expect(
      page.getByRole('region', { name: 'Завершённый цикл' }),
    ).toContainText('30-дневный план завершён')
    await expect(
      page.getByRole('heading', { name: /^Неделя 1 ·/ }),
    ).toBeVisible()
    await expect(
      page.getByText('Этот цикл вне текущего плана.', { exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Перепланировать оставшееся' }),
    ).toBeDisabled()
    expect(mock.calls.every((c) => c.method === 'GET')).toBe(true)
    mock.fail('POST', '/study-plan', 503)
    await page
      .getByRole('button', { name: 'Начать следующий 30-дневный план' })
      .click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /^Неделя 1 ·/ }),
    ).toBeVisible()
    expect(mock.archived).toHaveLength(0)
    await page
      .getByRole('button', { name: 'Начать следующий 30-дневный план' })
      .evaluate((button) => {
        ;(button as HTMLButtonElement).click()
        ;(button as HTMLButtonElement).click()
      })
    await expect(
      page.getByRole('region', { name: 'Завершённый цикл' }),
    ).toHaveCount(0)
    await expect(page).toHaveURL(/(?=.*view=day)(?=.*date=2026-11-18)/)
    expect(
      mock.calls.filter((c) => c.method === 'POST' && c.path === '/study-plan'),
    ).toHaveLength(2)
    expect(mock.data().plan!.id).toBe(data.plan!.id)
    expect(mock.data().plan!.revision).toBe(2)
    expect(mock.data().plan!.startDate).toBe('2026-11-18')
    expect(mock.archived).toHaveLength(1)
    expect(mock.archived[0]!.days[0].assignments[0].status).toBe('COMPLETED')
    await expect(
      page.getByRole('button', { name: 'Перепланировать оставшееся' }),
    ).toBeEnabled()
    noRuntimeErrors(mock)
  })

  test('Thursday cycle weeks have seven in-plan dates, one goal and one optional mock', async ({
    page,
  }) => {
    const data = defensiveFixture()
    data.plan!.weeks[0].mockOffer.status = 'AVAILABLE'
    const mock = await mockStudy(page, data)
    await openPlan(page, '?view=week&date=2026-10-24')
    const tasks = page.getByRole('region', { name: 'Задания плана' })
    await expect(
      tasks.locator(
        'button[aria-controls="selected-week-day"][aria-expanded="false"]',
      ),
    ).toHaveCount(6)
    await expect(tasks).not.toContainText('Вне текущего плана')
    await expect(tasks).not.toContainText('Reading + Reading')
    await expect(
      tasks.getByText('Полный пробный экзамен · необязательно', {
        exact: true,
      }),
    ).toHaveCount(1)
    await expect(tasks).not.toContainText(data.plan!.weeks[1].goal)
    await page.getByRole('button', { name: 'Следующий период' }).click()
    await expect(page).toHaveURL(/date=2026-10-29/)
    await expect(
      tasks.locator(
        'button[aria-controls="selected-week-day"][aria-expanded="false"]',
      ),
    ).toHaveCount(6)
    await page.getByRole('button', { name: 'Предыдущий период' }).click()
    await expect(page).toHaveURL(/date=2026-10-22/)
    noRuntimeErrors(mock)
  })
  test('duplicate review titles, blocked targets and mock supersession remain truthful', async ({
    page,
  }) => {
    const mock = await mockStudy(page, defensiveFixture())
    await openPlan(page)
    await expect(
      page.getByRole('heading', {
        name: 'Просмотр разбора: 3 неверных ответа',
        exact: true,
      }),
    ).toHaveCount(2)
    const blocked = page.getByRole('link', {
      name: 'Выбрать доступную практику',
    })
    await expect(blocked).toHaveAttribute('href', '/app/reading')
    expect(
      await blocked.evaluate((el) => el.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(44)
    await page.getByRole('radio', { name: 'Неделя', exact: true }).click()
    await page.getByRole('button', { name: /26 окт/, expanded: false }).click()
    await expect(
      page.getByText('Заменено длинным окном', { exact: false }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: 'Длинное окно · Full Mock · 180 мин',
        exact: true,
      }),
    ).toHaveCount(1)
    await expect(
      page.getByRole('region', { name: 'Задания плана' }),
    ).not.toContainText('undefined')
    noRuntimeErrors(mock)
  })
  test('unvalidated short practice is raw evidence only and technical changes make no replan banner', async ({
    page,
  }) => {
    const data = fixture()
    data.plan!.changes = [
      {
        type: 'DAY_RECONCILED',
        date: today,
        description: 'Техническая сверка дня',
      },
    ]
    const mock = await mockStudy(page, data)
    await openPlan(page)
    await expect(
      page.getByRole('region', { name: 'Учебные результаты' }),
    ).toContainText('Результат: 7/10')
    await expect(
      page.getByRole('region', { name: 'Учебные результаты' }),
    ).not.toContainText('6.5')
    await expect(
      page.getByRole('region', { name: 'Ориентировочный балл' }),
    ).toContainText('появится, когда будут проверены все 4 навыка (0/4)')
    await expect(
      page.getByText('План обновлён под оставшееся время.', { exact: false }),
    ).toHaveCount(0)
    await page
      .getByRole('button', { name: 'Действия: Новый текст: городские сады' })
      .click()
    await expect(
      page.getByRole('button', { name: 'Заменить материал', exact: true }),
    ).toHaveCount(0)
    noRuntimeErrors(mock)
  })
  test('mock dates stop at cycle end, and zero/rest/missing activity days stay distinct', async ({
    page,
  }) => {
    const data = fixture()
    data.plan!.endDate = '2026-10-25'
    const mock = await mockStudy(page, data)
    await openPlan(page)
    await page
      .getByText('Полный пробный экзамен · необязательно', { exact: true })
      .click()
    await expect(
      page.getByLabel('День длинного окна').locator('option'),
    ).toHaveCount(1)
    await expect(page.getByLabel('День длинного окна')).toHaveValue(
      '2026-10-25',
    )
    data.today = '2026-10-27'
    mock.data().today = data.today
    mock.data().progress.push({
      date: '2026-10-25',
      completedAttempts: 0,
      reviewedAssignments: 0,
      skippedAssignments: 0,
      plannedMinutes: 0,
      activeMinutes: null,
    })
    await page.goto('./progress')
    const activity = page.getByRole('region', { name: 'Активность по дням' })
    await activity.getByRole('button', { name: /25 окт.*День отдыха/ }).click()
    await expect(activity.locator('[aria-live]')).toContainText('День отдыха')
    await activity.getByRole('button', { name: /25 окт/ }).click()
    await expect(activity.locator('[aria-live]')).toContainText('Выполнено0')
    await activity.getByRole('button', { name: /17 окт/ }).click()
    await expect(activity.locator('[aria-live]')).toContainText(
      'Нет сохранённых данных за этот день',
    )
    noRuntimeErrors(mock)
  })

  for (const kind of ['GET', 'mutation'] as const)
    test(`identity A to B rejects A's delayed ${kind} response in the same tab`, async ({
      page,
    }) => {
      const a = fixture()
      a.plan!.days[5].assignments[0].title = 'Private task A'
      const b = fixture()
      b.plan!.id = 'cycle-B'
      b.plan!.days[5].assignments[0].title = 'Private task B'
      const mock = await mockStudy(page, a)
      let release!: () => void
      const delayed = new Promise<void>((resolve) => {
        release = resolve
      })
      let aStarted = false
      let aReturned = false
      await page.route('**/api/v1/auth/google', (route) =>
        route.fulfill({
          json: {
            accessToken: 'mock-B',
            tokenType: 'Bearer',
            expiresIn: 3600,
            user: {
              id: 'student-B',
              role: 'STUDENT',
              displayName: 'Student B',
              email: 'b@example.test',
              timezone: 'Asia/Almaty',
              currentBand: null,
              targetBand: 7,
              examDate: null,
              examType: 'academic',
            },
          },
        }),
      )
      await page.route('**/api/v1/study-plan', async (route) => {
        if (route.request().headers().authorization === 'Bearer mock-B')
          return route.fulfill({ json: b })
        if (kind === 'GET') {
          aStarted = true
          await delayed
          try {
            await route.fulfill({ json: a })
          } finally {
            aReturned = true
          }
        } else await route.fulfill({ json: a })
      })
      if (kind === 'mutation')
        await page.route('**/api/v1/study-plan/replan', async (route) => {
          aStarted = true
          await delayed
          try {
            await route.fulfill({
              json: { ...a, plan: { ...a.plan!, revision: 2 } },
            })
          } finally {
            aReturned = true
          }
        })
      await page.goto('./plan')
      if (kind === 'mutation') {
        await expect(
          page.getByRole('heading', { name: 'Private task A' }),
        ).toBeVisible()
        await page.getByText('Как составлен план', { exact: true }).click()
        await page
          .getByRole('button', { name: 'Перепланировать оставшееся' })
          .click()
      }
      await expect.poll(() => aStarted).toBe(true)
      await page.evaluate(async () => {
        const moduleUrl = '/app/src/features/auth/auth-store.ts'
        const { authStore } = await import(moduleUrl)
        await authStore.loginWithGoogle('fixture')
      })
      await expect(
        page.getByRole('heading', { name: 'Private task B' }),
      ).toBeVisible()
      await page.evaluate(() => {
        const seen: string[] = []
        Object.assign(window, { identityLeaks: seen })
        new MutationObserver(() => {
          if (document.body.innerText.includes('Private task A')) seen.push('A')
        }).observe(document.body, { childList: true, subtree: true })
      })
      release()
      await expect.poll(() => aReturned).toBe(true)
      await expect(
        page.getByRole('heading', { name: 'Private task A' }),
      ).toHaveCount(0)
      await expect(
        page.getByRole('heading', { name: 'Private task B' }),
      ).toBeVisible()
      expect(
        await page.evaluate(() => Reflect.get(window, 'identityLeaks')),
      ).toEqual([])
      noRuntimeErrors(mock)
    })

  test('progress history exposes raw L/R and ready W/S without any numeric band', async ({
    page,
  }) => {
    const mock = await mockStudy(page)
    await page.route('**/api/v1/attempts?**', (route) =>
      route.fulfill({
        json: {
          items: ['reading', 'listening', 'writing', 'speaking'].map(
            (skill, i) => ({
              ...sourceAttempt,
              id: `history-${skill}`,
              materialType: skill,
              testTitle: `Saved ${skill}`,
              score: i + 1,
              maxScore: 40,
              band: 8.5,
            }),
          ),
        },
      }),
    )
    await page.goto('./progress')
    const main = page.locator('main')
    await expect(main.getByText('1/40', { exact: true })).toBeVisible()
    await expect(main.getByText('2/40', { exact: true })).toBeVisible()
    await expect(main.getByText('Разбор готов', { exact: true })).toHaveCount(2)
    await expect(main.getByText('3/40', { exact: true })).toHaveCount(0)
    await expect(main.getByText('4/40', { exact: true })).toHaveCount(0)
    await expect(main.getByText(/band 8\.5/i)).toHaveCount(0)
    noRuntimeErrors(mock)
  })
  test('optional mock offer follows selected ISO weekdays even when reentry overrides rest', async ({
    page,
  }) => {
    const data = fixture()
    data.plan!.days[6].isRest = false
    const mock = await mockStudy(page, data)
    await openPlan(page, '?view=week&date=2026-10-24')
    await page
      .getByText('Полный пробный экзамен · необязательно', { exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Запланировать окно', exact: true }),
    ).toBeEnabled()
    noRuntimeErrors(mock)
  })
  for (const width of [360, 1280]) {
    test(`captured GET day/week/month at ${width}px — screenshot QA`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      const mock = await mockStudy(page, liveResponse)
      await openPlan(page)
      await page.getByText('Как составлен план', { exact: true }).click()
      for (const [view, name] of [
        ['День', 'day'],
        ['Неделя', 'week'],
        ['Месяц', 'month'],
      ] as const) {
        await page.getByRole('radio', { name: view, exact: true }).click()
        await expect(
          page.getByRole('region', { name: 'Задания плана' }),
        ).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
        await expect(
          page.getByRole('button', { name: 'Открыть чат с Юки', exact: true }),
        ).toHaveCount(0)
        await page.screenshot({
          path: `artifact/study-plan-review-round3/plan-${width}-${name}.png`,
          fullPage: true,
        })
      }
      expect(mock.calls.every((c) => c.method === 'GET')).toBe(true)
      expect(mock.data()).toEqual(liveResponse)
      noRuntimeErrors(mock)
    })
    test(`captured GET scheduled mock at ${width}px — screenshot QA`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      const mock = await mockStudy(page, liveMockResponse)
      await openPlan(page, `?view=week&date=${liveMockResponse.today}`)
      await page.getByText('Как составлен план', { exact: true }).click()
      const link = page.getByRole('link', {
        name: 'Открыть Full Mock',
        exact: true,
      })
      expect(
        await link.evaluate((el) => el.getBoundingClientRect().height),
      ).toBeGreaterThanOrEqual(44)
      await page.screenshot({
        path: `artifact/study-plan-review-round3/plan-${width}-mock-week.png`,
        fullPage: true,
      })
      const scheduled = liveMockResponse.plan!.weeks.find(
        (w) => w.mockOffer.status === 'SCHEDULED',
      )!.mockOffer.scheduledDate!
      await openPlan(page, `?view=day&date=${scheduled}`)
      await page.getByText('Как составлен план', { exact: true }).click()
      await expect(
        page.getByRole('heading', {
          name: 'Длинное окно · Full Mock · 165 мин',
          exact: true,
        }),
      ).toHaveCount(1)
      await expect(
        page.getByText('Заменено длинным окном', { exact: false }),
      ).toBeVisible()
      await page.screenshot({
        path: `artifact/study-plan-review-round3/plan-${width}-mock-day.png`,
        fullPage: true,
      })
      expect(mock.calls.every((c) => c.method === 'GET')).toBe(true)
      expect(mock.data()).toEqual(liveMockResponse)
      noRuntimeErrors(mock)
    })
  }
})
