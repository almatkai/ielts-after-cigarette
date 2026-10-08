import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { mistakesSearchSchema } from '../src/pages/mistakes/model.ts'

const previous = z.object({
  skill: z
    .enum(['reading', 'listening', 'writing', 'speaking'])
    .default('reading')
    .catch('reading'),
  page: z.number().int().min(1).max(100000).default(1).catch(1),
  attempt: z.uuid().optional().catch(undefined),
})

test('small search parser preserves the previous Zod defaults and validation', () => {
  for (const skill of [
    undefined,
    null,
    '',
    'READING',
    'reading',
    'listening',
    'writing',
    'speaking',
    5,
    ['reading'],
  ]) {
    for (const page of [
      undefined,
      null,
      '',
      '2',
      true,
      0,
      -1,
      1.5,
      1,
      100000,
      100001,
      NaN,
      Infinity,
    ]) {
      for (const attempt of [
        undefined,
        null,
        '',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'b7b2c7b9-8399-477a-962c-f2c079e88c76',
        'B7B2C7B9-8399-477A-962C-F2C079E88C76',
        'b7b2c7b9-8399-077a-962c-f2c079e88c76',
        'b7b2c7b9-8399-477a-062c-f2c079e88c76',
      ]) {
        const input = { skill, page, attempt, extra: 'ignored' }
        assert.deepEqual(
          mistakesSearchSchema.parse(input),
          previous.parse(input),
        )
      }
    }
  }
})
