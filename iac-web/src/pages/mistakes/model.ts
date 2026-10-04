import type { SearchSchemaInput } from '@tanstack/react-router'
import type {
  AttemptMaterialType,
  MistakeDetail,
} from '@/features/attempts/api'

type MistakesSearch = {
  skill: AttemptMaterialType
  page: number
  attempt?: string
}

// Match z.uuid(): RFC UUID versions 1–8, plus nil/max UUIDs. Keep this tiny
// parser in the route config instead of pulling all of Zod into the entry JS.
const uuidPattern =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i

export const mistakesSearchSchema = {
  parse(search: Record<string, unknown>): MistakesSearch {
    const skill =
      search.skill === 'listening' ||
      search.skill === 'writing' ||
      search.skill === 'speaking'
        ? search.skill
        : 'reading'
    const page =
      typeof search.page === 'number' &&
      Number.isInteger(search.page) &&
      search.page >= 1 &&
      search.page <= 100000
        ? search.page
        : 1
    const attempt =
      typeof search.attempt === 'string' && uuidPattern.test(search.attempt)
        ? search.attempt
        : undefined
    return { skill, page, ...('attempt' in search ? { attempt } : {}) }
  },
}

export function validateMistakesSearch(
  search: Record<string, unknown> & SearchSchemaInput,
) {
  return mistakesSearchSchema.parse(search)
}

export function hydrateMistake(detail: MistakeDetail, index: number) {
  const item = detail.review.at(index)
  if (index < 0 || !item) return null
  return { ...item, ...detail.contexts[item.contextIndex] }
}

export function mistakeCountLabel(count: number) {
  const lastTwo = count % 100
  const last = count % 10
  const word =
    lastTwo >= 11 && lastTwo <= 14
      ? 'ошибок'
      : last === 1
        ? 'ошибка'
        : last >= 2 && last <= 4
          ? 'ошибки'
          : 'ошибок'
  return `${count} ${word}`
}
