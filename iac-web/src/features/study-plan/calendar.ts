// Calendar-only arithmetic: UTC is a neutral arithmetic frame, never the browser's timezone.
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T12:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}
export function addDays(value: string, count: number) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}
export function daysBetween(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) /
      86400000,
  )
}
export function weekStart(value: string) {
  const day = new Date(`${value}T12:00:00Z`).getUTCDay() || 7
  return addDays(value, 1 - day)
}
export function weeklyOfferDate(
  week: { startDate: string; endDate: string },
  studyDays: number[],
) {
  const dates = Array.from(
    { length: daysBetween(week.startDate, week.endDate) + 1 },
    (_, i) => addDays(week.startDate, i),
  )
  return (
    dates
      .filter((date) =>
        studyDays.includes(new Date(`${date}T12:00:00Z`).getUTCDay() || 7),
      )
      .at(-1) ?? week.endDate
  )
}
export function formatCalendar(value: string, weekday = false) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    ...(weekday ? { weekday: 'short' as const } : {}),
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`))
}
export type PlanView = 'day' | 'week' | 'month'
export function parsePlanSearch(search: Record<string, unknown>): {
  view: PlanView
  date?: string
} {
  return {
    view:
      search.view === 'week' || search.view === 'month'
        ? search.view
        : ('day' as const),
    date: isCalendarDate(search.date) ? search.date : undefined,
  }
}
// Server targets are app-relative. Reject external/protocol URLs and preserve /app basepath.
export function studyTarget(value: string) {
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\r\n]/.test(value)
  )
    return null
  const base = new URL('https://iac.invalid/app/')
  const url = new URL(value, base)
  if (url.origin !== base.origin) return null
  const path = url.pathname.replace(/^\/app(?=\/|$)/, '') || '/'
  const drill = /^\/study-plan\/learning\/drills\/([a-zA-Z0-9_-]+)$/.exec(path)
  if (drill) return `/plan/learning/drills/${drill[1]}`
  if (
    !/^\/(exam(?:\/|$)|attempts\/|full-mocks(?:\/|$)|practice(?:\/|$)|profile(?:\/|$)|reading(?:\/|$)|listening(?:\/|$)|writing(?:\/|$)|speaking(?:\/|$)|mistakes(?:\/|$))/.test(
      path,
    )
  )
    return null
  return `${path}${url.search}${url.hash}`
}
