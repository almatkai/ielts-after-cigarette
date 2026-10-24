import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addDays,
  daysBetween,
  isCalendarDate,
  parsePlanSearch,
  studyTarget,
  weekStart,
  weeklyOfferDate,
} from '../src/features/study-plan/calendar.ts'
import { qualifiedBand } from '../src/features/study-plan/evidence.ts'

test('calendar arithmetic preserves date-only days across DST and leap boundaries in any browser zone', () => {
  const previous = process.env.TZ
  try {
    for (const zone of [
      'Pacific/Honolulu',
      'Asia/Almaty',
      'America/New_York',
      'Pacific/Kiritimati',
    ]) {
      process.env.TZ = zone
      assert.equal(addDays('2026-03-08', 1), '2026-03-09')
      assert.equal(addDays('2026-11-01', -1), '2026-10-31')
      assert.equal(addDays('2028-02-28', 1), '2028-02-29')
      assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2)
      assert.equal(weekStart('2026-10-25'), '2026-10-19')
    }
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
})
test('URL calendar validation rejects rollover and never invents client today', () => {
  assert.equal(isCalendarDate('2026-02-29'), false)
  assert.equal(isCalendarDate('2028-02-29'), true)
  assert.equal(isCalendarDate('2026-13-01'), false)
  assert.deepEqual(parsePlanSearch({ date: '2026-10-24', view: 'week' }), {
    date: '2026-10-24',
    view: 'week',
  })
  assert.deepEqual(parsePlanSearch({ date: '2026-02-30', view: 'bad' }), {
    date: undefined,
    view: 'day',
  })
})
test('server navigation targets preserve app base exactly once and reject foreign destinations', () => {
  assert.equal(studyTarget('/app/exam/reading/id?x=1'), '/exam/reading/id?x=1')
  assert.equal(studyTarget('/attempts/id'), '/attempts/id')
  for (const target of [
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/app/../admin/users',
    '/login',
    'javascript:alert(1)',
  ])
    assert.equal(studyTarget(target), null)
})
test('pending/failed and automatic Writing/Speaking can never count as qualified bands', () => {
  const evidence = {
    skill: 'reading',
    band: 7,
    status: 'CONFIRMED',
    source: 'official conversion',
  }
  assert.equal(qualifiedBand(evidence), 7)
  for (const status of [
    'PENDING',
    'AWAITING_RESULT',
    'PROCESSING',
    'FAILED',
    'MISSING',
  ])
    assert.equal(qualifiedBand({ ...evidence, status }), null)
  for (const skill of ['writing', 'speaking']) {
    assert.equal(qualifiedBand({ ...evidence, skill, source: 'AI' }), null)
    assert.equal(
      qualifiedBand({ ...evidence, skill, source: 'human examiner' }),
      7,
    )
    assert.equal(
      qualifiedBand({
        ...evidence,
        skill,
        source: 'human examiner',
        status: 'PENDING',
      }),
      null,
    )
  }
  assert.equal(
    qualifiedBand({ ...evidence, band: null, practiceBand: 9 }),
    null,
  )
})

test('offer day uses ISO selected weekdays rather than rest overrides', () => {
  assert.equal(
    weeklyOfferDate(
      { startDate: '2026-10-19', endDate: '2026-10-25' },
      [1, 2, 3, 4, 5, 6],
    ),
    '2026-10-24',
  )
  assert.equal(
    weeklyOfferDate(
      { startDate: '2026-10-22', endDate: '2026-10-28' },
      [1, 2, 3, 4, 5, 6, 7],
    ),
    '2026-10-28',
  )
})
