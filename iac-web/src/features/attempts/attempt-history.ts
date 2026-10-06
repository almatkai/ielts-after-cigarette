import type { AttemptListItem } from './api'

export function completedAttempts(items: AttemptListItem[]) {
  return items
    .filter((item) => item.status === 'SUBMITTED')
    .sort(
      (a, b) =>
        (b.submittedAt ?? b.startedAt).localeCompare(
          a.submittedAt ?? a.startedAt,
        ) || b.id.localeCompare(a.id),
    )
}

export function summarizeMaterialAttempts(items: AttemptListItem[]) {
  const completed = completedAttempts(items)
  const active = items
    .filter(
      (item) => item.status === 'IN_PROGRESS' || item.status === 'PROCESSING',
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .at(0)
  return {
    latest: completed.at(0),
    previous: completed.at(1),
    count: completed.length,
    active,
  }
}

export function bandChange(
  current: AttemptListItem,
  previous?: AttemptListItem,
) {
  if (current.band == null || previous?.band == null) return null
  return current.band - previous.band
}

export function previousMaterialAttempt(
  items: AttemptListItem[],
  index: number,
) {
  const current = items[index]
  return items
    .slice(index + 1)
    .find(
      (item) =>
        item.materialType === current.materialType &&
        item.materialId === current.materialId,
    )
}
