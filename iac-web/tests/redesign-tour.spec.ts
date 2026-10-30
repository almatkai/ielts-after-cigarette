// Browser captures of the current UI. All domain responses are saved API REPLAY,
// never live API. Auth/empty ancillary lists and admin are synthetic test fixtures.
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve('artifact/feature-tour-2026-10-24')
const qa = resolve('artifact/redesign-qa')
// The tour is a local replay tool; ordinary CI must not depend on ignored artifacts.
const replayInputs = [
  'artifact/academic-live/final-r3-learning-responses.json',
  'artifact/academic-live/final-r4-plan-response.json',
  'artifact/task-performance-live/learning-response.json',
  'tests/fixtures/study-plan-live-mock-response.json',
]
const replayAvailable = replayInputs.every((path) => existsSync(path))
test.skip(
  !replayAvailable,
  'Requires locally captured API replay inputs; see artifact/feature-tour-2026-10-24/REPRODUCE.md',
)
const read = (path: string) =>
  existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
const recordings = replayAvailable ? read(replayInputs[0]) : []
const plan = read('artifact/academic-live/final-r4-plan-response.json')
const mockPlan = read('tests/fixtures/study-plan-live-mock-response.json')
const taskLearning = read(
  'artifact/task-performance-live/learning-response.json',
)
const body = (index: number) =>
  replayAvailable
    ? recordings[index].body
    : { id: 'replay-required', drill: { id: 'replay-required' } }
const lastLearning = body(116)
const replayFile = 'artifact/academic-live/final-r3-learning-responses.json'

type Shot = {
  file: string
  path: string
  width?: number
  full?: boolean
  record?: number
  task?: boolean
  mock?: boolean
  action?: string
  focus?: string
  source?: string
}
const cycle = (index: number) => `plan/learning/cycles/${body(index).id}`
const session = (index: number) => {
  const s = body(index)
  return `plan/learning/drills/${s.drill.id}?session=${s.id}${s.cycleId ? `&cycle=${s.cycleId}` : ''}${s.assignmentId ? `&assignment=${s.assignmentId}` : ''}`
}
const shots: Shot[] = [
  { file: '01-plan-day-desktop.png', path: 'plan?view=day' },
  { file: '01-plan-next-desktop.png', path: 'plan?view=day', mock: true },
  {
    file: '01-plan-next-mobile.png',
    path: 'plan?view=day',
    mock: true,
    width: 360,
  },
  { file: '02-plan-week-full.png', path: 'plan?view=week', full: true },
  { file: '02-plan-week-desktop.png', path: 'plan?view=week' },
  { file: '02-plan-week-mobile.png', path: 'plan?view=week', width: 360 },
  { file: '03-plan-month-full.png', path: 'plan?view=month', full: true },
  { file: '03-plan-month-desktop.png', path: 'plan?view=month' },
  { file: '04-plan-settings-desktop.png', path: 'plan', action: 'settings' },
  {
    file: '06-weekly-mock-desktop.png',
    path: 'plan?view=week&date=2026-10-25',
    mock: true,
    focus: 'Длинное окно · Full Mock · 165 мин',
  },
  {
    file: '06-weekly-mock-day.png',
    path: 'plan?view=day&date=2026-10-25',
    mock: true,
  },
  { file: '07-types-desktop.png', path: 'plan/learning', task: true },
  {
    file: '07-types-mobile.png',
    path: 'plan/learning',
    task: true,
    width: 360,
  },
  {
    file: '08-types-sources-desktop.png',
    path: 'plan/learning',
    task: true,
    action: 'sources',
    focus: 'Источники и ограничения',
  },
  {
    file: '09-filtered-errors-desktop.png',
    path: 'plan/learning?section=reading&type=true_false_not_given',
    task: true,
    focus: 'Ждут правки',
  },
  {
    file: '10-own-correction-form.png',
    path: cycle(4),
    record: 4,
    focus: 'Ваша правка',
  },
  {
    file: '11-correction-wrong.png',
    path: cycle(6),
    record: 6,
    focus: 'Ваша правка',
  },
  {
    file: '12-correction-correct.png',
    path: cycle(8),
    record: 8,
    focus: 'Ваша правка',
  },
  {
    file: '13-calendar-bound.png',
    path: session(109),
    record: 109,
    width: 360,
    full: true,
  },
  {
    file: '13-calendar-submitted.png',
    path: session(111),
    record: 111,
    width: 360,
    full: true,
  },
  {
    file: '13-cycle-completed-full.png',
    path: cycle(113),
    record: 113,
    width: 360,
    full: true,
  },
  { file: '13-cycle-completed.png', path: cycle(113), record: 113 },
  {
    file: '14-writing-full.png',
    path: session(60),
    record: 60,
    width: 360,
    full: true,
  },
  { file: '14-writing-table.png', path: session(60), record: 60 },
  {
    file: '14-writing-own-answer.png',
    path: session(114),
    record: 114,
    focus: 'Ваш сохранённый ответ',
  },
  { file: '15-speaking-typed.png', path: session(67), record: 67 },
  { file: '16-speaking-audio.png', path: session(70), record: 70 },
  {
    file: '17-listening-feedback.png',
    path: session(87),
    record: 87,
    source:
      'Replay сохранённого API; аудиофайл не сохранён — показана реальная ошибка загрузки, без подмены записи.',
  },
  { file: '18-progress-summary.png', path: 'progress' },
  {
    file: '18-progress-daily-full.png',
    path: 'progress',
    width: 360,
    full: true,
  },
  { file: '18-progress-daily.png', path: 'progress', focus: 'По дням' },
  {
    file: '05-score-limits-desktop.png',
    path: 'plan',
    action: 'evidence',
    focus: 'Навыки',
  },
  {
    file: '20-editorial-full.png',
    path: 'admin/learning-content',
    action: 'admin',
    width: 360,
    full: true,
  },
  {
    file: '20-editorial-review.png',
    path: 'admin/learning-content',
    action: 'admin',
  },
  {
    file: '20-editorial-controls.png',
    path: 'admin/learning-content',
    action: 'admin',
    focus: 'Заметка редактора',
  },
  {
    file: '20-editorial-withdrawal.png',
    path: cycle(52),
    record: 52,
    focus: 'Проверка на новом задании',
  },
]

