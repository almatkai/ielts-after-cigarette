import { z } from 'zod'

import type { MistakeDetail } from '@/features/attempts/api'

export const mistakesSearchSchema = z.object({
  skill: z
    .enum(['reading', 'listening', 'writing', 'speaking'])
    .default('reading')
    .catch('reading'),
  page: z.number().int().min(1).max(100000).default(1).catch(1),
  attempt: z.uuid().optional().catch(undefined),
})

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
