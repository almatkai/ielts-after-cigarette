import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatDateTime } from '../src/lib/date.ts'

test('shared cached formatter preserves review/progress date output', () => {
  for (const value of [
    '',
    'not-a-date',
    '2026-10-04T12:31:07Z',
    '2024-02-29T23:59:00Z',
    '2026-03-29T01:30:00Z',
    '2026-10-25T01:30:00Z',
    '2026-10-04T12:31:07+06:00',
  ]) {
    const date = new Date(value)
    const previous = Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
    assert.equal(formatDateTime(value), previous)
  }
})