// Copied candidate from tests/learning-editorial.spec.ts, deliberately synthetic.
const editorialCandidate = {
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
}

async function installReplay(page: Page, shot: Shot) {
  const unexpected: string[] = [],
    pageerrors: string[] = [],
    requests: object[] = []
  const selected =
    shot.record === undefined ? undefined : recordings[shot.record]
  // Use the last complete learning response preceding the chosen captured detail.
  const learning = shot.task
    ? taskLearning
    : shot.record === undefined
      ? lastLearning
      : [...recordings.slice(0, shot.record + 1)]
          .reverse()
          .find((r) => new URL(r.url).pathname.endsWith('/learning'))!.body
  const study = shot.mock ? mockPlan : plan
  page.on('pageerror', (error) => pageerrors.push(error.message))
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname,
      method = request.method()
    const respond = (json: unknown, source: string, status = 200) => {
      requests.push({ method, path, status, source })
      return route.fulfill({ status, json })
    }
    if (path === '/api/v1/auth/refresh')
      return respond(
        {
          accessToken: 'replay-test-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'redesign-replay-user',
            role: shot.action === 'admin' ? 'ADMIN' : 'STUDENT',
            email: 'replay@example.test',
            displayName: 'Replay Student',
            timezone: 'Asia/Almaty',
            currentBand: null,
            targetBand: 7,
            examDate: null,
            examType: 'academic',
            permissions: [],
          },
        },
        'synthetic auth envelope',
      )
    if (path === '/api/v1/guest/session')
      return respond({ code: 'UNAUTHENTICATED' }, 'synthetic no guest', 401)
    if (path === '/api/v1/analytics/ping') return route.fulfill({ status: 204 })
    if (method === 'GET' && path === '/api/v1/study-plan')
      return respond(
        study,
        shot.mock
          ? 'tests/fixtures/study-plan-live-mock-response.json'
          : 'artifact/academic-live/final-r4-plan-response.json',
      )
    if (method === 'GET' && path === '/api/v1/study-plan/learning')
      return respond(
        learning,
        shot.task
          ? 'artifact/task-performance-live/learning-response.json'
          : replayFile,
      )
    if (method === 'GET' && selected && path === new URL(selected.url).pathname)
      return respond(selected.body, `${replayFile}#${shot.record}`)
    if (method === 'GET' && path === '/api/v1/admin/study-learning/content')
      return respond(
        {
          items: [editorialCandidate],
          limitations: ['Editorial admission is not an IELTS band.'],
        },
        'synthetic tests/learning-editorial.spec.ts candidate',
      )
    if (
      method === 'GET' &&
      path.startsWith('/api/v1/admin/study-learning/content/') &&
      path.endsWith('/history')
    )
      return respond({ items: [] }, 'synthetic empty editorial history')
    if (
      method === 'GET' &&
      ['/api/v1/attempts', '/api/v1/full-mock-sessions/active'].includes(path)
    )
      return respond(
        { items: [] },
        'synthetic empty ancillary list; domain cards use recorded API',
      )
    if (method === 'GET' && path.startsWith('/api/v1/listening/media/'))
      return respond(
        {
          code: 'REPLAY_MEDIA_NOT_SAVED',
          message: 'Audio binary was not saved with the API recording.',
        },
        'explicit missing recording, not synthetic audio',
        404,
      )
    unexpected.push(`${method} ${path}`)
    return respond({ code: 'UNEXPECTED_REPLAY_REQUEST' }, 'UNEXPECTED', 501)
  })
  return { unexpected, pageerrors, requests }
}

