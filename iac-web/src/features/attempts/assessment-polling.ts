import type { AttemptStatus } from './api'

// Count successful status reads, not renders; cap polling at one read per 10s.
export function assessmentPollInterval(
  status: AttemptStatus | undefined,
  updateCount: number,
): number | false {
  if (status !== undefined && status !== 'PROCESSING') return false
  if (updateCount < 2) return 2_000
  if (updateCount < 4) return 5_000
  return 10_000
}

export function assessmentNeedsDetailRefresh(
  detailStatus: AttemptStatus | undefined,
  latestStatus: AttemptStatus | undefined,
): boolean {
  return (
    detailStatus === 'PROCESSING' &&
    latestStatus !== undefined &&
    latestStatus !== 'PROCESSING'
  )
}
