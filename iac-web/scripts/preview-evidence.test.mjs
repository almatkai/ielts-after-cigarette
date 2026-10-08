import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findQuoteRange } from '../src/features/admin/preview-evidence.ts'

test('locates evidence without changing passage offsets or displaying HTML', () => {
  const body =
    'Before. It’s\n  the CURRENT saved passage. After. <script>text</script>'
  const range = findQuoteRange(body, "It's the current saved passage.")
  assert.deepEqual(range, { start: 8, end: body.indexOf(' After.') })
  assert.equal(
    body.slice(range.start, range.end),
    'It’s\n  the CURRENT saved passage.',
  )
  const htmlRange = findQuoteRange(body, '<script>text</script>')
  assert.equal(
    body.slice(htmlRange.start, htmlRange.end),
    '<script>text</script>',
  )
})

test('missing and blank quotes never invent evidence', () => {
  assert.equal(findQuoteRange('A real passage', ''), null)
  assert.equal(findQuoteRange('A real passage', '   '), null)
  assert.equal(findQuoteRange('A real passage', 'Wrong version quote'), null)
  assert.equal(findQuoteRange('', 'quote'), null)
})

test('preserves unicode offsets and handles curly double quotes', () => {
  const body = '🌿 Intro. “Birds fly” is the evidence.'
  const range = findQuoteRange(body, '"Birds fly"')
  assert.deepEqual(range, { start: 10, end: 21 })
  assert.equal(body.slice(range.start, range.end), '“Birds fly”')
})
