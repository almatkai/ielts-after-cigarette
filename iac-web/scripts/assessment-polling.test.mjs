import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assessmentNeedsDetailRefresh,
  assessmentPollInterval,
} from '../src/features/attempts/assessment-polling.ts'

test('assessment polls only processing attempts with bounded backoff', () => {
  assert.equal(assessmentPollInterval(undefined, 0), 2000)
  assert.equal(assessmentPollInterval('PROCESSING', 1), 2000)
  assert.equal(assessmentPollInterval('PROCESSING', 2), 5000)
  assert.equal(assessmentPollInterval('PROCESSING', 3), 5000)
  assert.equal(assessmentPollInterval('PROCESSING', 4), 10000)
  assert.equal(assessmentPollInterval('PROCESSING', 999), 10000)
  for (const status of ['SUBMITTED', 'IN_PROGRESS', 'ABANDONED']) {
    assert.equal(assessmentPollInterval(status, 1), false)
  }
})

test('refreshes full detail on success, failure and abandonment, not job progress', () => {
  for (const status of ['SUBMITTED', 'IN_PROGRESS', 'ABANDONED']) {
    assert.equal(assessmentNeedsDetailRefresh('PROCESSING', status), true)
    assert.equal(assessmentNeedsDetailRefresh(status, status), false)
  }
  assert.equal(assessmentNeedsDetailRefresh('PROCESSING', 'PROCESSING'), false)
  assert.equal(assessmentNeedsDetailRefresh('PROCESSING', undefined), false)
  assert.equal(assessmentNeedsDetailRefresh(undefined, 'SUBMITTED'), false)
})
