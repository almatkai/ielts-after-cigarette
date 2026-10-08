import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateRetryAnswer } from '../src/features/attempts/retry-answer.ts'
import { withReviewMaterial } from '../src/features/attempts/review-material.ts'
import { getReviewAudioRange } from '../src/features/attempts/review-audio-range.ts'

test('approximate audio alignment replays the full bridge quote with context', () => {
  assert.deepEqual(getReviewAudioRange(137.3, 141.5), { start: 133, end: 143 })
  assert.deepEqual(getReviewAudioRange(0.5, 3.2, 4), { start: 0, end: 4 })
  assert.deepEqual(getReviewAudioRange(10, 12, 12.5), { start: 6, end: 12.5 })
})

test('missing or invalid audio timestamps do not fabricate a replay range', () => {
  for (const [start, end, duration] of [
    [undefined, 5],
    [2, undefined],
    [NaN, 5],
    [2, Infinity],
    [-2, 5],
    [5, 5],
    [5, 2],
    [20, 25, 10],
  ])
    assert.equal(getReviewAudioRange(start, end, duration), undefined)
})

test('multiple choice requires the full answer including duplicate counts', () => {
  const correct = { optionIds: ['A', 'C'] }
  assert.equal(evaluateRetryAnswer({ optionIds: ['C', 'A'] }, correct), true)
  for (const given of [
    { optionIds: ['A'] },
    { optionIds: ['A', 'A'] },
    { optionIds: ['A', 'B'] },
  ]) {
    assert.equal(evaluateRetryAnswer(given, correct), false)
  }
  assert.equal(evaluateRetryAnswer({ optionId: 'a' }, { optionId: 'A' }), false)
})

test('accepted text uses exam normalization without TFNG/YNNG aliases', () => {
  assert.equal(
    evaluateRetryAnswer(
      { value: ' Green Street ' },
      { accepted: ['green street'] },
    ),
    true,
  )
  assert.equal(evaluateRetryAnswer({ value: '  ' }, { accepted: [''] }), false)
  assert.equal(
    evaluateRetryAnswer({ value: 'not_given' }, { value: 'NOT_GIVEN' }),
    true,
  )
  assert.equal(evaluateRetryAnswer({ value: 'YES' }, { value: 'TRUE' }), false)
  assert.equal(evaluateRetryAnswer({ value: 'FALSE' }, { value: 'NO' }), false)
})

test('reading matches question IDs instead of fixed passage number ranges', () => {
  const item = { questionId: 'second', number: 2, prompt: 'Q2' }
  const material = {
    passages: [
      {
        title: 'First',
        body: 'First passage',
        questionGroups: [{ questions: [{ id: 'first', content: {} }] }],
      },
      {
        title: 'Second',
        body: 'Second passage',
        questionGroups: [
          {
            type: 'short_answer',
            instructions: 'ONE WORD',
            questions: [{ id: 'second', content: {} }],
          },
        ],
      },
    ],
  }
  const result = withReviewMaterial(item, material)
  assert.equal(result.passageBody, 'Second passage')
  assert.equal(result.content.instructions, 'ONE WORD')
  assert.equal(
    withReviewMaterial({ ...item, questionId: 'missing' }, material)
      .passageBody,
    undefined,
  )
})

test('listening restores completion context and group options from pinned material', () => {
  const item = { questionId: 'gap', number: 1, prompt: '{{answer}}' }
  const material = {
    parts: [
      {
        audioAssetId: 'audio',
        groups: [
          {
            type: 'form_completion',
            instructions: 'ONE WORD',
            context: 'Photos not in a {{1}} or album.',
            imageAssetId: null,
            config: { options: [{ id: 'A', text: 'A real option' }] },
            questions: [{ id: 'gap', content: {} }],
          },
        ],
      },
    ],
  }
  const result = withReviewMaterial(item, material)
  assert.equal(result.prompt, 'Photos not in a _____ or album.')
  assert.equal(result.audioAssetId, 'audio')
  assert.equal(result.content.options[0].text, 'A real option')
  assert.equal(item.prompt, '{{answer}}')
})
