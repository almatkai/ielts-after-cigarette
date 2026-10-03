export type EvidenceRange = { start: number; end: number }

// Keep offsets in the original text while tolerating typography and whitespace
// differences between an author's quote and the saved passage. No HTML parsing.
function normalizeWithOffsets(text: string) {
  let normalized = ''
  const offsets: EvidenceRange[] = []
  let index = 0
  for (const character of text) {
    const end = index + character.length
    const value = /\s/u.test(character)
      ? ' '
      : character.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').toLowerCase()
    if (value === ' ' && normalized.endsWith(' ')) {
      offsets[offsets.length - 1].end = end
    } else {
      normalized += value
      offsets.push(
        ...Array.from({ length: value.length }, () => ({ start: index, end })),
      )
    }
    index = end
  }
  return { normalized, offsets }
}

export function findQuoteRange(
  body: string,
  quote: string,
): EvidenceRange | null {
  const needle = normalizeWithOffsets(quote.trim()).normalized
  if (!needle) return null
  const { normalized, offsets } = normalizeWithOffsets(body)
  const index = normalized.indexOf(needle)
  if (index < 0) return null
  return {
    start: offsets[index].start,
    end: offsets[index + needle.length - 1].end,
  }
}