async function prepare(page: Page, shot: Shot) {
  await page.goto(shot.path)
  if (shot.path.startsWith('plan/learning/cycles/'))
    await expect(page.getByTestId('original-answer')).toBeVisible()
  else if (shot.path.startsWith('plan/learning/drills/'))
    await expect(
      page.getByRole('heading', {
        name: body(shot.record!).drill.title,
        exact: true,
      }),
    ).toBeVisible()
  else if (shot.path.startsWith('plan/learning'))
    await expect(
      page.getByRole('region', { name: 'Типы заданий', exact: true }),
    ).toBeVisible()
  else if (shot.path === 'progress')
    await expect(
      page.getByRole('region', { name: 'Сводка прогресса' }),
    ).toBeVisible()
  else if (shot.action !== 'admin')
    await expect(
      page.getByRole('radiogroup', { name: 'Период плана' }),
    ).toBeVisible()
  if (shot.file.startsWith('01-plan-next')) {
    await expect(
      page.getByText('Следующее · Reading', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Начать', exact: true }),
    ).toBeVisible()
  }
  if (shot.file === '01-plan-day-desktop.png') {
    await expect(
      page.getByText('На сегодня всё', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Завтрашний день' }),
    ).toBeVisible()
  }
  if (shot.action === 'settings') {
    await page.getByRole('button', { name: 'Меню плана' }).click()
    await page.getByRole('button', { name: 'Настройки', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Пн', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
  }
  if (shot.action === 'sources')
    await page.getByText('Источники и ограничения', { exact: true }).click()
  if (shot.action === 'evidence') {
    const details = page
      .locator('details')
      .filter({ has: page.locator('[aria-label="Учебные результаты"]') })
    await details.locator('summary').first().click()
    const calculation = details
      .locator('details')
      .filter({ has: page.locator('summary', { hasText: 'Как мы считаем' }) })
    const arrow = calculation.locator('summary > svg').first()
    await expect
      .poll(() =>
        arrow.evaluate((el) =>
          getComputedStyle(el).rotate === 'none'
            ? new DOMMatrixReadOnly(getComputedStyle(el).transform).a
            : Math.cos(
                (parseFloat(getComputedStyle(el).rotate) * Math.PI) / 180,
              ),
        ),
      )
      .toBe(1)
    await calculation.locator('summary').first().click()
    await expect
      .poll(() =>
        arrow.evaluate((el) =>
          getComputedStyle(el).rotate === 'none'
            ? new DOMMatrixReadOnly(getComputedStyle(el).transform).a
            : Math.cos(
                (parseFloat(getComputedStyle(el).rotate) * Math.PI) / 180,
              ),
        ),
      )
      .toBe(-1)
    await calculation.locator('summary').first().click()
    await expect
      .poll(() =>
        arrow.evaluate((el) =>
          getComputedStyle(el).rotate === 'none'
            ? new DOMMatrixReadOnly(getComputedStyle(el).transform).a
            : Math.cos(
                (parseFloat(getComputedStyle(el).rotate) * Math.PI) / 180,
              ),
        ),
      )
      .toBe(1)
  }
  if (shot.action === 'admin') {
    await page.getByRole('button', { name: /Ferry TFNG/ }).click()
    await expect(
      page.getByRole('heading', { name: 'Ferry TFNG', exact: true }),
    ).toBeVisible()
    await page
      .getByRole('textbox', { name: 'Заметка редактора', exact: true })
      .fill('The source, accepted key and family were checked independently.')
    for (const name of [
      /Ключи и объяснения/,
      /Семейство назначено/,
      /Источник и права/,
    ])
      await page.getByRole('checkbox', { name }).check()
  }
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await expect(
    page.getByText(
      /Загружаем (цикл|тренировку|работу над ошибками|свидетельства)/,
    ),
  ).toHaveCount(0)
}
async function focus(page: Page, shot: Shot) {
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    document.querySelector('main')?.scrollTo(0, 0)
  })
  if (!shot.full && shot.focus) {
    const target =
      shot.focus === 'Ждут правки'
        ? page.getByRole('heading', { name: /^Ждут правки \(\d+\)$/ })
        : shot.focus === 'Заметка редактора'
          ? page.getByRole('textbox', { name: shot.focus, exact: true })
          : page.getByRole('heading', { name: shot.focus, exact: true })
    const locator = (await target.count())
      ? target.first()
      : page.getByText(shot.focus, { exact: true }).first()
    // Fail explicitly if UI labels change; don't silently capture an unrelated area.
    await expect(locator).toBeVisible()
    await locator.evaluate((el) => {
      el.scrollIntoView({ block: 'start', behavior: 'instant' })
      // The app header stays sticky above either main or the document scroller.
      let ancestor = el.parentElement
      while (ancestor) {
        if (
          ancestor.scrollHeight > ancestor.clientHeight &&
          /auto|scroll/.test(getComputedStyle(ancestor).overflowY)
        ) {
          ancestor.scrollBy({ top: -80, behavior: 'instant' })
          return
        }
        ancestor = ancestor.parentElement
      }
      window.scrollBy({ top: -80, behavior: 'instant' })
    })
    await expect
      .poll(
        () => locator.evaluate((el) => el.getBoundingClientRect().top),
        'focused title clears sticky header',
      )
      .toBeGreaterThanOrEqual(80)
  }
}
async function dimensions(page: Page) {
  return page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: innerHeight,
    overflow: [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        const css = getComputedStyle(el)
        return (
          r.width > 0 &&
          css.position !== 'fixed' &&
          (r.right > innerWidth + 1 || r.left < -1) &&
          !el.closest('[data-radix-popper-content-wrapper]')
        )
      })
      .slice(0, 20)
      .map((el) => ({
        tag: el.tagName,
        text: el.textContent.slice(0, 80),
        class: el.className,
      })),
  }))
}

