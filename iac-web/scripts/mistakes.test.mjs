import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  mistakesSearchSchema,
  hydrateMistake,
  mistakeCountLabel,
} from '../src/pages/mistakes/model.ts'

test('bank search defaults and rejects invalid skills, pages and attempt IDs', () => {
  assert.deepEqual(mistakesSearchSchema.parse({}), {
    skill: 'reading',
    page: 1,
  })
  const invalid = mistakesSearchSchema.parse({
    skill: 'all',
    page: -1,
    attempt: 'foreign-string',
  })
  assert.equal(invalid.skill, 'reading')
  assert.equal(invalid.page, 1)
  assert.equal(invalid.attempt, undefined)
  for (const page of [0, 1.5, 100001, '2', Infinity]) {
    assert.equal(mistakesSearchSchema.parse({ page }).page, 1)
  }
  const attempt = 'b7b2c7b9-8399-477a-962c-f2c079e88c76'
  assert.deepEqual(
    mistakesSearchSchema.parse({ skill: 'listening', page: 3, attempt }),
    { skill: 'listening', page: 3, attempt },
  )
})

test('opening a question restores only its own shared passage or transcript', () => {
  const detail = {
    review: [
      {
        questionId: 'a',
        contextIndex: 1,
        prompt: 'A',
        answer: { value: 'wrong' },
      },
      { questionId: 'b', contextIndex: 0, prompt: 'B' },
    ],
    contexts: [
      { transcript: 'Listening context' },
      { passageBody: 'Reading context' },
    ],
  }
  assert.equal(hydrateMistake(detail, 0).passageBody, 'Reading context')
  assert.equal(hydrateMistake(detail, 0).transcript, undefined)
  assert.equal(hydrateMistake(detail, 1).transcript, 'Listening context')
  assert.deepEqual(hydrateMistake(detail, 0).answer, { value: 'wrong' })
  assert.equal(detail.review[0].passageBody, undefined)
  assert.equal(hydrateMistake(detail, 100), null)
})

test('mistake counts use readable Russian plurals', () => {
  for (const [count, label] of [
    [0, '0 ошибок'],
    [1, '1 ошибка'],
    [2, '2 ошибки'],
    [11, '11 ошибок'],
    [14, '14 ошибок'],
    [21, '21 ошибка'],
    [22, '22 ошибки'],
    [111, '111 ошибок'],
  ]) {
    assert.equal(mistakeCountLabel(count), label)
  }
})
