import { apiClient } from '@/lib/api/client'

export type AnalyticsDays = 7 | 14 | 30 | 90 | 180

export type AnalyticsTotals = {
  registeredUsers: number
  waitlistPending: number
  waitlistLeads: number
  waitlistConverted: number
  registeredToday: number
  registered7d: number
  registered30d: number
  waitlistToday: number
  waitlist7d: number
  dau: number
  wau: number
  mau: number
  attemptsToday: number
  submittedToday: number
  fullMocksStarted: number
  fullMocksSubmitted: number
}

export type AnalyticsDailyPoint = {
  day: string
  registrations: number
  waitlistJoins: number
  activeUsers: number
  attempts: number
  submitted: number
  visitors: number
  pageViews: number
}

export type AnalyticsSkill = {
  skill: string
  started: number
  submitted: number
  abandoned: number
  users: number
  averageBand: number | null
  medianDurationSec: number | null
}

export type AnalyticsOverview = {
  days: number
  timeZone: string
  totals: AnalyticsTotals
  daily: AnalyticsDailyPoint[]
  skills: AnalyticsSkill[]
  funnel: { step: string; users: number }[]
  sources: { source: string; users: number }[]
  heatmap: { weekday: number; hour: number; attempts: number }[]
  cohorts: { week: string; size: number; retained: number[] }[]
  generatedAt: string
}

export type PageCount = { path: string; count: number }

export type AnalyticsRealtime = {
  available: boolean
  onlineUsers: number
  onlineVisitors: number
  visitorsToday: number
  pageViewsToday: number
  activePages: PageCount[]
  topPagesToday: PageCount[]
  windowSeconds: number
  generatedAt: string
}

export const analyticsDatasets = [
  { id: 'users', label: 'Пользователи' },
  { id: 'attempts', label: 'Попытки' },
  { id: 'activity', label: 'Активность по дням' },
  { id: 'full_mocks', label: 'Full Mock сессии' },
] as const

export type AnalyticsDataset = (typeof analyticsDatasets)[number]['id']

export const analyticsQueryKeys = {
  overview: (days: AnalyticsDays) =>
    ['admin', 'analytics', 'overview', days] as const,
  realtime: ['admin', 'analytics', 'realtime'] as const,
}

export function getAnalyticsOverview(
  days: AnalyticsDays,
  signal?: AbortSignal,
) {
  return apiClient.request<AnalyticsOverview>(
    `/api/v1/admin/analytics/overview?days=${days}`,
    { signal },
  )
}

export function getAnalyticsRealtime(signal?: AbortSignal) {
  return apiClient.request<AnalyticsRealtime>(
    '/api/v1/admin/analytics/realtime',
    { signal },
  )
}

export function exportAnalyticsDataset(
  dataset: AnalyticsDataset,
  days: AnalyticsDays | null,
) {
  const query = days ? `?days=${days}` : ''
  return apiClient.blob(`/api/v1/admin/analytics/export/${dataset}${query}`)
}

export function sendAnalyticsPing(body: {
  visitorId: string
  path: string
  view: boolean
}) {
  return apiClient.request<void>('/api/v1/analytics/ping', {
    method: 'POST',
    body,
    retryAuthentication: false,
    keepalive: true,
  })
}