for (const shot of shots) {
  test(`replay tour: ${shot.file}`, async ({ page }) => {
    mkdirSync(root, { recursive: true })
    mkdirSync(qa, { recursive: true })
    await page.setViewportSize({ width: shot.width ?? 1280, height: 960 })
    const audit = await installReplay(page, shot)
    await prepare(page, shot)
    if (shot.full && (shot.width ?? 1280) === 1280) {
      const height = await page
        .locator('main')
        .evaluate((el) =>
          Math.ceil(el.scrollHeight + el.getBoundingClientRect().top + 32),
        )
      await page.setViewportSize({ width: 1280, height: Math.max(960, height) })
    }
    await focus(page, shot)
    const primary = await dimensions(page)
    await page.screenshot({
      path: resolve(root, shot.file),
      fullPage: !!shot.full,
      animations: 'disabled',
    })
    // Every state also has a full 360px capture for visual review.
    await page.setViewportSize({ width: 360, height: 960 })
    await page.evaluate(() => {
      window.scrollTo(0, 0)
      document.querySelector('main')?.scrollTo(0, 0)
    })
    await page.screenshot({
      path: resolve(qa, shot.file.replace('.png', '-360-full.png')),
      fullPage: true,
      animations: 'disabled',
    })
    const mobile = await dimensions(page)
    if (shot.path.includes('view=week')) {
      const days = page
        .getByLabel('Дни недели', { exact: true })
        .getByRole('button')
      await expect(days).toHaveCount(7)
      for (const day of await days.all()) await expect(day).toBeInViewport()
    }
    await page.setViewportSize({ width: 1280, height: 960 })
    await page.evaluate(() => {
      window.scrollTo(0, 0)
      document.querySelector('main')?.scrollTo(0, 0)
    })
    await page.screenshot({
      path: resolve(qa, shot.file.replace('.png', '-1280-full.png')),
      fullPage: true,
      animations: 'disabled',
    })
    const desktop = await dimensions(page)
    expect(desktop.scrollWidth, '1280px document overflow').toBeLessThanOrEqual(
      1280,
    )
    writeFileSync(
      resolve(qa, shot.file.replace('.png', '.json')),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          shot,
          primary,
          mobile,
          desktop,
          ...audit,
        },
        null,
        2,
      ),
    )
    expect(audit.unexpected, 'unhandled API calls').toEqual([])
    expect(audit.pageerrors, 'browser pageerrors').toEqual([])
    expect(
      primary.scrollWidth,
      'primary document overflow',
    ).toBeLessThanOrEqual(primary.width)
    expect(mobile.scrollWidth, '360px document overflow').toBeLessThanOrEqual(
      360,
    )
  })
}

