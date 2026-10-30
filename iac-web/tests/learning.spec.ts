import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { Page, Route } from '@playwright/test'
import type { LearningSession } from '../src/features/study-plan/learning-api'
import type { StudyResponse } from '../src/features/study-plan/api'
import {
  cycleFixture,
  drillFixture,
  learningFixture,
  sessionFixture,
  stamp,
} from './fixtures/learning'

function tinyWav() {
  const samples = 8000,
    wav = Buffer.alloc(44 + samples * 2)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(36 + samples * 2, 4)
  wav.write('WAVEfmt ', 8)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(8000, 24)
  wav.writeUInt32LE(16000, 28)
  wav.writeUInt16LE(2, 32)
  wav.writeUInt16LE(16, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(samples * 2, 40)
  for (let index = 0; index < samples; index++)
    wav.writeInt16LE(
      Math.round(Math.sin((index * 2 * Math.PI * 440) / 8000) * 1000),
      44 + index * 2,
    )
  return wav
}

type Call = { method: string; path: string; body: Record<string, unknown> }
async function setup(page: Page, data = learningFixture()) {
  const unexpected: string[] = []
  const errors: string[] = []
  const calls: Call[] = []
  let failure: { suffix: string; status: number; remaining: number } | undefined
  let identity = 'student-a'
  let hold:
    { suffix: string; entered: () => void; wait: Promise<void> } | undefined
  const sessions = new Map<string, LearningSession>()
  const plan: StudyResponse = JSON.parse(
    readFileSync(
      new URL('./fixtures/study-plan-live-response.json', import.meta.url),
      'utf8',
    ),
  )
  plan.goal.examDate = data.examDate
  plan.today = data.today
  plan.plan!.days.find((d) => d.date === data.today)!.assignments = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/api/v1/**', async (route: Route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace('/api/v1', ''),
      method = req.method()
    const body: Record<string, unknown> = req.postDataJSON() ?? {}
    const json = (value: unknown, status = 200) =>
      route.fulfill({ status, json: value })
    if (path === '/guest/session' && method === 'GET')
      return json({ code: 'UNAUTHENTICATED' }, 401)
    if (path === '/analytics/ping' && method === 'POST')
      return route.fulfill({ status: 204 })
    if (path === '/billing/me')
      return route.fulfill({ json: { paywallEnabled: false, guest: false } })
    if (path === '/auth/refresh' && method === 'POST')
      return json({
        accessToken: `token-${identity}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: identity,
          email: `${identity}@example.test`,
          displayName: 'Learning student',
          role: 'STUDENT',
          timezone: 'Asia/Almaty',
          currentBand: null,
          targetBand: 7,
          examDate: data.examDate,
          examType: 'academic',
        },
      })
    if (path === '/dashboard' && method === 'GET')
      return json({
        profile: { currentBand: null, targetBand: 7, examDate: data.examDate },
        todayPlan: [],
        skillProgress: [],
        recommendedAction: {
          title: 'Practice',
          description: '',
          target: '/practice',
        },
        unreadNotifications: 0,
      })
    if (path === '/attempts' && method === 'GET')
      return json({
        items:
          url.searchParams.get('materialType') === 'speaking'
            ? [
                {
                  id: 'owned-audio',
                  materialType: 'speaking',
                  status: 'SUBMITTED',
                  testTitle: 'My recorded Part 2 response',
                  submittedAt: stamp,
                  startedAt: stamp,
                  materialId: 'speaking-1',
                  materialVersionId: 'v1',
                  score: null,
                  maxScore: null,
                  band: null,
                  testSlug: 'recording',
                  fullMockSessionId: null,
                },
              ]
            : [],
      })
    if (path === '/attempts/owned-audio' && method === 'GET')
      return json({
        id: 'owned-audio',
        materialType: 'speaking',
        status: 'SUBMITTED',
        recordings: [{ id: 'recording-1', partId: 'part-2', byteSize: 16000 }],
      })
    if (path === '/full-mock-sessions/active' && method === 'GET')
      return json({ items: [] })
    if (path === '/study-plan' && method === 'GET') return json(plan)
    if (path === '/listening/media/owned-listening' && method === 'GET') {
      expect(req.headers().authorization).toBe('Bearer token-student-a')
      return route.fulfill({
        contentType: 'audio/wav',
        body: tinyWav(),
      })
    }
    if (path.startsWith('/study-plan/learning')) {
      calls.push({ method, path, body })
      const captured = structuredClone(
        path === '/study-plan/learning'
          ? data
          : data.cycles.find((c) => path.includes(`/cycles/${c.id}`)),
      )
      if (hold && path.endsWith(hold.suffix)) {
        hold.entered()
        await hold.wait
        return json(captured)
      }
      if (
        failure &&
        path.endsWith(failure.suffix) &&
        method === 'POST' &&
        failure.remaining-- > 0
      ) {
        if (failure.status === 0) return route.abort('connectionfailed')
        if (failure.status === 409) {
          data.revision++
          const cycle = data.cycles.find((c) => path.includes(c.id))
          if (cycle) cycle.revision++
        }
        return json(
          {
            code:
              failure.status === 409 ? 'REVISION_CONFLICT' : 'VALIDATION_ERROR',
            message: 'Fixture failure',
            details:
              failure.status === 422
                ? { explanation: 'Укажите предложение из текста' }
                : undefined,
          },
          failure.status,
        )
      }
      if (path === '/study-plan/learning' && method === 'GET') return json(data)
      if (path === '/study-plan/learning/inventory' && method === 'GET')
        return json(data.inventory)
      const cycleMatch =
        /^\/study-plan\/learning\/cycles\/([^/]+)(?:\/(view|correction|skip))?$/.exec(
          path,
        )
      if (cycleMatch) {
        const cycle = data.cycles.find((c) => c.id === cycleMatch[1])
        if (!cycle) return json({ code: 'NOT_FOUND' }, 404)
        if (!cycleMatch[2] && method === 'GET') return json(cycle)
        if (
          method === 'POST' &&
          ['view', 'correction', 'skip'].includes(cycleMatch[2])
        ) {
          expect(body.expectedRevision).toBe(cycle.revision)
          if (cycleMatch[2] === 'view') cycle.viewedAt = stamp
          if (cycleMatch[2] === 'skip') cycle.skippedAt = stamp
          if (cycleMatch[2] === 'correction') {
            expect(typeof body.assisted).toBe('boolean')
            cycle.correction = {
              text: String(body.text),
              explanation: String(body.explanation),
              assisted: Boolean(body.assisted),
              savedAt: stamp,
              verdict:
                cycle.section === 'reading'
                  ? body.text === 'FALSE'
                    ? 'correct'
                    : 'incorrect'
                  : 'unverified',
              feedback:
                'Server verdict: compare your answer with the source evidence.',
            }
            cycle.status =
              cycle.correction.verdict === 'correct' &&
              !cycle.correction.assisted
                ? 'awaiting-transfer'
                : 'correction-saved'
          }
          if (cycleMatch[2] === 'correction') {
            cycle.checks = []
            cycle.remainingChecks = 2
          }
          cycle.revision++
          data.revision++
          return json(cycle)
        }
      }
      const start = /^\/study-plan\/learning\/drills\/([^/]+)\/start$/.exec(
        path,
      )
      if (start && method === 'POST') {
        expect(body.expectedRevision).toBe(data.revision)
        expect(typeof body.idempotencyKey).toBe('string')
        const drill = data.drills.find((d) => d.id === start[1])
        if (!drill) return json({ code: 'NOT_FOUND' }, 404)
        const existing = [...sessions.values()].find(
          (s) => s.drill.id === drill.id && s.status === 'in-progress',
        )
        if (existing) return json(existing)
        const session = sessionFixture(drill, `session-${drill.id}`)
        session.cycleId = typeof body.cycleId === 'string' ? body.cycleId : null
        session.assignmentId =
          typeof body.assignmentId === 'string' ? body.assignmentId : null
        sessions.set(session.id, session)
        data.revision++
        return json(session)
      }
      const sessionMatch =
        /^\/study-plan\/learning\/sessions\/([^/]+)(?:\/(submit))?$/.exec(path)
      if (sessionMatch) {
        const session = sessions.get(sessionMatch[1])
        if (!session) return json({ code: 'NOT_FOUND' }, 404)
        if (!sessionMatch[2] && method === 'GET') return json(session)
        if (sessionMatch[2] === 'submit' && method === 'POST') {
          expect(body.expectedRevision).toBe(session.revision)
          expect(typeof body.assisted).toBe('boolean')
          session.text = String(body.text)
          session.explanation = String(body.explanation)
          session.assisted = Boolean(body.assisted)
          session.audioAttemptId =
            typeof body.audioAttemptId === 'string' ? body.audioAttemptId : null
          session.status = 'submitted'
          session.revision++
          session.submittedAt = stamp
          session.verdict = ['writing', 'speaking'].includes(
            session.drill.section,
          )
            ? 'unverified'
            : body.text === 'TRUE'
              ? 'correct'
              : 'incorrect'
          session.independent =
            session.drill.masteryEligible &&
            session.drill.editorialStatus === 'reviewed' &&
            !session.assisted &&
            !!session.cycleId
          session.independenceReason = session.independent
            ? 'Reviewed, new family, no help.'
            : 'Draft or unverified practice.'
          session.feedback = 'Saved by fixture server.'
          const cycle = data.cycles.find((c) => c.id === session.cycleId)
          if (cycle) {
            cycle.checks.push({
              sessionId: session.id,
              familyId: session.drill.familyId,
              occurredAt: stamp,
              independent: session.independent,
              delayed: false,
              passed: session.verdict === 'correct',
              reason: session.independenceReason,
            })
            cycle.remainingChecks = Math.max(
              0,
              cycle.remainingChecks -
                (session.independent && session.verdict === 'correct' ? 1 : 0),
            )
            cycle.revision++
          }
          data.revision++
          return json(session)
        }
      }
    }
    unexpected.push(`${method} ${path}${url.search}`)
    return json(
      { code: 'UNEXPECTED_MOCK_REQUEST', message: `${method} ${path}` },
      501,
    )
  })
  return {
    data,
    sessions,
    calls,
    plan,
    errors,
    unexpected,
    fail: (suffix: string, status: number, remaining = 1) => {
      failure = { suffix, status, remaining }
    },
    identity: (value: string) => {
      identity = value
    },
    hold: (suffix: string) => {
      let release!: () => void, entered!: () => void
      const reached = new Promise<void>((r) => {
          entered = r
        }),
        wait = new Promise<void>((r) => {
          release = r
        })
      hold = { suffix, entered, wait }
      return {
        reached,
        release: () => {
          hold = undefined
          release()
        },
      }
    },
    verify: () => {
      expect(unexpected).toEqual([])
      expect(errors).toEqual([])
    },
  }
}
async function openCycle(page: Page, id = 'cycle-reading') {
  await page.goto(`plan/learning/cycles/${id}`)
  await expect(
    page.getByRole('heading', { name: 'Разбор', exact: true }),
  ).toBeVisible()
}
async function fillCorrection(page: Page, value = 'FALSE') {
  await page.getByRole('radio', { name: value, exact: true }).check()
  await page
    .getByLabel('Объяснение', { exact: true })
    .fill('Most gardens close at sunset; the claim says all.')
  await page
    .getByRole('radio', { name: 'Сам, без подсказок', exact: true })
    .check()
}
async function switchIdentity(page: Page, id: string) {
  await page.evaluate(async (newId) => {
    const modulePath = '/app/src/features/auth/auth-store.ts'
    const { authStore } = await import(/* @vite-ignore */ modulePath)
    authStore.updateUser({ ...authStore.getSnapshot().user, id: newId })
  }, id)
}