test('gallery: every PNG loads and gallery fits desktop/mobile', async ({
  page,
}) => {
  test.setTimeout(90_000)
  test.skip(
    process.env.REDESIGN_GALLERY_CHECK !== '1',
    'Run after build_gallery.py',
  )
  const slides = read(resolve(root, 'manifest.json'))
  expect(
    slides
      .flatMap((s: any) => s.variants)
      .map((v: any) => v.file)
      .sort(),
  ).toEqual(shots.map((s) => s.file).sort())
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/tour-gallery/**', (route) => {
    const path = new URL(route.request().url()).pathname.split(
      '/tour-gallery/',
    )[1]
    const target = resolve(root, path.startsWith('png/') ? path.slice(4) : path)
    if (!target.startsWith(root + '/')) return route.abort()
    return route.fulfill({
      body: readFileSync(target),
      contentType: path.endsWith('.png') ? 'image/png' : 'text/html',
    })
  })
  const checks = []
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 960 })
    await page.goto('tour-gallery/index.html')
    for (let i = 0; i < slides.length; i++) {
      await page.locator('#screen').selectOption(String(i))
      const variants = slides[i].variants
      for (let v = 0; v < variants.length; v++) {
        if (variants.length > 1)
          await page.locator('#variants button').nth(v).click()
        await expect(page.locator('#picture')).toHaveAttribute(
          'src',
          `png/${variants[v].file}`,
        )
        await expect
          .poll(() =>
            page
              .locator('#picture')
              .evaluate(
                (im: HTMLImageElement) => im.complete && im.naturalWidth,
              ),
          )
          .toBe(variants[v].width)
      }
    }
    const size = await dimensions(page)
    checks.push(size)
    await page.screenshot({
      path: resolve(qa, `gallery-${width}.png`),
      fullPage: true,
    })
    expect(size.scrollWidth).toBeLessThanOrEqual(width)
  }
  writeFileSync(
    resolve(root, 'gallery-checks.json'),
    JSON.stringify(
      { checks, pageerrors: errors, pngCount: shots.length },
      null,
      2,
    ),
  )
  expect(errors).toEqual([])
})