test('correct correction and independent new-family check remain separate from viewing', async ({
  page,
}) => {
  const api = await setup(page)
  await openCycle(page)
  await page
    .getByRole('button', { name: 'Отметить: разбор просмотрен' })
    .click()
  await expect(
    page.getByText('Разбор просмотрен', { exact: false }),
  ).toBeVisible()
  expect(api.data.cycles[0].correction).toBeNull()
  await expect(
    page.getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    }),
  ).toBeDisabled()
  await fillCorrection(page)
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(
    page.getByText('Совпало с ключом', { exact: true }),
  ).toBeVisible()
  await expect(page.getByTestId('original-answer')).toHaveText('TRUE')
  await page
    .getByRole('link', { name: 'Следующая тренировка этого навыка' })
    .click()
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await page.getByRole('radio', { name: 'TRUE', exact: true }).check()
  await page
    .getByRole('radio', { name: 'Сам, без подсказок', exact: true })
    .check()
  await page
    .getByRole('button', { name: /^(Проверить|Отправить ответ)$/, exact: true })
    .click()
  await expect(
    page.getByText('Засчитано как независимая проверка.', { exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Вернуться к циклу' }).click()
  await expect(
    page.getByText('Ответ верный — засчитано по правилу практики'),
  ).toBeVisible()
  api.verify()
})
test('incorrect correction is saved as incorrect and can be corrected again', async ({
  page,
}) => {
  const api = await setup(page)
  await openCycle(page)
  await fillCorrection(page, 'TRUE')
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(
    page.getByText('Не совпало с ключом', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Исправить ещё раз' }).click()
  await fillCorrection(page)
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(
    page.getByText('Совпало с ключом', { exact: true }),
  ).toBeVisible()
  expect(api.calls.filter((c) => c.path.endsWith('/correction'))).toHaveLength(
    2,
  )
  api.verify()
})
test('409 refetch keeps input, explicit assistance, and the idempotency key', async ({
  page,
}) => {
  const api = await setup(page)
  api.fail('/correction', 409)
  await openCycle(page)
  await fillCorrection(page)
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(page.getByRole('alert')).toContainText('Данные изменились')
  await expect(page.getByLabel('Объяснение', { exact: true })).toHaveValue(
    'Most gardens close at sunset; the claim says all.',
  )
  await page.getByRole('button', { name: 'Отправить снова' }).click()
  await expect(
    page.getByText('Совпало с ключом', { exact: true }),
  ).toBeVisible()
  const calls = api.calls.filter((c) => c.path.endsWith('/correction'))
  expect(calls[0].body.idempotencyKey).toBe(calls[1].body.idempotencyKey)
  expect(calls[1].body.expectedRevision).toBe(2)
  api.verify()
})
test('422 field error preserves answer and an edit changes the idempotency key', async ({
  page,
}) => {
  const api = await setup(page)
  api.fail('/correction', 422)
  await openCycle(page)
  await fillCorrection(page)
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(page.getByRole('alert')).toContainText('Объяснение')
  await page
    .getByLabel('Объяснение', { exact: true })
    .fill('The first sentence contradicts all.')
  await page.getByRole('button', { name: 'Отправить снова' }).click()
  await expect(
    page.getByText('Совпало с ключом', { exact: true }),
  ).toBeVisible()
  const calls = api.calls.filter((c) => c.path.endsWith('/correction'))
  expect(calls[0].body.idempotencyKey).not.toBe(calls[1].body.idempotencyKey)
  api.verify()
})
test('network-like server retry keeps the same payload key across reload', async ({
  page,
}) => {
  const api = await setup(page)
  api.fail('/correction', 503)
  await openCycle(page)
  await fillCorrection(page)
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('radio', { name: 'FALSE', exact: true }),
  ).toBeChecked()
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(
    page.getByText('Совпало с ключом', { exact: true }),
  ).toBeVisible()
  const calls = api.calls.filter((c) => c.path.endsWith('/correction'))
  expect(calls[0].body.idempotencyKey).toBe(calls[1].body.idempotencyKey)
  api.verify()
})
test('Writing and typed Speaking stay unchecked without remaining-check counts', async ({
  page,
}, info) => {
  const data = learningFixture()
  data.cycles = [
    cycleFixture('cycle-writing', 'writing'),
    cycleFixture('cycle-speaking', 'speaking'),
  ]
  data.cycles[0].source.originalAnswer = Array(60)
    .fill(
      'This is a full essay paragraph with an example and supporting detail.',
    )
    .join(' ')
  data.cycles[0].source.feedback = Array(40)
    .fill('Explain the comparison and connect it to your overall claim.')
    .join(' ')
  await page.setViewportSize({ width: 360, height: 800 })
  const api = await setup(page, data)
  await page.setViewportSize({ width: 1280, height: 900 })
  await openCycle(page, 'cycle-writing')
  const firstField = await page
    .getByLabel('Перепишите отмеченное место')
    .boundingBox()
  expect(firstField).not.toBeNull()
  expect(firstField!.y).toBeGreaterThan(0)
  expect(firstField!.y + firstField!.height).toBeLessThanOrEqual(900)
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await page.screenshot({
    path: info.outputPath('cycle-writing-first-screen-1280.png'),
  })
  await page.setViewportSize({ width: 360, height: 800 })
  const original = page.getByTestId('original-answer')
  await expect(original).toHaveText(data.cycles[0].source.originalAnswer)
  expect(
    await original.evaluate(
      (element) => getComputedStyle(element).textDecorationLine,
    ),
  ).not.toContain('line-through')
  expect(
    await original.evaluate(
      (element) => element.getBoundingClientRect().height,
    ),
  ).toBeLessThanOrEqual(96)
  const footerToggle = page.getByText('Подробнее о проверке и источниках', {
    exact: true,
  })
  const fullOriginal = page
    .getByRole('heading', { name: 'Полный исходный ответ', exact: true })
    .locator('..')
    .locator('p')
  const feedback = page
    .locator('#cycle-review > p')
    .filter({ hasText: data.cycles[0].source.feedback })
  const fullFeedback = page
    .getByRole('heading', { name: 'Полный разбор', exact: true })
    .locator('..')
    .locator('p')
  await expect(fullOriginal).not.toBeVisible()
  await expect(feedback).toHaveText(data.cycles[0].source.feedback)
  expect(
    await feedback.evaluate(
      (element) => element.getBoundingClientRect().height,
    ),
  ).toBeLessThanOrEqual(72)
  await footerToggle.click()
  await expect(fullOriginal).toHaveText(data.cycles[0].source.originalAnswer)
  expect(
    await fullOriginal.evaluate(
      (element) => element.getBoundingClientRect().height,
    ),
  ).toBeGreaterThan(96)
  await expect(fullFeedback).toHaveText(data.cycles[0].source.feedback)
  expect(
    await fullFeedback.evaluate(
      (element) => element.getBoundingClientRect().height,
    ),
  ).toBeGreaterThan(72)
  await footerToggle.click()
  await expect(fullOriginal).not.toBeVisible()
  await expect(fullFeedback).not.toBeVisible()
  await page
    .getByLabel('Перепишите отмеченное место')
    .fill('Overall, the North increased more than the South.')
  await page
    .getByLabel('Объяснение', { exact: true })
    .fill('I compared both series and included an overall trend.')
  await page
    .getByRole('radio', { name: 'Сам, без подсказок', exact: true })
    .check()
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(
    page.getByText('Правка сохранена, не проверена', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText(/По правилу практики осталось/)).toHaveCount(0)
  await openCycle(page, 'cycle-speaking')
  await expect(
    page
      .getByText('Текстовый ответ — не свидетельство речи и произношения.')
      .first(),
  ).toBeVisible()
  await expect(page.getByText(/По правилу практики осталось/)).toHaveCount(0)
  api.verify()
})
test('draft Writing drill preserves labelled table columns and submits own short text as unverified', async ({
  page,
}) => {
  const api = await setup(page)
  await page.goto('plan/learning/drills/drill-writing')
  await page
    .getByText('Подробнее о проверке и источниках', { exact: true })
    .click()
  await expect(
    page.getByText(
      'Материал ещё не проверен редактором — результат считается практикой.',
    ),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  const table = page.getByRole('table', { name: 'Числовые данные задания' })
  await expect(
    table.getByRole('columnheader', { name: 'Year', exact: true }),
  ).toBeVisible()
  await expect(
    table.getByRole('columnheader', { name: 'North', exact: true }),
  ).toBeVisible()
  await expect(
    table.getByRole('columnheader', { name: 'South', exact: true }),
  ).toBeVisible()
  const firstRow = table
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: '2000', exact: true }) })
  await expect(
    firstRow.getByRole('cell', { name: '20', exact: true }),
  ).toBeVisible()
  await expect(
    firstRow.getByRole('cell', { name: '40', exact: true }),
  ).toBeVisible()
  const secondRow = table
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: '2020', exact: true }) })
  await expect(
    secondRow.getByRole('cell', { name: '60', exact: true }),
  ).toBeVisible()
  await expect(
    secondRow.getByRole('cell', { name: '45', exact: true }),
  ).toBeVisible()
  await page
    .getByLabel('Ваш ответ', { exact: true })
    .fill('Overall, the North rose rapidly while the South grew slightly.')
  await expect(
    page.getByRole('button', {
      name: /^(Проверить|Отправить ответ)$/,
      exact: true,
    }),
  ).toBeDisabled()
  await page
    .getByRole('radio', { name: 'С подсказкой, разбором или чужим текстом' })
    .check()
  await page
    .getByRole('button', { name: /^(Проверить|Отправить ответ)$/, exact: true })
    .click()
  await expect(
    page.getByText('Ответ сохранён, не проверен', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Практика: Draft or unverified practice.'),
  ).toBeVisible()
  api.verify()
})
test('session URL resumes the same session and account-scoped draft after reload', async ({
  page,
}) => {
  const api = await setup(page)
  const session = sessionFixture(drillFixture('writing'), 'persisted-session')
  session.cycleId = null
  api.sessions.set(session.id, session)
  await page.goto(
    'plan/learning/drills/drill-writing?session=persisted-session',
  )
  await page
    .getByLabel('Ваш ответ', { exact: true })
    .fill('My own saved overview.')
  await page.reload()
  await expect(page.getByLabel('Ваш ответ', { exact: true })).toHaveValue(
    'My own saved overview.',
  )
  expect(api.calls.filter((c) => c.path.endsWith('/start'))).toHaveLength(0)
  api.verify()
})
test('owned recording selector links valid audio; no raw UUID entry', async ({
  page,
}) => {
  const data = learningFixture()
  const drill = drillFixture('speaking')
  drill.modality = 'audio'
  drill.id = 'drill-speaking-audio'
  data.drills.push(drill)
  const api = await setup(page, data)
  await page.goto(`plan/learning/drills/${drill.id}`)
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await page
    .getByLabel('Ваш ответ', { exact: true })
    .fill('A plan for my recorded answer.')
  await page
    .getByRole('radio', { name: 'Сам, без подсказок', exact: true })
    .check()
  await expect(
    page.getByRole('button', {
      name: /^(Проверить|Отправить ответ)$/,
      exact: true,
    }),
  ).toBeDisabled()
  await page.getByLabel('Ваша запись Speaking').selectOption('owned-audio')
  await expect(
    page.getByText('Выбрана ваша отправленная работа с аудиозаписью.'),
  ).toBeVisible()
  await page
    .getByRole('button', { name: /^(Проверить|Отправить ответ)$/, exact: true })
    .click()
  await expect(
    page.getByText('Ответ сохранён, не проверен', { exact: true }),
  ).toBeVisible()
  expect(
    api.calls.find((c) => c.path.endsWith('/submit'))!.body.audioAttemptId,
  ).toBe('owned-audio')
  api.verify()
})
test('Listening audio uses authorized API media; script draft never claims audio evidence', async ({
  page,
}) => {
  const data = learningFixture()
  const audio = {
    ...drillFixture(),
    id: 'listening-audio',
    section: 'listening' as const,
    modality: 'audio' as const,
    audioUrl: '/listening/media/owned-listening',
    editorialStatus: 'draft' as const,
    masteryEligible: false,
  }
  const script = {
    ...audio,
    id: 'listening-script',
    modality: 'script' as const,
    audioUrl: null,
  }
  data.drills.push(audio, script)
  const api = await setup(page, data)
  await page.goto('plan/learning/drills/listening-audio')
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await expect(page.locator('audio')).toHaveAttribute('src', /^blob:/)
  await page.goto('plan/learning/drills/listening-script')
  await page
    .getByText('Подробнее о проверке и источниках', { exact: true })
    .click()
  await expect(
    page.getByText(
      'Аудио отсутствует. Это чтение сценария, практика, не свидетельство Listening.',
    ),
  ).toBeVisible()
  await expect(page.locator('audio')).toHaveCount(0)
  api.verify()
})
test('exam day is read-only for cycles, drill and calendar', async ({
  page,
}) => {
  const data = learningFixture()
  data.readOnly = true
  data.examDate = data.today
  const api = await setup(page, data)
  await openCycle(page)
  await expect(
    page.getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Отметить: разбор просмотрен' }),
  ).toHaveCount(0)
  await page.goto('plan/learning/drills/drill-reading')
  await expect(
    page.getByRole('button', { name: 'Начать', exact: true }),
  ).toHaveCount(0)
  await page.goto('plan')
  await expect(
    page.getByText('День экзамена и после него — только просмотр.'),
  ).toBeVisible()
  expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(0)
  api.verify()
})
test('DRILL plan assignment opens learning start API, never ordinary attempt start', async ({
  page,
}) => {
  const api = await setup(page)
  api.plan.plan!.days.find((d) => d.date === api.data.today)!.assignments = [
    {
      id: 'assignment-drill',
      kind: 'DRILL',
      skill: 'reading',
      title: 'Focused reading drill',
      reason: 'New source family after correction',
      durationMinutes: 8,
      status: 'PLANNED',
      materialId: null,
      attemptId: null,
      sourceAttemptId: null,
      drillId: 'drill-reading',
      sessionId: null,
      target: '/study-plan/learning/drills/drill-reading',
      skipReason: null,
      completedAt: null,
    },
  ]
  await page.goto('plan')
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await expect(
    page.getByRole('button', {
      name: /^(Проверить|Отправить ответ)$/,
      exact: true,
    }),
  ).toBeVisible()
  expect(
    api.calls.find((c) => c.path.endsWith('/start'))!.body.assignmentId,
  ).toBe('assignment-drill')
  api.verify()
})
test('auth A to B cannot show A draft or delayed GET and mutation results', async ({
  page,
}) => {
  const api = await setup(page)
  await openCycle(page)
  await fillCorrection(page)
  const pending = api.hold('/correction')
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await pending.reached
  api.identity('student-b')
  api.data.cycles = [cycleFixture()]
  api.data.cycles[0].source.originalAnswer = 'B original'
  await switchIdentity(page, 'student-b')
  await expect(page.getByTestId('original-answer')).toHaveText('B original')
  await expect(page.getByLabel('Объяснение', { exact: true })).toHaveValue('')
  pending.release()
  await expect(page.getByTestId('original-answer')).toHaveText('B original')
  await expect(page.getByText('Совпало с ключом', { exact: true })).toHaveCount(
    0,
  )
  await page
    .getByText('Подробнее о проверке и источниках', { exact: true })
    .click()
  const delayed = api.hold('/cycles/cycle-reading')
  await page
    .getByRole('button', { name: 'Обновить разбор', exact: true })
    .click()
  await delayed.reached
  api.identity('student-c')
  api.data.cycles[0].source.originalAnswer = 'C original'
  await switchIdentity(page, 'student-c')
  delayed.release()
  await expect(page.getByTestId('original-answer')).toHaveText('C original')
  api.verify()
})
test('360 mobile list and cycle; 728 dark draft; desktop event views screenshots', async ({
  page,
}, info) => {
  const data = learningFixture()
  const fullMaterial = Array(50)
    .fill(data.cycles[0].source.stimulus)
    .join('\n\n')
  data.cycles[0].source.stimulus = `${fullMaterial}\n{"quote":"technical-evidence-tail"}`
  data.cycles.push(cycleFixture('cycle-writing', 'writing'))
  const api = await setup(page, data)
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('plan/learning')
  await expect(
    page
      .getByRole('main')
      .getByRole('heading', { name: 'Работа над ошибками', exact: true }),
  ).toBeVisible()
  await expect(page.getByTestId('learning-cycle-row')).toHaveCount(2)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({
    path: info.outputPath('learning-mobile-360.png'),
    fullPage: true,
  })
  await openCycle(page)
  const materialToggle = page.getByText('Подробнее о проверке и источниках', {
    exact: true,
  })
  await expect(page.getByTestId('learning-stimulus')).not.toBeVisible()
  expect(
    await materialToggle
      .locator('..')
      .locator('..')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true)
  await materialToggle.click()
  await expect(page.getByTestId('learning-stimulus')).toHaveText(fullMaterial)
  await expect(page.getByTestId('learning-stimulus')).not.toContainText(
    'technical-evidence-tail',
  )
  expect(api.data.cycles[0].source.stimulus).toContain(
    'technical-evidence-tail',
  )
  await expect(page.getByTestId('learning-stimulus')).toBeVisible()
  await materialToggle.click()
  const correctionTop = await page
    .getByRole('group', { name: 'Ваш исправленный ответ', exact: true })
    .evaluate((element) => element.getBoundingClientRect().top + scrollY)
  expect(correctionTop).toBeLessThan(1000)
  await expect(
    page.getByRole('link', { name: '2 Правка', exact: true }),
  ).toHaveAttribute('href', '#cycle-correction')
  await fillCorrection(page)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({
    path: info.outputPath('cycle-mobile-360.png'),
    fullPage: true,
  })
  await page.setViewportSize({ width: 728, height: 1000 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('plan/learning/drills/drill-writing')
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await page
    .getByLabel('Ваш ответ', { exact: true })
    .fill('Overall, the North grew more quickly than the South.')
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({
    path: info.outputPath('draft-728-dark.png'),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('plan?view=week')
  await expect(
    page.getByRole('heading', { name: 'Обзор недели', exact: true }),
  ).toBeVisible()
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({
    path: info.outputPath('week-retrospective.png'),
    fullPage: true,
  })
  await page.goto('progress')
  await expect(
    page
      .getByRole('main')
      .getByRole('heading', { name: 'Работа над ошибками', exact: true }),
  ).toBeVisible()
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({
    path: info.outputPath('learning-progress.png'),
    fullPage: true,
  })
  api.verify()
})
test('404 and malformed learning DTO show errors instead of crashing', async ({
  page,
}) => {
  const api = await setup(page)
  await page.goto('plan/learning/cycles/foreign-cycle')
  await expect(page.getByRole('alert')).toContainText('не найдены')
  await page.route('**/api/v1/study-plan/learning', (route) =>
    route.fulfill({ json: { items: [] } }),
  )
  await page.goto('plan/learning')
  await expect(page.getByRole('alert')).toBeVisible()
  expect(api.errors).toEqual([])
  expect(api.unexpected).toEqual([])
})

test('network failure retries correction with the same intent key', async ({
  page,
}) => {
  const api = await setup(page)
  api.fail('/correction', 0)
  await openCycle(page)
  await fillCorrection(page)
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(page.getByRole('alert')).toContainText('Сервер недоступен')
  await page.getByRole('button', { name: 'Отправить снова' }).click()
  await expect(
    page.getByText('Совпало с ключом', { exact: true }),
  ).toBeVisible()
  const calls = api.calls.filter((c) => c.path.endsWith('/correction'))
  expect(calls[0].body.idempotencyKey).toBe(calls[1].body.idempotencyKey)
  api.verify()
})

test('drill start 409 refreshes Learning revision and reuses start key after reload', async ({
  page,
}) => {
  const api = await setup(page)
  api.fail('/start', 409)
  await page.goto('plan/learning/drills/drill-writing')
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Данные изменились')
  await page.reload()
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await expect(page.getByLabel('Ваш ответ', { exact: true })).toBeVisible()
  const calls = api.calls.filter((c) => c.path.endsWith('/start'))
  expect(calls[0].body.idempotencyKey).toBe(calls[1].body.idempotencyKey)
  expect(calls[0].body.expectedRevision).toBe(4)
  expect(calls[1].body.expectedRevision).toBe(5)
  api.verify()
})

test('session submit 409 keeps short text and assistance choice', async ({
  page,
}) => {
  const api = await setup(page)
  api.fail('/submit', 409)
  await page.goto('plan/learning/drills/drill-writing')
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await page
    .getByLabel('Ваш ответ', { exact: true })
    .fill('Overall, the North grew faster while South remained more stable.')
  await page
    .getByRole('radio', { name: 'Сам, без подсказок', exact: true })
    .check()
  await page
    .getByRole('button', { name: /^(Проверить|Отправить ответ)$/, exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('Данные изменились')
  await expect(page.getByLabel('Ваш ответ', { exact: true })).toHaveValue(
    'Overall, the North grew faster while South remained more stable.',
  )
  await expect(
    page.getByRole('radio', { name: 'Сам, без подсказок', exact: true }),
  ).toBeChecked()
  await page.getByRole('button', { name: 'Отправить снова' }).click()
  await expect(
    page.getByText('Ответ сохранён, не проверен', { exact: true }),
  ).toBeVisible()
  const calls = api.calls.filter((c) => c.path.endsWith('/submit'))
  expect(calls[0].body.idempotencyKey).toBe(calls[1].body.idempotencyKey)
  api.verify()
})

test('skip asks confirmation and persists a separate historical cycle', async ({
  page,
}) => {
  const api = await setup(page)
  await openCycle(page)
  await page
    .getByRole('button', { name: 'Отложить эту ошибку', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toContainText(
    'Цикл сохранится в истории',
  )
  await page.getByRole('button', { name: 'Отложить', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByText('Отложено вами. Цикл сохранён в истории.'),
  ).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    }),
  ).toHaveCount(0)
  expect(api.data.cycles).toHaveLength(1)
  expect(api.data.cycles[0].source.originalAnswer).toBe('TRUE')
  api.verify()
})

test('only two source-grounded priorities; draft-only Reading has no remaining-check counter', async ({
  page,
}) => {
  const data = learningFixture()
  data.cycles.push(cycleFixture('second'), cycleFixture('third'))
  data.drills[0].masteryEligible = false
  data.drills[0].editorialStatus = 'draft'
  data.inventory.sections[0].reviewedDrills = 0
  const api = await setup(page, data)
  await page.goto('plan/learning')
  await expect(page.getByTestId('learning-cycle-row')).toHaveCount(2)
  await expect(page.getByText(/По правилу практики осталось/)).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Показать ещё 1', exact: true })
    .click()
  await expect(page.getByTestId('learning-cycle-row')).toHaveCount(3)
  await page
    .getByTestId('learning-cycle-row')
    .first()
    .locator('summary')
    .first()
    .click()
  await expect(
    page.getByText(data.cycles[0].source.feedback, { exact: false }).first(),
  ).toBeVisible()
  api.verify()
})

test('untrusted markup stays plain text; external audio is never fetched', async ({
  page,
}) => {
  const data = learningFixture()
  const drill = drillFixture('listening')
  drill.modality = 'audio'
  drill.audioUrl = 'https://attacker.invalid/private.mp3'
  drill.stimulus =
    '<svg onload="window.learningInjected=true"><script>window.learningInjected=true</script></svg>'
  data.drills.push(drill)
  const foreign: string[] = []
  await page.route('https://attacker.invalid/**', async (route) => {
    foreign.push(route.request().url())
    await route.abort()
  })
  const api = await setup(page, data)
  await page.goto('plan/learning/drills/drill-listening')
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await expect(page.getByTestId('learning-stimulus')).toContainText(
    '<svg onload=',
  )
  await expect(
    page.getByText(
      'Аудио недоступно или не воспроизводится. Ответ нельзя отправить, пока запись не загрузится.',
    ),
  ).toBeVisible()
  expect(await page.evaluate(() => 'learningInjected' in window)).toBe(false)
  expect(foreign).toEqual([])
  api.verify()
})

test('short-drill mistake source opens learning session instead of an attempt', async ({
  page,
}) => {
  const data = learningFixture()
  const source = data.cycles[0].source
  source.attemptId = ''
  source.sessionId = 'source-learning-session'
  source.drillId = 'drill-reading'
  source.materialId = 'drill-reading'
  const api = await setup(page, data)
  const session = sessionFixture(drillFixture(), 'source-learning-session')
  session.status = 'submitted'
  session.text = 'FALSE'
  session.verdict = 'incorrect'
  session.cycleId = null
  api.sessions.set(session.id, session)
  await openCycle(page)
  await page
    .getByText('Подробнее о проверке и источниках', { exact: true })
    .click()
  const link = page.getByRole('link', {
    name: 'Открыть разбор работы',
    exact: true,
  })
  await expect(link).toHaveAttribute(
    'href',
    /\/plan\/learning\/drills\/drill-reading\?session=source-learning-session/,
  )
  await link.click()
  await expect(
    page.getByText('Ответ не совпал с ключом', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Ваш сохранённый ответ', exact: true }),
  ).toBeVisible()
  api.verify()
})

test('unknown source family suppresses counters even with reviewed inventory', async ({
  page,
}) => {
  const data = learningFixture()
  data.cycles[0].source.familyKnown = false
  data.cycles[0].source.familyId = null
  const api = await setup(page, data)
  await page.goto('plan/learning')
  await page
    .getByTestId('learning-cycle-row')
    .first()
    .locator('summary')
    .first()
    .click()
  await expect(page.getByText(/По правилу практики осталось/)).toHaveCount(0)
  await expect(
    page.getByText(
      'Семейство исходной работы не размечено. Независимость нового задания нельзя подтвердить; ответы сохраняются как практика.',
    ),
  ).toBeVisible()
  await openCycle(page)
  await page
    .getByText('Подробнее о проверке и источниках', { exact: true })
    .click()
  await expect(page.getByText(/По правилу практики осталось/)).toHaveCount(0)
  await expect(
    page.getByText(
      'Семейство исходной работы не размечено. Независимость нового задания нельзя подтвердить; ответы сохраняются как практика.',
    ),
  ).toBeVisible()
  api.verify()
})

test('same-skill cycles keep their own question feedback instead of profile rationale', async ({
  page,
}) => {
  const data = learningFixture()
  const first = data.cycles[0]
  first.source.prompt = 'Green roofs reduced stormwater runoff.'
  first.source.feedback =
    'The source explicitly describes reduced stormwater runoff.'
  const second = cycleFixture('cycle-tax-discounts')
  second.source.questionId = 'question-tax'
  second.source.prompt = 'Every owner received tax discounts.'
  second.source.feedback =
    'Only participating owners received tax discounts; every is too broad.'
  data.cycles.push(second)
  data.profiles[0].rationale =
    'Aggregate profile explanation must not replace either question feedback.'
  const api = await setup(page, data)
  await page.goto('plan/learning')
  const firstRow = page
    .getByTestId('learning-cycle-row')
    .filter({ hasText: first.source.prompt })
  const secondRow = page
    .getByTestId('learning-cycle-row')
    .filter({ hasText: second.source.prompt })
  await firstRow.locator('summary').first().click()
  await secondRow.locator('summary').first().click()
  await expect(firstRow).toContainText(`Почему: ${first.source.feedback}`)
  await expect(firstRow).not.toContainText(second.source.feedback)
  await expect(secondRow).toContainText(`Почему: ${second.source.feedback}`)
  await expect(secondRow).not.toContainText(first.source.feedback)
  await expect(firstRow).not.toContainText(data.profiles[0].rationale)
  await expect(secondRow).not.toContainText(data.profiles[0].rationale)
  api.verify()
})

test('earliest delayed eligibility is not a scheduled appointment; saved date has one punctuation mark', async ({
  page,
}) => {
  const data = learningFixture()
  const cycle = data.cycles[0]
  cycle.nextCheckDate = '2026-10-27'
  cycle.status = 'awaiting-transfer'
  cycle.correction = {
    text: 'FALSE',
    explanation: 'The first sentence contradicts the claim.',
    assisted: false,
    savedAt: stamp,
    verdict: 'correct',
    feedback: 'Saved correction checked against immutable key.',
  }
  const api = await setup(page, data)
  await openCycle(page)
  await expect(
    page.getByText('Отложенная проверка — не раньше 27 окт.'),
  ).toBeVisible()
  await expect(page.getByText(/Проверка назначена на/)).toHaveCount(0)
  const saved = page.getByText(/Сохранено 24 окт/)
  await expect(saved).toContainText('Сохранено 24 окт.')
  await expect(saved).not.toContainText('..')
  const day = api.plan.plan!.days.find((d) => d.date === '2026-10-28')!
  day.assignments = [
    {
      id: 'scheduled-reading-check',
      cycleId: cycle.id,
      kind: 'DRILL',
      skill: 'reading',
      title: 'Scheduled new-family check',
      reason: 'Delayed check on another source',
      durationMinutes: 8,
      status: 'PLANNED',
      materialId: null,
      attemptId: null,
      sourceAttemptId: null,
      drillId: 'drill-reading',
      sessionId: null,
      target: '/study-plan/learning/drills/drill-reading',
      skipReason: null,
      completedAt: null,
    },
  ]
  day.assignments[0].cycleId = undefined
  await page.reload()
  await expect(page.getByText(/Проверка назначена на/)).toHaveCount(0)
  await expect(
    page.getByText('Отложенная проверка — не раньше 27 окт.'),
  ).toBeVisible()
  day.assignments[0].cycleId = 'another-cycle'
  await page.reload()
  await expect(page.getByText(/Проверка назначена на/)).toHaveCount(0)
  day.assignments[0].cycleId = cycle.id
  day.assignments[0].status = 'COMPLETED'
  await page.reload()
  await expect(page.getByText(/Проверка назначена на/)).toHaveCount(0)
  day.assignments[0].status = 'PLANNED'
  await page.reload()
  await expect(page.getByText('Проверка назначена на 28 окт.')).toBeVisible()
  await expect(
    page.getByText('Проверка откроется в день назначения.'),
  ).toBeVisible()
  await expect(
    page.getByRole('link', {
      name: 'Следующая тренировка этого навыка',
      exact: true,
    }),
  ).toHaveCount(0)
  await expect(page.getByText(/Отложенная проверка — не раньше/)).toHaveCount(0)
  api.verify()
})

test('awaiting-transfer action calls draft or unknown-family candidate practice, reviewed eligible candidate a check', async ({
  page,
}) => {
  const data = learningFixture()
  const cycle = data.cycles[0]
  cycle.status = 'awaiting-transfer'
  cycle.correction = {
    text: 'FALSE',
    explanation: 'The text contradicts all.',
    assisted: false,
    savedAt: stamp,
    verdict: 'correct',
    feedback: 'Saved.',
  }
  data.drills[0].masteryEligible = false
  data.drills[0].editorialStatus = 'draft'
  const api = await setup(page, data)
  await page.goto('plan/learning')
  await expect(
    page.getByRole('link', { name: 'Начать тренировку', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Начать проверку', exact: true }),
  ).toHaveCount(0)
  data.drills[0].masteryEligible = true
  data.drills[0].editorialStatus = 'reviewed'
  cycle.source.familyKnown = false
  cycle.source.familyId = null
  await page.reload()
  await expect(
    page.getByRole('link', { name: 'Начать тренировку', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Начать проверку', exact: true }),
  ).toHaveCount(0)
  cycle.source.familyKnown = true
  cycle.source.familyId = 'source-family'
  await page.reload()
  await expect(
    page.getByRole('link', { name: 'Начать проверку', exact: true }),
  ).toBeVisible()
  api.verify()
})

test('a bound plan assignment starts the drill for its cycle and preserves both contexts on read-only links', async ({
  page,
}) => {
  const api = await setup(page)
  const cycle = api.data.cycles[0]
  cycle.status = 'awaiting-transfer'
  cycle.correction = {
    text: 'FALSE',
    explanation: 'The source contradicts all.',
    assisted: false,
    savedAt: stamp,
    verdict: 'correct',
    feedback: 'Saved.',
  }
  const assignment = {
    id: 'bound-plan-check',
    kind: 'DRILL' as const,
    skill: 'reading' as const,
    title: 'Bound independent check',
    reason: 'New family for this correction cycle',
    durationMinutes: 8,
    status: 'PLANNED' as const,
    materialId: null,
    attemptId: null,
    sourceAttemptId: null,
    drillId: 'drill-reading',
    cycleId: cycle.id,
    sessionId: null as string | null,
    target: '/study-plan/learning/drills/drill-reading',
    skipReason: null,
    completedAt: null,
  }
  api.plan.plan!.days.find((day) => day.date === api.data.today)!.assignments =
    [assignment]
  await page.goto('plan')
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await expect(page).toHaveURL(/cycle=cycle-reading/)
  await expect(page).toHaveURL(/assignment=bound-plan-check/)
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await page.getByRole('radio', { name: 'TRUE', exact: true }).check()
  await page
    .getByRole('radio', { name: 'Сам, без подсказок', exact: true })
    .check()
  await page
    .getByRole('button', { name: /^(Проверить|Отправить ответ)$/, exact: true })
    .click()
  await expect(
    page.getByText('Засчитано как независимая проверка.', { exact: true }),
  ).toBeVisible()
  const start = api.calls.find((call) => call.path.endsWith('/start'))!
  expect(start.body.cycleId).toBe(cycle.id)
  expect(start.body.assignmentId).toBe(assignment.id)
  expect(cycle.checks[0].independent).toBe(true)
  assignment.sessionId = [...api.sessions.keys()][0]
  api.data.readOnly = true
  await page.goto('plan')
  const viewLink = page.getByRole('link', {
    name: 'Посмотреть тренировку',
    exact: true,
  })
  await expect(viewLink).toHaveAttribute('href', /cycle=cycle-reading/)
  await expect(viewLink).toHaveAttribute('href', /assignment=bound-plan-check/)
  await expect(viewLink).toHaveAttribute(
    'href',
    /session=session-drill-reading/,
  )
  await viewLink.click()
  await expect(
    page.getByText('Ваш сохранённый ответ', { exact: true }),
  ).toBeVisible()
  expect(api.calls.filter((call) => call.path.endsWith('/start'))).toHaveLength(
    1,
  )
  api.verify()
})

test('a correct assisted correction can be tried independently only through a fresh answer submission', async ({
  page,
}) => {
  const api = await setup(page)
  await openCycle(page)
  await page.getByRole('radio', { name: 'FALSE', exact: true }).check()
  await page
    .getByLabel('Объяснение', { exact: true })
    .fill('I used the feedback to locate the contradiction.')
  await page
    .getByRole('radio', {
      name: 'С подсказкой, разбором или чужим текстом',
      exact: true,
    })
    .check()
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await page
    .getByRole('button', { name: 'Попробовать самостоятельно', exact: true })
    .click()
  await expect(
    page.getByRole('radio', { name: 'FALSE', exact: true }),
  ).not.toBeChecked()
  await expect(page.getByLabel('Объяснение', { exact: true })).toHaveValue('')
  await expect(
    page.getByRole('radio', { name: 'Сам, без подсказок', exact: true }),
  ).not.toBeChecked()
  await expect(
    page.getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    }),
  ).toBeDisabled()
  expect(
    api.calls.filter((call) => call.path.endsWith('/correction')),
  ).toHaveLength(1)
  await page
    .getByText('Подробнее о проверке и источниках', { exact: true })
    .click()
  await expect(
    page.getByText('Для правила нужны новые независимые проверки;', {
      exact: false,
    }),
  ).toBeVisible()
  await fillCorrection(page)
  await page
    .getByRole('button', {
      name: /^(Проверить|Сохранить правку)$/,
      exact: true,
    })
    .click()
  await expect(
    page.getByRole('button', {
      name: 'Попробовать самостоятельно',
      exact: true,
    }),
  ).toHaveCount(0)
  const corrections = api.calls.filter((call) =>
    call.path.endsWith('/correction'),
  )
  expect(corrections).toHaveLength(2)
  expect(corrections[1].body.idempotencyKey).not.toBe(
    corrections[0].body.idempotencyKey,
  )
  expect(corrections[1].body.expectedRevision).toBe(2)
  expect(corrections[1].body.assisted).toBe(false)
  expect(api.data.cycles[0].remainingChecks).toBe(2)
  expect(api.data.cycles[0].checks).toEqual([])
  await expect(page.getByTestId('original-answer')).toHaveText('TRUE')
  await page.reload()
  await expect(
    page.getByText('Совпало с ключом', { exact: true }),
  ).toBeVisible()
  api.verify()
})

test('free start of an eligible catalog drill needs explicit confirmation, with cancellation focused by default', async ({
  page,
}) => {
  const api = await setup(page)
  await page.goto('plan/learning/drills/drill-reading')
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText(
    'Эта работа может понадобиться для независимой проверки. После просмотра/начала семейство перестанет считаться новым.',
  )
  await expect(
    dialog.getByRole('button', { name: 'Отмена', exact: true }),
  ).toBeFocused()
  expect(api.calls.filter((call) => call.path.endsWith('/start'))).toHaveLength(
    0,
  )
  await dialog.getByRole('button', { name: 'Отмена', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(api.calls.filter((call) => call.path.endsWith('/start'))).toHaveLength(
    0,
  )
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await dialog
    .getByRole('button', { name: 'Начать свободную практику', exact: true })
    .click()
  await expect(
    page.getByRole('button', {
      name: /^(Проверить|Отправить ответ)$/,
      exact: true,
    }),
  ).toBeVisible()
  const start = api.calls.find((call) => call.path.endsWith('/start'))!
  expect(start.body.cycleId).toBeUndefined()
  expect(start.body.assignmentId).toBeUndefined()
  await page.reload()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  expect(api.calls.filter((call) => call.path.endsWith('/start'))).toHaveLength(
    1,
  )
  api.verify()
})

test('completed practice rule hides stale future check dates and actions, and micro-skill labels stay readable', async ({
  page,
}) => {
  const api = await setup(page)
  const cycle = api.data.cycles[0]
  cycle.status = 'demonstrated'
  cycle.remainingChecks = 0
  cycle.nextCheckDate = '2026-10-27'
  cycle.source.questionType = 'ms-r-tfng'
  await openCycle(page)
  await page
    .getByText('Подробнее о проверке и источниках', { exact: true })
    .click()
  await expect(page.getByText('Правило практики выполнено.')).toBeVisible()
  await expect(
    page.getByText('Новые проверки по этому циклу не требуются.'),
  ).toBeVisible()
  await expect(
    page.getByText(/Отложенная проверка — не раньше|Проверка назначена на/),
  ).toHaveCount(0)
  await expect(
    page.getByRole('link', {
      name: 'Следующая тренировка этого навыка',
      exact: true,
    }),
  ).toHaveCount(0)
  await expect(page.getByText('ms-r-tfng', { exact: false })).toHaveCount(0)
  await expect(
    page.getByRole('heading', {
      name: 'Reading · Доказательства True / False / Not Given',
    }),
  ).toBeVisible()
  await page.goto('plan/learning')
  await page
    .getByTestId('learning-cycle-row')
    .first()
    .locator('summary')
    .first()
    .click()
  await expect(page.getByText('Правило практики выполнено.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Начать проверку', exact: true }),
  ).toHaveCount(0)
  api.verify()
})

test('daily activity keeps short drills, corrections and independent checks separate across reload without invented active time', async ({
  page,
}) => {
  const api = await setup(page)
  api.plan.progress = [
    {
      date: api.data.today,
      completedAttempts: 0,
      reviewedAssignments: 1,
      drillsCompleted: 2,
      correctionsSaved: 3,
      independentChecksPassed: 1,
      skippedAssignments: 0,
      plannedMinutes: 40,
      activeMinutes: null,
    },
  ]
  await page.goto('progress')
  const activity = page.getByRole('region', { name: 'Активность по дням' })
  const details = activity.locator('[aria-live]')
  const verifyDetails = async () => {
    await expect(
      details
        .locator('dl')
        .locator('div')
        .filter({ hasText: 'Выполнено' })
        .locator('dd'),
    ).toHaveText('0')
    await expect(
      details
        .locator('dl')
        .locator('div')
        .filter({ hasText: 'Правки' })
        .locator('dd'),
    ).toHaveText('3')
    await expect(
      details
        .locator('dl')
        .locator('div')
        .filter({ hasText: 'Новые проверки' })
        .locator('dd'),
    ).toHaveText('1')
    await expect(
      details
        .locator('dl')
        .locator('div')
        .filter({ hasText: 'Пропущено' })
        .locator('dd'),
    ).toHaveText('0')
  }
  await verifyDetails()
  await expect(
    activity.getByText('Сданных работ и просмотренных разборов пока нет.', {
      exact: true,
    }),
  ).toHaveCount(0)
  await page.reload()
  await verifyDetails()
  await expect(
    page.getByRole('heading', { name: 'Минут за 7 дней' }).locator('..'),
  ).toContainText('Нет замера за 7 из 7 дней')
  await expect(activity.getByText(/Активное время: \d/)).toHaveCount(0)
  expect(api.calls.filter((call) => call.method === 'POST')).toHaveLength(0)
  await page.goto('plan?view=week')
  const week = page.getByRole('region', { name: 'Итог недели' })
  await expect(
    week.getByText('Коротких тренировок сохранено: 2', { exact: true }),
  ).toBeVisible()
  await expect(
    week.getByText('Правок сохранено: 3', { exact: false }),
  ).toBeVisible()
  api.verify()
})

test('Listening decode failure blocks submission; a valid WAV retry unlocks it and a later media error blocks it again', async ({
  page,
}) => {
  const data = learningFixture()
  data.drills.push({
    ...drillFixture(),
    id: 'listening-decode',
    skillId: 'ms-l-numspelling',
    section: 'listening',
    modality: 'audio',
    editorialStatus: 'draft',
    masteryEligible: false,
    task: 'What is the number of the room?',
    stimulus: 'Room number: ____',
    audioUrl: '/listening/media/owned-listening',
  })
  const api = await setup(page, data)
  let brokenMedia = true
  await page.route('**/api/v1/listening/media/owned-listening', (route) =>
    route.fulfill({
      contentType: 'audio/wav',
      body: brokenMedia ? Buffer.from('not-decodable-audio') : tinyWav(),
    }),
  )
  await page.goto('plan/learning/drills/listening-decode')
  await page.getByRole('button', { name: 'Начать', exact: true }).click()
  await page.getByLabel('Ваш ответ', { exact: true }).fill('14')
  await page
    .getByRole('radio', { name: 'Сам, без подсказок', exact: true })
    .check()
  const submit = page.getByRole('button', {
    name: /^(Проверить|Отправить ответ)$/,
    exact: true,
  })
  await expect(page.getByRole('alert')).toContainText(
    'Аудио недоступно или не воспроизводится',
  )
  await expect(submit).toBeDisabled()
  expect(
    api.calls.filter((call) => call.path.endsWith('/submit')),
  ).toHaveLength(0)
  brokenMedia = false
  await page
    .getByRole('button', { name: 'Загрузить аудио снова', exact: true })
    .click()
  await expect(submit).toBeEnabled()
  expect(
    await page
      .locator('audio')
      .evaluate((audio) =>
        audio instanceof HTMLMediaElement ? audio.readyState : 0,
      ),
  ).toBeGreaterThanOrEqual(3)
  await page.locator('audio').dispatchEvent('error')
  await expect(page.getByRole('alert')).toContainText(
    'Аудио недоступно или не воспроизводится',
  )
  await expect(submit).toBeDisabled()
  await expect(page.getByLabel('Ваш ответ', { exact: true })).toHaveValue('14')
  expect(
    api.calls.filter((call) => call.path.endsWith('/submit')),
  ).toHaveLength(0)
  api.verify()
})

test('a cycle without an own correction directs to correction instead of an unusable next drill', async ({
  page,
}) => {
  const data = learningFixture()
  data.cycles[0].correction = null
  data.cycles[0].status = 'needs-practice'
  const api = await setup(page, data)
  await openCycle(page)
  await expect(
    page.getByText('Сначала сохраните собственную правку исходной ошибки.'),
  ).toBeVisible()
  await expect(
    page.getByRole('link', {
      name: 'Следующая тренировка этого навыка',
      exact: true,
    }),
  ).toHaveCount(0)
  expect(api.calls.some((c) => c.path.endsWith('/start'))).toBe(false)
  api.verify()
})
